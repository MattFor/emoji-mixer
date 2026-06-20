/**
 * `Emoji Mix URL Generator` Version 1.3.0
 *
 * Created by MattFor (Discord: MattFor#9884 (currently: mattfor)) on May 30, 2023.
 * Contact: mattfor@relaxy.xyz
 *
 * Licensed under the MIT Licence.
 *
 * This module provides functionality for generating URLs for mixed emoji images
 * using Google's Android Emoji Kitchen. It includes a main function, `getEmojiMixUrl`,
 * which takes two emoji inputs and generates a URL for fetching a mixed emoji image
 * based on these inputs.
 *
 * The module also includes several helper functions:
 *
 * `toUnicode`: Converts a string input into a Unicode representation.
 *
 * `getEmojiCombo`: Finds a matching emoji combination from the emojiCompatibilityData object.
 *
 * `checkSupported`: Checks if an emoji is supported.
 *
 * `googleRequestUrl`: Generates a URL for fetching an emoji combination image.
 *
 * `googleRequestUrlEmojiPart`: Transforms an emoji Unicode representation for inclusion in a URL.
 *
 * The module uses data from the `emojiCompatibilityData` and `supportedEmojis` objects to validate emojis and
 * to find matching emoji combinations. The `baseUrl` string is used as the base URL for fetching
 * emoji images from Google's Android Emoji Kitchen.
 */

"use strict";

import emojiRegex from "emoji-regex";
// noinspection JSUnresolvedReference
import { supportedEmojis, emojiCompatibilityData } from "./data.js";

/**
 * The base URL for fetching emoji images from Google's Android Emoji Kitchen.
 */
const baseUrl = "https://www.gstatic.com/android/keyboard/emojikitchen";

let _cachedExpandedEmojiCompatibilityData = null;

/**
 * Expands a compressed compatibility entry from `emojiCompatibilityData`
 * into the legacy object format used throughout the library.
 *
 * The compressed format stores:
 *
 * - `emojiIndex` -> index into `emojiCompatibilityData.$e`
 * - `dateIndex` -> index into `emojiCompatibilityData.$d`
 *
 * Numeric emoji values are converted back into lowercase hexadecimal
 * Unicode codepoint strings to match the format used elsewhere in the API.
 *
 * @param {string} anchorEmoji
 * The emoji key whose compatibility list is being traversed.
 *
 * @param {[number, number]} combo
 * A compressed compatibility entry in the format:
 * `[emojiIndex, dateIndex]`.
 *
 * @returns {{
 *     leftEmoji: string,
 *     rightEmoji: string,
 *     date: string
 * }}
 */
const _getExpandedCombo = (anchorEmoji, combo) =>
{
    const [emojiIndex, dateIndex] = combo;

    let otherEmoji = emojiCompatibilityData.$e[emojiIndex];

    if (typeof otherEmoji === "number")
    {
        otherEmoji = otherEmoji.toString(16);
    }

    return {
        leftEmoji: anchorEmoji, rightEmoji: otherEmoji, date: String(emojiCompatibilityData.$d[dateIndex]),
    };
}

/**
 * Converts an emoji codepoint string into the compact storage format used
 * by `emojiCompatibilityData`.
 *
 * Single-codepoint emojis are stored as integers to reduce JSON size:
 *
 * - `"2615"` -> `9749`
 * - `"1f600"` -> `128512`
 *
 * Multi-codepoint emojis (containing `-`) remain strings because they
 * cannot be represented as a single integer value:
 *
 * - `"1f642-200d-2194-fe0f"` -> `"1f642-200d-2194-fe0f"`
 *
 * @param {string | undefined | null} emoji
 * A Unicode codepoint string.
 *
 * @returns {number | string | undefined | null}
 * The value in the format used by the compressed compatibility database.
 */
const _getStoredEmojiValue = emoji =>
{
    if (!emoji)
    {
        return emoji;
    }

    return emoji.includes("-") ? emoji : parseInt(emoji, 16);
}

// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Returns a fully expanded version of `emojiCompatibilityData`.
 *
 * The compressed lookup tables (`$e`, `$d`) are resolved into the legacy
 * object format:
 *
 * {
 *     "2615": [
 *         {
 *             leftEmoji: "2615",
 *             rightEmoji: "2648",
 *             date: "20260128"
 *         }
 *     ]
 * }
 *
 * @param {boolean} [useCache=false]
 * Whether to cache the expanded result. When enabled, the first call
 * generates and stores the expanded data and all future calls return
 * the cached object.
 *
 * @returns {Object.<string, Array<{
 *     leftEmoji: string,
 *     rightEmoji: string,
 *     date: string
 * }>>}
 */
const getExpandedEmojiCompatibilityData = (useCache = false) =>
{
    if (useCache && _cachedExpandedEmojiCompatibilityData)
    {
        return _cachedExpandedEmojiCompatibilityData;
    }

    const expanded = {};

    for (const [emoji, combos] of Object.entries(emojiCompatibilityData))
    {
        if (emoji.startsWith("$"))
        {
            continue;
        }

        expanded[emoji] = combos.map(combo => _getExpandedCombo(emoji, combo));
    }

    if (useCache)
    {
        _cachedExpandedEmojiCompatibilityData = expanded;
    }

    return expanded;
}

/**
 * Transforms an emoji Unicode representation for inclusion in a URL.
 * This includes prefixing each Unicode part with 'u' and joining the parts with hyphens.
 *
 * @param {string} emoji - The emoji's Unicode representation.
 *
 * @returns {string} The transformed Unicode representation suitable for inclusion in a URL.
 *
 * @example
 * console.log(googleRequestUrlEmojiPart('1f603'));
 */
const googleRequestUrlEmojiPart = emoji =>
{
    return emoji.split("-").map(part => `u${part.toLowerCase()}`).join("-");
}

/**
 * Validates and transforms an input into a Unicode representation.
 * If the input is already a Unicode representation, it returns the lowercased version.
 * If the input is a valid emoji, it converts it to Unicode.
 * If the input is not a valid emoji or Unicode representation, it returns undefined.
 *
 * @param {string} input - The input string to convert.
 * @param {boolean} [oldToNew=false] - Whether to convert old unused Unicode emojis to new ones instead of throwing an error.
 *
 * @returns {string} The Unicode representation of the input, or undefined if the input is not valid.
 *
 * @throws {Error} If oldToNew is set to false and an outdated emoji is passed through it will throw an error notifying
 * about the incorrect use of emojis.
 *
 * @example
 * console.log(toUnicode('😃'));
 */
