# Emoji Mixer

[![CI](https://github.com/MattFor/emoji-mixer/actions/workflows/ci.yml/badge.svg)](https://github.com/MattFor/emoji-mixer/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/emoji-mixer)](https://www.npmjs.com/package/emoji-mixer)
[![PyPI](https://img.shields.io/pypi/v/emoji-mixer)](https://pypi.org/project/emoji-mixer/)
[![crates.io](https://img.shields.io/crates/v/emoji-mixer)](https://crates.io/crates/emoji-mixer)
[![Go Reference](https://pkg.go.dev/badge/github.com/MattFor/emoji-mixer/v2.svg)](https://pkg.go.dev/github.com/MattFor/emoji-mixer/v2)
[![JSR](https://jsr.io/badges/@mattfor/emoji-mixer)](https://jsr.io/@mattfor/emoji-mixer)
[![Packagist](https://img.shields.io/packagist/v/mattfor/emoji-mixer)](https://packagist.org/packages/mattfor/emoji-mixer)
[![Gem](https://img.shields.io/gem/v/emoji_mixer)](https://rubygems.org/gems/emoji_mixer)
[![NuGet](https://img.shields.io/nuget/v/EmojiMixer)](https://www.nuget.org/packages/EmojiMixer)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Get the URL of a Google Emoji Kitchen image for two emojis.

## Install

```sh
npm install emoji-mixer   # JavaScript / TypeScript, Node.js 20.19+
pip install emoji-mixer   # Python 3.10+
cargo add emoji-mixer     # Rust
go get github.com/MattFor/emoji-mixer/v2   # Go 1.21+
deno add jsr:@mattfor/emoji-mixer   # Deno, or npx jsr add @mattfor/emoji-mixer
composer require mattfor/emoji-mixer   # PHP 8.2+
gem install emoji_mixer   # Ruby 3.3+
dotnet add package EmojiMixer   # .NET 10+
```

## Usage

```js
import getEmojiMixUrl from 'emoji-mixer';
// or: const { default: getEmojiMixUrl } = require("emoji-mixer");

getEmojiMixUrl('🔥', '😃');
// https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f603/u1f603_u1f525.png
```

```python
from emoji_mixer import get_emoji_mix_url

get_emoji_mix_url("🔥", "😃")
```

```rust
emoji_mixer::get_emoji_mix_url("🔥", "😃"); // Some(url)
```

```go
import emojimixer "github.com/MattFor/emoji-mixer/v2"

url, err := emojimixer.EmojiMixURL("🔥", "😃")
```

```php
use MattFor\EmojiMixer\EmojiMixer;

EmojiMixer::getEmojiMixUrl('🔥', '😃');
```

```ruby
require "emoji_mixer"

EmojiMixer.emoji_mix_url("🔥", "😃")
```

```csharp
using EmojiMixer;

EmojiKitchen.GetEmojiMixUrl("🔥", "😃");
```

Emojis can be passed as characters (`"☕"`) or codepoint strings (`"2615"`, `"1F600"`, `"2764-fe0f"`). The FE0F variation selector is optional.

## Functions

- `getEmojiMixUrl(leftEmoji, rightEmoji, detailedErrors = false)` (default export)  
  Returns the image URL, or `undefined` if an emoji is unsupported or the pair has no mix. With `detailedErrors`, throws an error explaining why instead.

- `toUnicode(input)`  
  Returns the codepoint key of one supported emoji, e.g. `"☕"` → `"2615"`, or `undefined`.

- `getEmojiCombo(leftEmoji, rightEmoji)`  
  Takes two codepoint keys and returns the newest `{ leftEmoji, rightEmoji, date }` combination, or `undefined`. `leftEmoji` and `rightEmoji` are in the order Google hosts the image under, which may differ from the argument order.

- `checkSupported(emoji)`  
  Returns every combination containing the emoji (on either side), or `null` if it is unsupported.

- `googleRequestUrl(combo)` / `googleRequestUrlEmojiPart(emoji)`  
  Build the image URL from a combination / format one emoji for the URL.

- `getExpandedEmojiCompatibilityData(useCache = false)`  
  Returns `{ [emoji]: combination[] }` for every supported emoji.

- `supportedEmojis`, `emojiCompatibilityData`, `baseUrl`  
  The supported codepoint keys, the compressed database and the image base URL.

**Python** has the same API in snake_case (`get_emoji_mix_url`, `to_unicode`, …, `BASE_URL`). It returns `None` instead of `undefined`/`null`, `detailed_errors` raises `ValueError`, and combinations are `EmojiCombo(left_emoji, right_emoji, date)` named tuples.

**Rust** has `get_emoji_mix_url`, `to_unicode`, `get_emoji_combo`, `check_supported`, `google_request_url`, `google_request_url_emoji_part`, `supported_emojis()` and `BASE_URL`, returning `Option`s.

**Go** has `EmojiMixURL` (an `error` says why there is no URL), `ToUnicode`, `EmojiCombo`, `CheckSupported`,
`ExpandedEmojiCompatibilityData`, `GoogleRequestURL`, `GoogleRequestURLEmojiPart`, `SupportedEmojis()` and `BaseURL`;
lookups return `(value, ok)` and combinations are `Combo{LeftEmoji, RightEmoji, Date}`.

**JSR** is the same TypeScript as the npm package.

**PHP** has the same API as static methods of `MattFor\EmojiMixer\EmojiMixer` (`getEmojiMixUrl`, `toUnicode`, …,
`BASE_URL`), returning `null`; `$detailedErrors` throws `InvalidArgumentException`, and combinations are `EmojiCombo`
objects with `leftEmoji`, `rightEmoji` and `date`.

**Ruby** has `EmojiMixer.emoji_mix_url(left, right, detailed_errors: false)`, `to_unicode`, `emoji_combo`,
`check_supported`, `expanded_emoji_compatibility_data`, `google_request_url`, `google_request_url_emoji_part`,
`supported_emojis` and `BASE_URL`, returning `nil`; `detailed_errors` raises `ArgumentError`, and combinations are
`EmojiMixer::EmojiCombo` values.

**C#** has the same API as static members of `EmojiMixer.EmojiKitchen` (`GetEmojiMixUrl`, `ToUnicode`, …,
`SupportedEmojis`, `BaseUrl`), returning `null`; `detailedErrors` throws `ArgumentException`, and combinations are
`EmojiCombo(LeftEmoji, RightEmoji, Date)` records.

## Data format

`emojiCompatibilityData` is generated from [emojikitchen.dev](https://emojikitchen.dev/metadata.json) by `converter.ts`:

```js
{
    "$d": [20201001, 20260128],   // unique dates
    "$e": [9749, 9800],           // unique emojis: codepoints as integers, sequences as strings
    "2615": [[0, 0], [1, 1]],     // [emojiIndex, dateIndex]
    "2648": [[-1, 1]]
}
```

A negative `emojiIndex` (`~i`) means the key emoji is the right-hand emoji in Google's URL. Above, both entries `[1, 1]` and `[-1, 1]` describe ☕ (left) + ♈ (right).

## Attributions

- Created by MattFor | Discord tag: mattfor | [Github](https://github.com/MattFor)
- Inspired by [emoji-kitchen](https://github.com/xsalazar/emoji-kitchen) [made by Xavier Salazar a.k.a [xsalazar](https://github.com/xsalazar)]

## License

MIT, see [LICENSE](LICENSE). By [MattFor](https://github.com/MattFor).
