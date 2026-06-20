# Installation

```sh
npm install emoji-mixer
```

Current version: **1.3.1**

## Emoji Mix URL Generator

This module is designed to generate URLs for mixed emoji images using Google's Android Emoji Kitchen.  
It consists of several helper functions, an emoji data object and a list of supported emojis.

## Key Components

### Supported Emojis

`supportedEmojis` is an array of Unicode codepoint strings representing every emoji present in the Emoji Kitchen compatibility database.  
For instance, '1fa84' represents the 🪄 emoji, '1f600' represents the 😀 emoji, and so on.  
**To see the complete list of supported emojis, use the exported `supportedEmojis` array.**
### Emoji Data

This is a compressed JavaScript object containing Google Emoji Kitchen compatibility data.

The database uses two lookup tables:

- `$e` - Unique emoji Unicode codepoint strings.
- `$d` - Unique Emoji Kitchen release dates.

Each emoji key contains an array of compressed compatibility entries:

```js
[emojiIndex, dateIndex]
```

For example:

```js
{
    "$e": ["2615", "2648"],
    "$d": [20201001, 20260128],
    "2615": [
        [0, 0],
        [1, 1]
    ]
}
```

Use `checkSupported()` to retrieve expanded compatibility objects or `getExpandedEmojiCompatibilityData()` to expand the
entire database.

**To inspect the raw compatibility database, see `compatibility.json`.**

## Functions

- `toUnicode(input: string, oldToNew: boolean = false)`  
Validates and transforms an input into a Unicode representation.

- `googleRequestUrlEmojiPart(emoji: string)`  
Transforms an emoji Unicode representation for inclusion in a URL.

- `googleRequestUrl(emojiMixData{})`  
Generates a Google Emoji Kitchen image URL from an emoji combination object.

- `getEmojiCombo(leftEmoji: string, rightEmoji: string)`  
  Finds the newest matching Emoji Kitchen combination for a pair of emojis.  

  The function searches for compatible combinations in both directions and returns the newest matching entry.  
  The returned object reflects the combination exactly as it is stored in the Emoji Kitchen compatibility database. 
  Returns:  
  ```js
   {
      leftEmoji: string,
      rightEmoji: string,
      date: string
  }
  ```
  or `undefined` if no compatible combination exists.

- `getExpandedEmojiCompatibilityData(useCache: boolean = false)`  
  Returns a fully expanded version of the compressed compatibility database.  
  When `useCache` is enabled, the expanded database is cached and reused on subsequent calls.

- `getEmojiMixUrl(leftEmoji: string, rightEmoji: string, detailedErrors: boolean = false, oldToNew: boolean = false)`  
  Generates a URL for an emoji mix image from Google's Android Emoji Kitchen based on the Unicode representation of two input emojis.

- `checkSupported(emoji: string, oldToNew: boolean = false)`  
  Checks whether an emoji is supported.

  Returns an array of expanded compatibility objects:

  ```js
  {
      leftEmoji: string,
      rightEmoji: string,
      date: string
  }
  ```

  or `null` if the emoji is unsupported.

## Usage

Import the main function from the module using ES syntax:

```javascript
// getEmojiMixUrl is the main function,
// while the other helper functions are imported through {}
import getEmojiMixUrl, {
    toUnicode, getEmojiCombo, checkSupported, googleRequestUrl, googleRequestUrlEmojiPart
} from 'emoji-mixer';

// Example usage.
console.log(getEmojiMixUrl('🔥', '😃'));
```

Alternatively you can use the CommonJS syntax:

```javascript
// Code enclosed in an asynchronous IIFE
// as await is needed to import ES modules into CommonJS
(async () =>
{
    const emojiMix = await import("emoji-mixer");

    const {
        toUnicode,
        getEmojiCombo,
        checkSupported,
        googleRequestUrl,
        googleRequestUrlEmojiPart,
        getExpandedEmojiCompatibilityData,
    } = emojiMix;

    console.log(emojiMix.default("🔥", "😃"));
})();
```

## Attributions

- Created by MattFor | Discord tag: mattfor | [Github](https://github.com/MattFor)
- Inspired by [emoji-kitchen](https://github.com/xsalazar/emoji-kitchen) [made by Xavier Salazar a.k.a [xsalazar](https://github.com/xsalazar)]
