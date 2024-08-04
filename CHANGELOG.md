# Changelog

## [1.1.12] - 2024-08-04 07:45

- Removed clutter
- Added .gitignore

## [1.1.11] - 2024-08-03 09:00

- Typo fixes
- README.md and LICENSE update

## [1.1.0] - 2024-04-23 20:00

- Updated the code to my current code style.
- Moved supportedEmojis and emojiCompatibilityData into their own file: `data.js`.
- General JSDoc updates.
- index.d.ts updates.

## [1.0.6] - 2024-02-29 23:30 (Lucky day!)

### Added

- `supportedEmojis`  and `emojiCompatibilityData` to exported things.

## [1.0.5] - 2024-02-15 23:30

### Changed

- Some outdated emojis to fit the current unicode standard. [Where the `-FE0F` flag is not necessary]
- [1.051/52/53/54/55] Small fixes & code style improvements.

### Upgraded

- Upgraded `toUnicode` to throw an error when an outdated unicode emoji is provided.

## [1.0.4] - 2024-02-15 20:00

### Fixed

- [Issue #1](https://github.com/MattFor/emoji-mixer/issues/1) (Not working for certain emojis) has been fixed. [Improved RegEx]
- [1.0.41] Updated the RegEx further.
- [1.0.42] Updated `toUnicode` to search through a supported emoji string array to find the closes match.

## [1.0.3] - 2023-05-18 18:15

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

## [1.0.2] - 2023-05-30

- Added the "Related" section and improved the example.

## [1.0.1] - 2023-05-30

- Fixed minor spelling issues.

## [1.0.0] - 2023-05-30

- Initial commit.
