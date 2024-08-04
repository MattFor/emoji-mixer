/**
 * `Emoji Mix URL Generator` Version 1.1.12
 *
 * Created by MattFor (Discord: MattFor#9884 (currently: mattfor)) on May 30, 2023.
 * Contact: matthew-forester@protonmail.com
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
import { supportedEmojis, emojiCompatibilityData } from "./data.js";


/**
 * The base URL for fetching emoji images from Google's Android Emoji Kitchen.
 */
const baseUrl = "https://www.gstatic.com/android/keyboard/emojikitchen";

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
const googleRequestUrlEmojiPart = emoji =>  {
    return emoji.split("-").map(part => `u${part.toLowerCase()}`).join("-");
}

/**
 * Validates and transforms an input into a Unicode representation.
 * If the input is already a Unicode representation, it returns the lowercased version.
 * If the input is a valid emoji, it converts it to Unicode.
 * If the input is not a valid emoji or Unicode representation, it returns undefined.
 *
 * @param {string} input - The input string to convert.
 * @param {boolean} [oldToNew=false] - Whether to convert old unused unicode emojis to new ones instead of throwing an error.
 *
 * @returns {string} The Unicode representation of the input, or undefined if the input is not valid.
 *
 * @throws {Error} If oldToNew is set to false and an outdated emoji is passed through it will throw an error notifying
 * about the incorrect use of emojis.
 *
 * @example
 * console.log(toUnicode('😃'));
 */
const toUnicode = (input, oldToNew = false) => {
    let candidate = "";

    if (/^(([\da-f])|([\da-f]\-[\da-f]))+$/i.test(input)) // Input is already a Unicode representation
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
            throw new Error(`'${candidate}' / '${input}' is not a supported unicode emoji anymore. (It is outdated) ${candidate !== undefined ? `Visit https://unicodeplus.com/U+${candidate} to learn more about it.` : ""}`);

        }
    }

  return candidate;
}

/**
 * Checks if an emoji is supported by looking it up in the emojiCompatibilityData object.
 *
 * @param {string} emoji - An emoji or its Unicode representation as a string.
 * @param {boolean} [oldToNew=false] - Whether to convert old unused unicode emojis to new ones instead of throwing an error.
 *
 * @returns {Object[] | null} If the emoji is supported, it returns the array of
 * emoji data associated with this emoji; otherwise, it returns null.
 *
 * @example
 * const isSupported = checkSupported('😀');
 *
 * // Outputs the corresponding emoji data array if emoji is supported, otherwise outputs null
 * console.log(isSupported);
 */
const checkSupported = (emoji, oldToNew = false) => {
  // Convert the input emoji to its Unicode representation
  emoji = toUnicode(emoji, oldToNew);

  // If the conversion was unsuccessful, return null
  if (!emoji)
  {
      return null;
  }

  // If the emoji is supported, return its data; otherwise, return null
  return emojiCompatibilityData[emoji] ?? null;
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
const googleRequestUrl = emojiMixData => {
    const { leftEmoji, rightEmoji, date } = emojiMixData;

    const leftEmojiUrlPart = googleRequestUrlEmojiPart(leftEmoji);
    const rightEmojiUrlPart = googleRequestUrlEmojiPart(rightEmoji);

    return `${
        baseUrl
    }/${
        date
    }/${
        leftEmojiUrlPart
    }/${
        leftEmojiUrlPart
    }_${
        rightEmojiUrlPart
    }.png`;
}

/**
 * This function is used to find a matching emoji combination from the global emojiCompatibilityData object.
 * The function will search for a matching pair of emojis (leftEmoji and rightEmoji) in both
 * possible orders. If multiple matches are found, it sorts them in descending order by date
 * and returns the most recent match.
 *
 * @param {string} leftEmoji - The Unicode representation of the left emoji as a string.
 * @param {string} rightEmoji - The Unicode representation of the right emoji as a string.
 *
 * @returns {Object | undefined} If a matching emoji combination is found, it returns an object containing
 * information about the matched emoji combination. The object includes properties for the
 * left emoji, the right emoji, and the date when the emoji combination was added.
 * If no matching emoji combination is found, it returns undefined.
 *
 * @example
 * let emojiCombo = getEmojiCombo("1f600", "2615");
*/
const getEmojiCombo = (leftEmoji, rightEmoji) => {
    // Filter the emojiCompatibilityData for the specified rightEmoji to find matching combinations
    const matchingEmojis = emojiCompatibilityData[rightEmoji]
        .filter(emoji =>
            // Look for combinations where either the leftEmoji matches leftEmoji and the rightEmoji matches rightEmoji
            // or where the leftEmoji matches rightEmoji and the rightEmoji matches leftEmoji
            (emoji.leftEmoji === leftEmoji && emoji.rightEmoji === rightEmoji) ||
            (emoji.leftEmoji === rightEmoji && emoji.rightEmoji === leftEmoji)
        ).sort((a, b) => a.date > b.date ? -1 : 1); // Sort the matching combinations by date in descending order

    // If there's at least one matching combination, return the most recent (first in the sorted list)
    if (matchingEmojis.length > 0) {
        return matchingEmojis[0];
    }
    else
    {
        return undefined;
    }
}

/**
 * This function generates a URL for an emoji mix image from Google's Android Emoji Kitchen
 * based on the unicode representation of two input emojis.
 * It validates the input emojis, checks for compatibility,
 * and throws an error with additional information if the emojis are not valid or not compatible.
 *
 * @param {string} leftEmoji - The unicode representation of the first emoji.
 * @param {string} rightEmoji - The unicode representation of the second emoji.
 * @param {boolean} detailedErrors - Optional parameter.
 * If set to true, in case of an error, instead of undefined
 * a detailed explanation of what went wrong will be thrown instead.
 * @param {boolean} [oldToNew=false] - Whether to convert old unused unicode emojis to new ones instead of throwing an error.
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
const getEmojiMixUrl = (leftEmoji, rightEmoji, detailedErrors = false, oldToNew = false) => {
  leftEmoji = toUnicode(leftEmoji, oldToNew);
  rightEmoji = toUnicode(rightEmoji, oldToNew);

  // Left emoji argument is incompatible.
  if (!leftEmoji && !detailedErrors)
  {
      return undefined;
  }
  else if (!leftEmoji && detailedErrors)
  {
      throw new Error(`${leftEmoji} [leftEmoji] argument is not a valid unicode emoji.`);
  }

  // Right emoji argument is incompatible.
  if (!rightEmoji && !detailedErrors)
  {
      return undefined;
  }

  if (!rightEmoji && detailedErrors)
  {
      throw new Error(`${rightEmoji} [rightEmoji] argument is not a valid unicode emoji.`);
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
      throw new Error(`'${leftEmoji}' is not compatible with '${rightEmoji}'. Here are all emojis compatible with '${rightEmoji}':\n[${
          emojiCompatibilityData[rightEmoji].map(e => {
              return e.leftEmoji
          }).join(", ")
      }]`);
  }

  return googleRequestUrl(emojiMixData) ?? null;
}

/**
 * Description of exported functions.
 *
 * The main function of this module is `getEmojiMixUrl`, which combines two emojis into a unique
 * emoji mix using Google's Android Emoji Kitchen, and generates the appropriate URL for fetching
 * this emoji mix image. This function takes in two emojis (in unicode representation) and an optional
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
    supportedEmojis,
    emojiCompatibilityData,

    toUnicode,
    getEmojiCombo,
    checkSupported,
    googleRequestUrl,
    googleRequestUrlEmojiPart
};
