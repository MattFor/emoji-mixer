<?php

declare(strict_types=1);

// Needs `composer dump-autoload` first

require __DIR__ . '/../../../vendor/autoload.php';

use MattFor\EmojiMixer\EmojiCombo;
use MattFor\EmojiMixer\EmojiMixer;

$failures = 0;

function check(bool $ok, string $what): void
{
    global $failures;
    if (!$ok) {
        $failures++;
        fwrite(STDERR, "FAIL: {$what}\n");
    }
}

function url(string $date, string $left, string $right): string
{
    return EmojiMixer::BASE_URL . "/{$date}/{$left}/{$left}_{$right}.png";
}

function throwsWith(callable $call, string $needle): bool
{
    try {
        $call();
    } catch (InvalidArgumentException $e) {
        return str_contains($e->getMessage(), $needle);
    }

    return false;
}

check(EmojiMixer::getEmojiMixUrl('☕', '♈') === url('20260128', 'u2615', 'u2648'), 'mix ☕ ♈');
check(EmojiMixer::getEmojiMixUrl('♈', '☕') === url('20260128', 'u2615', 'u2648'), 'mix ♈ ☕');
check(EmojiMixer::getEmojiMixUrl('🔥', '😃') === url('20201001', 'u1f603', 'u1f525'), 'mix 🔥 😃');
check(EmojiMixer::getEmojiMixUrl('2615', '2615') === url('20201001', 'u2615', 'u2615'), 'mix 2615 2615');

foreach (['not an emoji', 'abc', 'deadbeef', '', '😀😀', "\xff"] as $input) {
    check(EmojiMixer::getEmojiMixUrl($input, '☕') === null, "mix unsupported {$input}");
}
check(EmojiMixer::getEmojiMixUrl('☕', '🌳') === null, 'mix ☕ 🌳');

check(throwsWith(fn () => EmojiMixer::getEmojiMixUrl('abc', '☕', true), "'abc' [leftEmoji]"), 'error left');
check(throwsWith(fn () => EmojiMixer::getEmojiMixUrl('☕', 'abc', true), "'abc' [rightEmoji]"), 'error right');
check(throwsWith(fn () => EmojiMixer::getEmojiMixUrl('☕', '🌳', true), "'2615' is not compatible with '1f333'"), 'error pair');

foreach (['☕' => '2615', '☕️' => '2615', '❤' => '2764-fe0f', '1F600' => '1f600', '😮‍💨' => '1f62e-200d-1f4a8', '❤️‍🩹' => '2764-fe0f-200d-1fa79'] as $input => $want) {
    check(EmojiMixer::toUnicode((string) $input) === $want, "toUnicode {$input}");
}
foreach (['1f6', '2', 'a', '☕ hello', '😀😀', '', "2615\n"] as $input) {
    check(EmojiMixer::toUnicode($input) === null, "toUnicode unsupported {$input}");
}

check(count(EmojiMixer::supportedEmojis()) > 600, 'more than 600 supported emojis');
foreach (EmojiMixer::supportedEmojis() as $key) {
    $emoji = implode('', array_map(fn ($part) => html_entity_decode("&#x{$part};", ENT_HTML5, 'UTF-8'), explode('-', $key)));
    check(EmojiMixer::toUnicode($emoji) === $key, "toUnicode itself {$key}");
    check(EmojiMixer::toUnicode(strtoupper($key)) === $key, "toUnicode upper {$key}");
    check(!empty(EmojiMixer::checkSupported($key)), "checkSupported {$key}");
}

check(EmojiMixer::getEmojiCombo('2615', '2648') == new EmojiCombo('2615', '2648', '20260128'), 'combo 2615 2648');
check(EmojiMixer::getEmojiCombo('2648', '2615') == new EmojiCombo('2615', '2648', '20260128'), 'combo 2648 2615');
check(EmojiMixer::getEmojiCombo('2615', '2615') == new EmojiCombo('2615', '2615', '20201001'), 'combo 2615 2615');
check(EmojiMixer::getEmojiCombo('2615', 'deadbeef') === null, 'combo deadbeef');
check(EmojiMixer::getEmojiCombo('$e', '2615') === null, 'combo $e');

$combos = EmojiMixer::checkSupported('♈');
check(in_array(new EmojiCombo('2615', '2648', '20260128'), $combos ?? []), 'checkSupported ♈ has ☕');
check(array_filter($combos ?? [], fn ($c) => $c->leftEmoji !== '2648' && $c->rightEmoji !== '2648') === [], 'checkSupported ♈ only ♈');
check(EmojiMixer::checkSupported('abc') === null, 'checkSupported abc');

$expanded = EmojiMixer::getExpandedEmojiCompatibilityData();
check(count($expanded) === count(EmojiMixer::supportedEmojis()), 'expanded count');
check($expanded['2615'] == EmojiMixer::checkSupported('2615'), 'expanded 2615');

check(EmojiMixer::googleRequestUrlEmojiPart('1f642-200d-2194-FE0F') === 'u1f642-u200d-u2194-ufe0f', 'url part');

echo $failures === 0 ? "ok\n" : "{$failures} failed\n";
exit($failures === 0 ? 0 : 1);