const toUnicode = (input, oldToNew = false) =>
{
    let candidate = "";

    // noinspection RegExpRedundantEscape
    if (/^[\da-f]+(?:-[\da-f]+)*$/i.test(input)) // Input is already a Unicode representation
    {
        candidate = input.toLowerCase();
    }
    else if (emojiRegex().test(input)) // Input is an emoji, convert it to Unicode
    {
        // Find the emoji within the supported ones that most closely matches the input string.
        candidate = input.codePointAt(0).toString(16);
    }
    else
    {
        candidate = undefined;
    }

    if (candidate)
    {
        candidate = supportedEmojis.find(e => e.startsWith(candidate));
    }
    else
    {
        return candidate; // undefined
    }

    // Make sure it's supported.
    if (!emojiCompatibilityData[candidate])
    {
        if (oldToNew)
        {
            candidate = `${(input.codePointAt(0) + 204).toString(16)}-fe0f`;
        }
        else
        {
            throw new Error(`'${candidate}' / '${input}' is not a supported Unicode emoji anymore. (It is outdated) ${candidate !== undefined ? `Visit https://unicodeplus.com/U+${candidate} to learn more about it.` : ""}`);

        }
    }

    return candidate;
}

// noinspection JSUnusedGlobalSymbols
/**
 * Checks whether an emoji is supported by Google Emoji Kitchen.
 *
 * If the emoji is supported, returns all compatible emoji combinations
 * in expanded form.
 *
 * Each returned object contains:
 *
 * - `leftEmoji` - The emoji that was queried.
 * - `rightEmoji` - A compatible emoji.
 * - `date` - The Emoji Kitchen release date for the combination.
 *
 * @param {string} emoji
 * An emoji character or Unicode codepoint string.
 *
 * @param {boolean} [oldToNew=false]
 * Whether to convert deprecated Unicode emoji representations to their
 * modern equivalents instead of throwing an error.
 *
 * @returns {{
 *     leftEmoji: string,
 *     rightEmoji: string,
 *     date: string
 * }[] | null}
 * An array of expanded compatibility entries, or `null` if the emoji
 * is unsupported or invalid.
 *
 * @example
 * const coffee = checkSupported("☕");
 *
 * console.log(coffee?.[0]);
 * // {
 * //   leftEmoji: "2615",
 * //   rightEmoji: "2615",
 * //   date: "20201001"
 * // }
 */
const checkSupported = (emoji, oldToNew = false) =>
{
    emoji = toUnicode(emoji, oldToNew);

    if (!emoji)
    {
        return null;
    }

    const combos = emojiCompatibilityData[emoji];

    if (!combos)
    {
        return null;
    }

    return combos.map(combo => _getExpandedCombo(emoji, combo));
}

/**
 * Generates a URL for fetching an emoji combination image from Google's Android Emoji Kitchen.
 * The URL includes the base URL, the date, and the transformed Unicode representations of the left and right emojis.
 *
 * @param {Object} emojiMixData - The object containing data for generating the URL.
 * @param {string} emojiMixData.leftEmoji - The Unicode representation of the left emoji.
 * @param {string} emojiMixData.rightEmoji - The Unicode representation of the right emoji.
 * @param {string} emojiMixData.date - The date in YYYYMMDD format.
 *
 * @returns {string} The URL for fetching the emoji combination image.
 *
 * @example
 * console.log(googleRequestUrl({
 *     leftEmoji: '1fa84',
 *     rightEmoji: '2615',
 *     date: '20230301'
 * }));
 */
const googleRequestUrl = emojiMixData =>
{
    const { leftEmoji, rightEmoji, date } = emojiMixData;

    const leftEmojiUrlPart = googleRequestUrlEmojiPart(leftEmoji);
    const rightEmojiUrlPart = googleRequestUrlEmojiPart(rightEmoji);

    return `${baseUrl}/${date}/${leftEmojiUrlPart}/${leftEmojiUrlPart}_${rightEmojiUrlPart}.png`;
}

/**
 * Finds the newest matching Emoji Kitchen combination for a pair of emojis.
 *
 * The function searches for a matching pair of emojis (`leftEmoji` and
 * `rightEmoji`) in both possible orders. If multiple matches exist, the
 * newest (most recent date) match is returned.
 *
 * By default, the returned combination is normalized so that:
 *
 * `getEmojiCombo(a, b)` and `getEmojiCombo(b, a)`
 *
 * return the same result. This makes compatibility lookups order-independent.
 *
 * When `preserveInputOrder` is enabled, the returned object preserves the
 * original argument order while still using the newest matching
 * compatibility entry's date.
 *
 * @param {string} leftEmoji
 * The Unicode representation of the left emoji.
 *
 * @param {string} rightEmoji
 * The Unicode representation of the right emoji.
 *
 * @param {boolean} [preserveInputOrder=false]
 * Whether the returned object's `leftEmoji` and `rightEmoji` fields should
 * preserve the order of the input arguments. When `false`, the returned
 * combination is normalized so that argument order does not affect the
 * result.
 *
 * @returns {{
 *     leftEmoji: string,
 *     rightEmoji: string,
 *     date: string
 * } | undefined}
 * The newest matching emoji combination, or `undefined` if no compatible
 * combination exists.
 *
 * @example
 * const combo = getEmojiCombo("2615", "2648");
 * // {
 * //   leftEmoji: "2615",
 * //   rightEmoji: "2648",
 * //   date: "20260128"
 * // }
 *
 * @example
 * getEmojiCombo("2615", "2648");
 * getEmojiCombo("2648", "2615");
 * // Returns the same object in both cases.
 *
 * @example
 * const combo = getEmojiCombo("2648", "2615", true);
 * // {
 * //   leftEmoji: "2648",
 * //   rightEmoji: "2615",
 * //   date: "20260128"
 * // }
 */
const getEmojiCombo = (leftEmoji, rightEmoji, preserveInputOrder = false) =>
{
    const emojiTable = emojiCompatibilityData.$e;
    const wantedLeft = _getStoredEmojiValue(leftEmoji);
    const wantedRight = _getStoredEmojiValue(rightEmoji);

    let newest = null;
    let newestDate = -1;

    const search = (anchorEmoji, wantedStoredValue) =>
    {
        const combos = emojiCompatibilityData[anchorEmoji];

        if (!combos)
        {
            return;
        }

        for (const combo of combos)
        {
            const [emojiIndex] = combo;

            if (emojiTable[emojiIndex] !== wantedStoredValue)
            {
                continue;
            }

            const expanded = _getExpandedCombo(anchorEmoji, combo);
            const date = Number(expanded.date);

            if (date > newestDate)
            {
                newestDate = date;
                newest = expanded;
            }
        }
    };

    search(leftEmoji, wantedRight);

    if (leftEmoji !== rightEmoji)
    {
        search(rightEmoji, wantedLeft);
    }

    const normalizeCombo = combo =>
    {
        const [leftEmoji, rightEmoji] = [combo.leftEmoji, combo.rightEmoji].sort();

        return {
            leftEmoji, rightEmoji, date: combo.date,
        };
    };

    if (!newest)
    {
        return undefined;
    }

    return preserveInputOrder ? {
        leftEmoji, rightEmoji, date: newest.date,
    } : normalizeCombo(newest);
}

/**
 * This function generates a URL for an emoji mix image from Google's Android Emoji Kitchen
 * based on the Unicode representation of two input emojis.
 * It validates the input emojis, checks for compatibility,
 * and throws an error with additional information if the emojis are not valid or not compatible.
 *
 * @param {string} leftEmoji - The Unicode representation of the first emoji.
 * @param {string} rightEmoji - The Unicode representation of the second emoji.
 * @param {boolean} detailedErrors - Optional parameter.
 * If set to true, in case of an error, instead of undefined
 * a detailed explanation of what went wrong will be thrown instead.
 * @param {boolean} [oldToNew=false] - Whether to convert old unused Unicode emojis to new ones instead of throwing an error.
 *
 * @returns {string | undefined | null} - The URL for fetching the mixed emoji image,
 * undefined if something went wrong or null if no suitable image is available.
 * If detailedErrors is enabled it throws a detailed error message instead.
 *
 * @throws {Error} Should detailedErrors be set to true, will throw detailed errors regarding what
 * went wrong during execution.
 *
 * @example
 * console.log(getEmojiMixUrl('🔥', '😃'));
 */
const getEmojiMixUrl = (leftEmoji, rightEmoji, detailedErrors = false, oldToNew = false) =>
{
    leftEmoji = toUnicode(leftEmoji, oldToNew);
    rightEmoji = toUnicode(rightEmoji, oldToNew);

    // Double check
    // Left emoji argument is incompatible.
    if (!leftEmoji && !detailedErrors)
    {
        return undefined;
    }
    else if (!leftEmoji && detailedErrors)
    {
        throw new Error(`${leftEmoji} [leftEmoji] argument is not a valid Unicode emoji.`);
    }

    // Right emoji argument is incompatible.
    if (!rightEmoji && !detailedErrors)
    {
        return undefined;
    }

    if (!rightEmoji && detailedErrors)
    {
        throw new Error(`${rightEmoji} [rightEmoji] argument is not a valid Unicode emoji.`);
    }

    // Left emoji isn't supported by Google Emoji Kitchen
    if (!supportedEmojis.includes(leftEmoji) && !detailedErrors)
    {
        return undefined;
    }
    else if (!supportedEmojis.includes(leftEmoji) && detailedErrors)
    {
        throw new Error(`${leftEmoji} [leftEmoji] argument is not a supported emoji.`);
    }

    // Right emoji isn't supported by Google Emoji Kitchen
    if (!supportedEmojis.includes(rightEmoji) && !detailedErrors)
    {
        return undefined;
    }
    else if (!supportedEmojis.includes(rightEmoji) && detailedErrors)
    {
        throw new Error(`${rightEmoji} [rightEmoji] argument is not a supported emoji.`);
    }

    const emojiMixData = getEmojiCombo(leftEmoji, rightEmoji);

    // This emoji combination isn't supported by Google Emoji Kitchen
    if (emojiMixData === undefined && !detailedErrors)
    {
        return undefined;
    }
    else if (emojiMixData === undefined && detailedErrors)
    {
        const compatible = emojiCompatibilityData[rightEmoji]
            ?.map(([emojiIndex]) =>
            {
                const value = emojiCompatibilityData.$e[emojiIndex];
                return typeof value === "number" ? value.toString(16) : value;
            })
            .join(", ") ?? "";

        throw new Error(`'${leftEmoji}' is not compatible with '${rightEmoji}'. Here are all emojis compatible with '${rightEmoji}':\n[` + compatible + "]");
    }

    return googleRequestUrl(emojiMixData) ?? null;
}

// noinspection JSUnusedGlobalSymbols
/**
 * Description of exported functions.
 *
 * The main function of this module is `getEmojiMixUrl`, which combines two emojis into a unique
 * emoji mix using Google's Android Emoji Kitchen, and generates the appropriate URL for fetching
 * this emoji mix image. This function takes in two emojis (in Unicode representation) and an optional
 * boolean flag indicating whether to show compatibility information in case of errors.
 *
 * Apart from the main function, this module also provides a number of helper functions:
 *
 * `toUnicode` - This function validates a given string input and transforms it into a Unicode representation.
 * If the input string is a valid emoji, it is converted to Unicode. If the input string is
 * not a valid emoji or Unicode representation, the function returns undefined.
 *
 * `getEmojiCombo` - This function searches the global `emojiCompatibilityData` object for a matching pair
 * of emojis and returns information about the matched emoji combination if one is found.
 * If no match is found, it returns undefined.
 *
 * `checkSupported` - This function checks if a given emoji is supported by looking it up in
 * the `emojiCompatibilityData` object. If the emoji is supported, it returns an array of emoji data associated
 * with this emoji; otherwise, it returns null.
 *
 * `googleRequestUrl` - This function generates a URL for fetching an emoji combination image
 * from Google's Android Emoji Kitchen. The URL includes the base URL, the date, and the transformed
 * Unicode representations of the left and right emojis.
 *
 * `googleRequestUrlEmojiPart` - This function transforms an emoji Unicode representation for
 * inclusion in a URL. This includes prefixing each Unicode part with 'u' and joining the parts
 * with hyphens.
 */ // Main function
export default getEmojiMixUrl;

// Helper functions & data
export {
    baseUrl,

    supportedEmojis, emojiCompatibilityData,

    toUnicode, getEmojiCombo, getExpandedEmojiCompatibilityData, checkSupported,

    googleRequestUrl, googleRequestUrlEmojiPart
}
