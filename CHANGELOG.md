# Changelog

## [2.2.0] - 08:07 CEST 30-10-2026

### Added

- Go package: `go get github.com/MattFor/emoji-mixer/v2`.
- JSR package: `deno add jsr:@mattfor/emoji-mixer`.
- PHP package: `composer require mattfor/emoji-mixer`.
- Ruby gem: `gem install emoji_mixer`.
- .NET package: `dotnet add package EmojiMixer`.
- `supportedEmojis`, `googleRequestUrl` and `googleRequestUrlEmojiPart` have explicit TypeScript types.

## [2.1.0] - 22:00 CEST 26-10-2026

### Added

- Python and Rust package

## [2.0.0] - 20:30 CEST 26-10-2026

### Fixed

- About half of all generated URLs were 404s since 1.3.0 (OOPS!), because the data lost which emoji goes on the left. Combinations now always use Google's order.
- `toUnicode` read only the first character: 😮‍💨, 🙂‍↔️, 🙂‍↕️, 😶‍🌫️ and ❤️‍🩹 resolved to a different emoji, and input like `"1f6"` or `"😀😀"` was accepted.
- `getEmojiMixUrl` threw on unsupported input even without `detailedErrors`.
- TypeScript types were not included in the published package - oops!

### Changed (this might break your stuff!)

- Rewritten in TypeScript. ESM only; `require()` still works on Node.js 20.19+.
- Removed the `oldToNew` parameter.
- `toUnicode` returns `undefined` instead of throwing.
- `getEmojiMixUrl` never returns `null`.
- `checkSupported` and `getEmojiCombo` return Google's emoji order, so the queried emoji can be `rightEmoji`.
- In `emojiCompatibilityData`, a negative `emojiIndex` marks the key as the right-hand emoji.

### Removed

- Dependencies `emoji-regex` and `stream-json`; webpack build; `index.d.ts` (now generated); `converter.py` and `release.sh` (replaced by `converter.ts` and CI).

### Added

- CI tests on Node.js 20, 22 and 24, publishing on `v*` tags, and a weekly data refresh PR.

## [1.3.1] - 15:15 CEST 20-06-2026

- Emergency fix so that supportedEmojis uses the same source of truth and isn't hardcoded.
- Also fixes invalid url creation due to preserved order.

## [1.3.0] - 15:00 CEST 20-06-2026

- Added tests.
- Added automatic metadata downloader/converter.
- Updated compatible emoji list.
- Significantly reduced file sizes with smarter emojiCompatibilityData compression.
- Improved TypeScript definitions.
- Added expanded compatibility helpers.
- Added compatibility data caching support.
- Added support for preserving caller order in `getEmojiCombo()`.
- Improved documentation and JSDoc coverage.
- In general this is easier to work on now.

Emoji compatibility is now accessed purely by compressed lookup tables internally (`$e` and `$d`), reducing package size and memory usage while preserving full functionality. The public API remains compatible for most use cases.

## [1.2.2] - 15:10 CEST 18-04-2025

- Updated minification.
- Updated emoji compatibility searching.

## [1.2.1] - 02:00 CEST 18-04-2025

- Added minification and automatic compatibility.
- Removed files unneeded for distribution.

## [1.2.0] - 01:30 CEST 18-04-2025

- Updated compatible emoji list. [100+ more supported emojis]
- Updated dependencies.
- Updated contact email.

## [1.1.12] - 07:45 CEST 04-08-2024

- Removed clutter.
- Added .gitignore.

## [1.1.11] - 09:00 CEST 03-08-2024

- Typo fixes
- README.md and LICENSE update.

## [1.1.0] - 20:00 CEST 23-04-2024

- Updated the code to my current code style.
- Moved supportedEmojis and emojiCompatibilityData into their own file: `data.js`.
- General JSDoc updates.
- index.d.ts updates.

## [1.0.6] - 23:30 CEST 29-02-2024

### Added

- `supportedEmojis` and `emojiCompatibilityData` to exported things.

## [1.0.5] - 23:30 CEST 15-02-2024

### Changed

- Some outdated emojis to fit the current Unicode standard. [Where the `-FE0F` flag is not necessary]
- [1.051/52/53/54/55] Small fixes & code style improvements.

### Upgraded

- Upgraded `toUnicode` to throw an error when an outdated Unicode emoji is provided.

## [1.0.4] - 20:00 CEST 15-02-2024

### Fixed

- [Issue #1](https://github.com/MattFor/emoji-mixer/issues/1) (Not working for certain emojis) has been fixed. [Improved RegEx]
- [1.0.41] Updated the RegEx further.
- [1.0.42] Updated `toUnicode` to search through a supported emoji string array to find the closes match.

## [1.0.3] - 18:15 CEST 18-05-2023

### Added

- Introduced a new `detailedErrors` argument in `getEmojiMixUrl` method. This argument provides the option to display more detailed and accurate error messages if something goes wrong.
- Created this `CHANGELOG.md` file to track and document all notable changes in the project moving forward.
- [1.0.32] Added the helper functions to the ES usage example.

### Changed

- Updated the `showCompatibility` argument in `getEmojiMixUrl` method to `detailedErrors` to reflect the new error handling enhancements.
- Added helper functions to the CommonJS usage example.
- [1.0.33] Improved usage examples.
- [1.0.33] Renamed `emojiData` object into `emojiCompatibilityData`.

### Fixed

- Added missing semicolons throughout the codebase to improve code quality and consistency.
- [1.0.31] (Actually) Added helper functions to the CommonJS usage example.

## [1.0.2] - 30-05-2023

- Added the "Related" section and improved the example.

## [1.0.1] - 30-05-2023

- Fixed minor spelling issues.

## [1.0.0] - 30-05-2023

- Initial commit.

[2.2.0]: https://github.com/MattFor/emoji-mixer/releases/tag/v2.2.0
[2.1.0]: https://github.com/MattFor/emoji-mixer/releases/tag/v2.1.0
[2.0.0]: https://github.com/MattFor/emoji-mixer/releases/tag/v2.0.0
[1.3.1]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.3.1
[1.3.0]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.3.0
[1.2.2]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.2.2
[1.2.1]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.2.1
[1.2.0]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.2.0
[1.1.11]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.1.11
[1.1.0]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.1.0
[1.0.6]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.6
[1.0.55]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.55
[1.0.54]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.54
[1.0.53]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.53
[1.0.52]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.52
[1.0.51]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.51
[1.0.5]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.5
[1.0.42]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.42
[1.0.41]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.41
[1.0.4]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.4
[1.0.33]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.33
[1.0.32]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.32
[1.0.31]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.31
[1.0.3]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.3
[1.0.2]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.2
[1.0.1]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.1
[1.0.0]: https://github.com/MattFor/emoji-mixer/releases/tag/v1.0.0
