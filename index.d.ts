// noinspection JSUnusedGlobalSymbols

/**
 * `Emoji Mix URL Generator` TypeScript Definitions
 * Version 1.3
 *
 * Created by MattFor (Discord: MattFor#9884 (currently: mattfor)) on May 30, 2023.
 * Contact: mattfor@relaxy.xyz
 *
 * Licensed under the MIT Licence.
 *
 * This TypeScript module declaration for the `emoji-mixer` JavaScript module
 * provides strong type checking for its functions and exported variables.
 *
 * Types:
 *
 * `EmojiCombo` - Represents a single Emoji Kitchen combination.
 * It contains the left emoji, right emoji, and the date when the
 * combination was added.
 *
 * `CompressedEmojiEntry` - Represents a compressed compatibility entry
 * stored internally by the library. The first value references an entry
 * in `emojiCompatibilityData.$e`, and the second references an entry in
 * `emojiCompatibilityData.$d`.
 *
 * `EmojiCompatibilityData` - The compressed Emoji Kitchen compatibility
 * database used internally by the library.
 *
 * `ExpandedEmojiCompatibilityData` - A fully expanded compatibility map
 * where each emoji key contains an array of `EmojiCombo` objects.
 *
 * Exported variables:
 *
 * `emojiCompatibilityData` - The compressed Emoji Kitchen compatibility
 * database.
 *
 * `supportedEmojis` - An array of supported emoji Unicode strings.
 *
 * `baseUrl` - The base URL for fetching emoji images from Google's
 * Android Emoji Kitchen.
 *
 * Exported functions:
 *
 * `googleRequestUrlEmojiPart(emoji: string): string`
 * Transforms an emoji Unicode representation for inclusion in a URL.
 *
 * `toUnicode(input: string, oldToNew?: boolean): string | undefined`
 * Validates and transforms an input into a Unicode representation.
 *
 * `checkSupported(emoji: string, oldToNew?: boolean): EmojiCombo[] | null`
 * Returns all compatible emoji combinations for a supported emoji.
 *
 * `googleRequestUrl(emojiMixData: EmojiCombo): string`
 * Generates a URL for fetching an emoji combination image from Google's
 * Android Emoji Kitchen.
 *
 * `getEmojiCombo(leftEmoji: string, rightEmoji: string, preserveInputOrder?: boolean): EmojiCombo | undefined`
 * Finds the newest matching emoji combination.
 *
 * `getExpandedEmojiCompatibilityData(useCache?: boolean): ExpandedEmojiCompatibilityData`
 * Returns a fully expanded version of the compatibility database.
 *
 * `getEmojiMixUrl(leftEmoji: string, rightEmoji: string, detailedErrors?: boolean, oldToNew?: boolean): string | undefined | null`
 * Generates a URL for an Emoji Kitchen image.
 */
declare module "emoji-mixer" {
    /**
     * Expanded Emoji Kitchen compatibility entry.
     */
    export interface EmojiCombo {
        leftEmoji: string;
        rightEmoji: string;
        date: string;
    }

    /**
     * Internal compressed compatibility entry.
     *
     * [emojiIndex, dateIndex]
     */
    export type CompressedEmojiEntry = [number, number];

    /**
     * Internal compressed Emoji Kitchen compatibility database.
     */
    export interface EmojiCompatibilityData {
        /**
         * Date lookup table.
         */
        $d: number[];

        /**
         * Emoji lookup table.
         */
        $e: Array<number | string>;

        /**
         * Compatibility entries keyed by Unicode codepoint string.
         */
        [emoji: string]:
            | CompressedEmojiEntry[]
            | Array<number | string>
            | number[]
            | undefined;
    }

    /**
     * Fully expanded compatibility database.
     */
    export interface ExpandedEmojiCompatibilityData {
        [emoji: string]: EmojiCombo[];
    }

    /**
     * Base URL for Emoji Kitchen images.
     */
    export const baseUrl: string;

    /**
     * List of all supported emoji Unicode strings.
     */
    export const supportedEmojis: string[];

    /**
     * Compressed Emoji Kitchen compatibility database.
     */
    export const emojiCompatibilityData: EmojiCompatibilityData;

    /**
     * Transforms an emoji Unicode representation for inclusion in a URL.
     */
    export function googleRequestUrlEmojiPart(
        emoji: string
    ): string;

    /**
     * Generates an Emoji Kitchen image URL from combination data.
     */
    export function googleRequestUrl(
        emojiMixData: EmojiCombo
    ): string;

    /**
     * Converts an emoji or Unicode string into a normalized Unicode representation.
     *
     * May throw if an unsupported legacy emoji is supplied and
     * `oldToNew` is false.
     */
    export function toUnicode(
        input: string,
        oldToNew?: boolean
    ): string | undefined;

    /**
     * Finds the newest matching Emoji Kitchen combination.
     *
     * When `preserveInputOrder` is false (default), the returned
     * combination is normalized so that:
     *
     * getEmojiCombo(a, b) === getEmojiCombo(b, a)
     *
     * When enabled, the returned object preserves the original
     * argument order.
     */
    export function getEmojiCombo(
        leftEmoji: string,
        rightEmoji: string,
        preserveInputOrder?: boolean
    ): EmojiCombo | undefined;

    /**
     * Returns all compatible Emoji Kitchen combinations for an emoji.
     */
    export function checkSupported(
        emoji: string,
        oldToNew?: boolean
    ): EmojiCombo[] | null;

    /**
     * Returns a fully expanded version of the compressed
     * compatibility database.
     */
    export function getExpandedEmojiCompatibilityData(
        useCache?: boolean
    ): ExpandedEmojiCompatibilityData;

    /**
     * Generates an Emoji Kitchen image URL.
     *
     * Returns:
     * - string: URL generated successfully
     * - undefined: invalid input or unsupported combination
     * - null: URL could not be generated
     *
     * May throw detailed errors when `detailedErrors` is enabled.
     */
    export default function getEmojiMixUrl(
        leftEmoji: string,
        rightEmoji: string,
        detailedErrors?: boolean,
        oldToNew?: boolean
    ): string | undefined | null;
}