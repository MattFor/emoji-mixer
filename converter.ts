import { writeFileSync } from 'node:fs';

interface Combo {
    leftEmojiCodepoint: string;
    rightEmojiCodepoint: string;
    date: string;
}

const { data }: { data: Record<string, { combinations: Record<string, Combo[]> }> } = await (
    await fetch('https://emojikitchen.dev/metadata.json')
).json();

const emojis: (number | string)[] = [];
const dates: number[] = [];
const emojiIndex = new Map<string, number>();
const dateIndex = new Map<number, number>();
const output: Record<string, unknown> = { $d: dates, $e: emojis };

const indexOf = <K>(map: Map<K, number>, list: unknown[], key: K, value: unknown = key) => {
    if (!map.has(key)) {
        map.set(key, list.push(value) - 1);
    }

    return map.get(key)!;
};

for (const [anchor, { combinations }] of Object.entries(data)) {
    output[anchor] = Object.values(combinations)
        .flat()
        .map((combo) => {
            const left = combo.leftEmojiCodepoint.toLowerCase();
            const right = combo.rightEmojiCodepoint.toLowerCase();
            const other = left === anchor ? right : left;
            const index = indexOf(emojiIndex, emojis, other, other.includes('-') ? other : parseInt(other, 16));

            // ~index: the anchor is the right-hand emoji in Google's image URL.
            return [left === anchor ? index : ~index, indexOf(dateIndex, dates, Number(combo.date))];
        });
}

writeFileSync(new URL('compatibility.json', import.meta.url), JSON.stringify(output));
