import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
// EMOJI_MIXER_ENTRY=./index.ts runs these tests on the JSR source under Deno
const entry = process.env.EMOJI_MIXER_ENTRY;
const {
    default: getEmojiMixUrl,
    baseUrl,
    checkSupported,
    emojiCompatibilityData,
    getEmojiCombo,
    getExpandedEmojiCompatibilityData,
    googleRequestUrlEmojiPart,
    supportedEmojis,
    toUnicode
} = await import(entry ?? '../../dist/bindings/node/index.js');

const url = (date, left, right) => `${baseUrl}/${date}/${left}/${left}_${right}.png`;
const fromKey = (key) => String.fromCodePoint(...key.split('-').map((part) => parseInt(part, 16)));

test("getEmojiMixUrl uses Google's emoji order whichever way it is called", () => {
    assert.equal(getEmojiMixUrl('☕', '♈'), url(20260128, 'u2615', 'u2648'));
    assert.equal(getEmojiMixUrl('♈', '☕'), url(20260128, 'u2615', 'u2648'));
    assert.equal(getEmojiMixUrl('🔥', '😃'), url(20201001, 'u1f603', 'u1f525'));
    assert.equal(getEmojiMixUrl('2615', '2615'), url(20201001, 'u2615', 'u2615'));
});

test('require() loads the package', { skip: entry !== undefined }, () => {
    assert.equal(
        createRequire(import.meta.url)('../../dist/bindings/node/index.js').default('♈', '☕'),
        url(20260128, 'u2615', 'u2648')
    );
});

test('getEmojiMixUrl returns undefined for unsupported input and pairs', () => {
    for (const input of ['not an emoji', 'abc', 'deadbeef', '', '😀😀', undefined]) {
        assert.equal(getEmojiMixUrl(input, '☕'), undefined);
    }

    assert.equal(getEmojiMixUrl('☕', '🌳'), undefined);
});

test('getEmojiMixUrl detailed errors name the problem', () => {
    assert.throws(() => getEmojiMixUrl('abc', '☕', true), /'abc' \[leftEmoji\]/);
    assert.throws(() => getEmojiMixUrl('☕', 'abc', true), /'abc' \[rightEmoji\]/);
    assert.throws(() => getEmojiMixUrl('☕', '🌳', true), /'2615' is not compatible with '1f333'/);
});

test('toUnicode accepts exactly one supported emoji (FE0F optional)', () => {
    assert.equal(toUnicode('☕'), '2615');
    assert.equal(toUnicode('☕️'), '2615');
    assert.equal(toUnicode('❤'), '2764-fe0f');
    assert.equal(toUnicode('1F600'), '1f600');
    assert.equal(toUnicode('😮‍💨'), '1f62e-200d-1f4a8');
    assert.equal(toUnicode('❤️‍🩹'), '2764-fe0f-200d-1fa79');

    for (const input of ['1f6', '2', 'a', '☕ hello', '😀😀', '', undefined, 2615]) {
        assert.equal(toUnicode(input), undefined);
    }
});

test('every supported emoji resolves to itself', () => {
    for (const key of supportedEmojis) {
        assert.equal(toUnicode(fromKey(key)), key);
        assert.equal(toUnicode(key.toUpperCase()), key);
    }
});

test("getEmojiCombo returns the newest combo in Google's order", () => {
    const combo = { leftEmoji: '2615', rightEmoji: '2648', date: '20260128' };

    assert.deepEqual(getEmojiCombo('2615', '2648'), combo);
    assert.deepEqual(getEmojiCombo('2648', '2615'), combo);
    assert.deepEqual(getEmojiCombo('2615', '2615'), { leftEmoji: '2615', rightEmoji: '2615', date: '20201001' });
    assert.equal(getEmojiCombo('2615', 'deadbeef'), undefined);
    assert.equal(getEmojiCombo('constructor', '2615'), undefined);
});

test('checkSupported lists combos containing the emoji', () => {
    const combos = checkSupported('♈');

    assert.ok(combos.some((combo) => combo.leftEmoji === '2615' && combo.rightEmoji === '2648'));
    assert.ok(combos.every((combo) => combo.leftEmoji === '2648' || combo.rightEmoji === '2648'));
    assert.equal(checkSupported('abc'), null);
});

test('getExpandedEmojiCompatibilityData expands every emoji and caches on request', () => {
    const expanded = getExpandedEmojiCompatibilityData(true);

    assert.equal(Object.keys(expanded).length, supportedEmojis.length);
    assert.deepEqual(expanded['2615'], checkSupported('2615'));
    assert.equal(getExpandedEmojiCompatibilityData(true), expanded);
    assert.notEqual(getExpandedEmojiCompatibilityData(), expanded);
});

test('googleRequestUrlEmojiPart formats codepoints for the URL', () => {
    assert.equal(googleRequestUrlEmojiPart('1f642-200d-2194-FE0F'), 'u1f642-u200d-u2194-ufe0f');
});

test('compressed data only references existing lookup entries', () => {
    const { $d, $e } = emojiCompatibilityData;

    assert.ok(supportedEmojis.length > 600);

    for (const key of supportedEmojis) {
        for (const [index, dateIndex] of emojiCompatibilityData[key]) {
            assert.notEqual($e[index < 0 ? ~index : index], undefined);
            assert.notEqual($d[dateIndex], undefined);
        }
    }
});
