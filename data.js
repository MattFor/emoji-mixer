// noinspection JSUnusedGlobalSymbols

/**
 * `Emoji Mix URL Generator` Version 1.3.1
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

import emojiCompatibilityRaw from "./compatibility.json" with { type: "json" };

/**
 * `emojiCompatibilityData` is a compressed Emoji Kitchen compatibility database.
 *
 * Special lookup tables:
 *
 * - `$e` — Array of unique emoji Unicode codepoint strings.
 * - `$d` — Array of unique dates stored as integers in YYYYMMDD format.
 *
 * All other keys are emoji Unicode codepoint strings.
 *
 * Example:
 *
 * {
 *     "$e": ["2615", "2648"],
 *     "$d": [20201001, 20260128],
 *     "2615": [
 *         [0, 0],
 *         [1, 1]
 *     ]
 * }
 *
 * For emoji key `"2615"` (☕):
 *
 * Each entry is:
 *
 * [
 *     emojiIndex,
 *     dateIndex
 * ]
 *
 * where:
 *
 * - `emojiIndex` references an emoji in `$e`.
 * - `dateIndex` references a date in `$d`.
 *
 * The key itself represents one side of the combination (the anchor emoji).
 * The emoji referenced by `$e[emojiIndex]` represents the other side.
 *
 * The combination:
 *
 * [1, 1]
 *
 * under key `"2615"` expands to:
 *
 * {
 *     leftEmoji: "2615",
 *     rightEmoji: "2648",
 *     date: "20260128"
 * }
 *
 * - Deduplicated dates.
 * - Deduplicated emoji codepoints.
 */
const emojiCompatibilityData = emojiCompatibilityRaw;

/**
 * `supportedEmojis` is an array of Unicode code point strings.
 * Each string represents a Unicode codepoint sequence supported by
 * Google Emoji Kitchen and present in the compatibility database.
 *
 * For instance, '1fa84' represents the 🪄 emoji, '1f600' represents the 😀 emoji, and so on.
 *
 * This list dictates which emojis are supported by Google Emoji Kitchen.
 * If an emoji's Unicode representation is in this list, that means it's supported and can be used.
 * If it's not in this list, then it's not supported and should not be used.
 */
const supportedEmojis = Object.keys(emojiCompatibilityData)
    .filter(key => !key.startsWith("$"))
    .sort();

/**
 * Compressed Emoji Kitchen compatibility database.
 *
 * See the `emojiCompatibilityData` documentation above for the
 * database structure and compression format.
 */
export default emojiCompatibilityData;

export {
    supportedEmojis, emojiCompatibilityData
};
