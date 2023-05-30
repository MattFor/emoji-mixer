'use strict';

/**
 * `Emoji Mix URL Generator` TypeScript Definitions
 * Version 1.0.0
 * 
 * Created by MattFor (Discord: MattFor#9884) on May 30, 2023.
 * Contact: matthew-forester@protonmail.com
 * 
 * Licensed under the MIT License.
 * 
 * This TypeScript module declaration for the 'emoji-mixer' JavaScript module provides 
 * strong type checking for its functions and exported variables.
 * 
 * Types:
 * 
 * `EmojiData` - Represents a combination of emojis. It has properties for leftEmoji,
 * rightEmoji, and the date when the combination was added.
 * 
 * `EmojiDataMap` - A map where each key is a string of emoji Unicode points and each value
 * is an array of `EmojiData`.
 * 
 * Exported variables:
 * 
 * `emojiData` - A map of Unicode code points to arrays of emoji combinations.
 * 
 * `supportedEmojis` - An array of strings, each representing an emoji supported by the application.
 * 
 * `baseUrl` - The base URL for fetching emoji images from Google's Android Emoji Kitchen.
 * 
 * Exported functions:
 * 
 * `googleRequestUrlEmojiPart(emoji: string): string` - Transforms an emoji Unicode representation for inclusion in a URL.
 * 
 * `toUnicode(input: string): string | undefined` - Validates and transforms an input into a Unicode representation.
 * 
 * `checkSupported(emoji: string): EmojiData[] | null` - Checks if an emoji is supported by looking it up in the `emojiData` object.
 * 
 * `googleRequestUrl(emojiMixData: EmojiData): string` - Generates a URL for fetching an emoji combination image from Google's Android Emoji Kitchen.
 * 
 * `getEmojiCombo(leftEmoji: string, rightEmoji: string): EmojiData | undefined` - Finds a matching emoji combination from the `emojiData` object.
 * 
 * `getEmojiMixUrl(leftEmoji: string, rightEmoji: string, showCompatible?: boolean): string | null | undefined` - Generates a URL for an emoji mix image.
 */
declare module 'emoji-mixer' {
    type EmojiData = {
        leftEmoji: string;
        rightEmoji: string;
        date: string;
    };

    type EmojiDataMap = {
        [key: string]: EmojiData[];
    };

    export const emojiData: EmojiDataMap;
    export const supportedEmojis: string[];
    export const baseUrl: string;

    export function googleRequestUrlEmojiPart(emoji: string): string;
    export function toUnicode(input: string): string | undefined;
    export function checkSupported(emoji: string): EmojiData[] | null;
    export function googleRequestUrl(emojiMixData: EmojiData): string;
    export function getEmojiCombo(leftEmoji: string, rightEmoji: string): EmojiData | undefined;
    export default function getEmojiMixUrl(leftEmoji: string, rightEmoji: string, showCompatible?: boolean): string | null | undefined;
}