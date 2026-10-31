import data from '../../compatibility.json' with { type: 'json' };

/** Compressed combo: `[emoji index into $e (negative = this emoji is on the right), date index into $d]`. */
export type CompressedEmojiEntry = [number, number];

/** Raw compressed dataset: `$d` dates, `$e` emoji table, and one entry list per supported emoji. */
export interface EmojiCompatibilityData {
    $d: number[];
    $e: (number | string)[];

    [emoji: string]: CompressedEmojiEntry[] | (number | string)[];
}

/** A single Emoji Kitchen combination. Emojis are hyphen-separated lowercase hex codepoints. */
export interface EmojiCombo {
    leftEmoji: string;
    rightEmoji: string;
    date: string;
}

/** Every supported emoji mapped to all of its combinations. */
export type ExpandedEmojiCompatibilityData = Record<string, EmojiCombo[]>;

/** Base URL of Google's Emoji Kitchen image CDN. */
export const baseUrl = 'https://www.gstatic.com/android/keyboard/emojikitchen';
/** The raw compressed compatibility dataset. */
export const emojiCompatibilityData = data as unknown as EmojiCompatibilityData;
/** Sorted codepoint keys of every supported emoji, e.g. `1f600`. */
export const supportedEmojis: string[] = Object.keys(data)
    .filter((key) => !key.startsWith('$'))
    .sort();

const supported = new Set(supportedEmojis);
const stripFe0f = (codepoints: string) => codepoints.replace(/-fe0f\b/g, '');
const byStrippedKey = new Map(supportedEmojis.map((key) => [stripFe0f(key), key]));
let expandedCache: ExpandedEmojiCompatibilityData | undefined;

const combosOf = (emoji: string) =>
    supported.has(emoji) ? (emojiCompatibilityData[emoji] as CompressedEmojiEntry[]) : [];

const emojiAt = (index: number) => {
    const emoji = emojiCompatibilityData.$e[index < 0 ? ~index : index];
    return typeof emoji === 'number' ? emoji.toString(16) : emoji;
};

const expand = (anchor: string, [index, dateIndex]: CompressedEmojiEntry): EmojiCombo => {
    const other = emojiAt(index);
    const date = String(emojiCompatibilityData.$d[dateIndex]);
    return index < 0 ? { leftEmoji: other, rightEmoji: anchor, date } : { leftEmoji: anchor, rightEmoji: other, date };
};

/** Normalizes an emoji or codepoint string to its dataset key, or `undefined` if unsupported. */
export const toUnicode = (input: string): string | undefined => {
    if (typeof input !== 'string') {
        return undefined;
    }

    const codepoints = /^[\da-f]+(-[\da-f]+)*$/i.test(input)
        ? input.toLowerCase()
        : [...input].map((char) => char.codePointAt(0)!.toString(16)).join('-');

    return byStrippedKey.get(stripFe0f(codepoints));
};

/** Returns every combination for an emoji, or `null` if it is unsupported. */
export const checkSupported = (emoji: string): EmojiCombo[] | null => {
    const key = toUnicode(emoji);
    return key ? combosOf(key).map((combo) => expand(key, combo)) : null;
};

/** Expands the whole dataset into combos per emoji. Pass `true` to cache the result. */
export const getExpandedEmojiCompatibilityData = (useCache = false): ExpandedEmojiCompatibilityData => {
    if (useCache && expandedCache) {
        return expandedCache;
    }

    const expanded = Object.fromEntries(
        supportedEmojis.map((emoji) => [emoji, combosOf(emoji).map((combo) => expand(emoji, combo))])
    );

    if (useCache) {
        expandedCache = expanded;
    }

    return expanded;
};

/** Formats codepoints for a Google URL, e.g. `1f600-fe0f` -> `u1f600-ufe0f`. */
export const googleRequestUrlEmojiPart = (emoji: string): string =>
    emoji
        .split('-')
        .map((part) => `u${part.toLowerCase()}`)
        .join('-');

/** Builds the Emoji Kitchen image URL for a combo. */
export const googleRequestUrl = ({ leftEmoji, rightEmoji, date }: EmojiCombo): string => {
    const left = googleRequestUrlEmojiPart(leftEmoji);
    return `${baseUrl}/${date}/${left}/${left}_${googleRequestUrlEmojiPart(rightEmoji)}.png`;
};

/** Finds the newest combo for two codepoint keys (see {@link toUnicode}), in either order. */
export const getEmojiCombo = (leftEmoji: string, rightEmoji: string): EmojiCombo | undefined =>
    [
        [leftEmoji, rightEmoji],
        [rightEmoji, leftEmoji]
    ]
        .flatMap(([anchor, other]) =>
            combosOf(anchor)
                .filter(([index]) => emojiAt(index) === other)
                .map((combo) => expand(anchor, combo))
        )
        .sort((a, b) => Number(b.date) - Number(a.date))[0];

/**
 * Returns the Emoji Kitchen image URL for two emojis, or `undefined` if they cannot be mixed.
 * With `detailedErrors`, throws an error explaining why instead of returning `undefined`.
 *
 * @example
 * ```ts
 * import getEmojiMixUrl from '@mattfor/emoji-mixer';
 * getEmojiMixUrl('😀', '🐱');
 * ```
 */
const getEmojiMixUrl = (leftEmoji: string, rightEmoji: string, detailedErrors = false): string | undefined => {
    const left = toUnicode(leftEmoji);
    const right = toUnicode(rightEmoji);
    const combo = left && right ? getEmojiCombo(left, right) : undefined;

    if (combo) {
        return googleRequestUrl(combo);
    }

    if (!detailedErrors) {
        return undefined;
    }

    if (!left) {
        throw new Error(`'${leftEmoji}' [leftEmoji] is not a supported emoji.`);
    }

    if (!right) {
        throw new Error(`'${rightEmoji}' [rightEmoji] is not a supported emoji.`);
    }

    throw new Error(
        `'${left}' is not compatible with '${right}'. Here are all emojis compatible with '${right}':\n[${combosOf(
            right
        )
            .map(([index]) => emojiAt(index))
            .join(', ')}]`
    );
};

export default getEmojiMixUrl;
