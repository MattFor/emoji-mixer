<?php

declare(strict_types=1);

namespace MattFor\EmojiMixer;

final class EmojiMixer
{
    public const BASE_URL = 'https://www.gstatic.com/android/keyboard/emojikitchen';

    private static ?array $data = null;

    private static function data(): array
    {
        if (self::$data === null) {
            $raw = json_decode((string) file_get_contents(__DIR__ . '/../../../compatibility.json'), true, 512, JSON_THROW_ON_ERROR);
            $combos = array_filter($raw, fn ($key) => !str_starts_with((string) $key, '$'), ARRAY_FILTER_USE_KEY);
            // PHP turns keys like "2615" into integers
            $supported = array_map('strval', array_keys($combos));
            sort($supported, SORT_STRING);
            $byStripped = [];
            foreach ($supported as $key) {
                $byStripped[self::stripFe0f($key)] = $key;
            }
            self::$data = [
                'emojis' => array_map(fn ($emoji) => is_int($emoji) ? dechex($emoji) : $emoji, $raw['$e']),
                'dates' => array_map('strval', $raw['$d']),
                'combos' => $combos,
                'supported' => $supported,
                'byStripped' => $byStripped,
            ];
        }

        return self::$data;
    }

    private static function stripFe0f(string $codepoints): string
    {
        return implode('-', array_filter(explode('-', $codepoints), fn ($part) => $part !== 'fe0f'));
    }

    private static function emojiAt(int $index): string
    {
        return self::data()['emojis'][$index < 0 ? ~$index : $index];
    }

    private static function expand(string $anchor, array $entry): EmojiCombo
    {
        [$index, $dateIndex] = $entry;
        $other = self::emojiAt($index);
        $date = self::data()['dates'][$dateIndex];

        return $index < 0 ? new EmojiCombo($other, $anchor, $date) : new EmojiCombo($anchor, $other, $date);
    }

    private static function combosOf(string $emoji): array
    {
        return self::data()['combos'][$emoji] ?? [];
    }

    private static function codepoint(string $char): int
    {
        $bytes = array_values(unpack('C*', $char));
        $length = count($bytes);
        $codepoint = $length === 1 ? $bytes[0] : $bytes[0] & (0xFF >> ($length + 1));
        for ($i = 1; $i < $length; $i++) {
            $codepoint = ($codepoint << 6) | ($bytes[$i] & 0x3F);
        }

        return $codepoint;
    }

    public static function supportedEmojis(): array
    {
        return self::data()['supported'];
    }

    public static function toUnicode(string $input): ?string
    {
        if (preg_match('/\A[0-9a-f]+(-[0-9a-f]+)*\z/i', $input) === 1) {
            $codepoints = strtolower($input);
        } else {
            $chars = preg_split('//u', $input, -1, PREG_SPLIT_NO_EMPTY);
            if ($chars === false) {
                return null; // not valid UTF-8
            }
            $codepoints = implode('-', array_map(fn ($char) => dechex(self::codepoint($char)), $chars));
        }

        return self::data()['byStripped'][self::stripFe0f($codepoints)] ?? null;
    }

    public static function checkSupported(string $emoji): ?array
    {
        $key = self::toUnicode($emoji);

        return $key === null ? null : array_map(fn ($entry) => self::expand($key, $entry), self::combosOf($key));
    }

    public static function getExpandedEmojiCompatibilityData(): array
    {
        $expanded = [];
        foreach (self::supportedEmojis() as $key) {
            $expanded[$key] = self::checkSupported($key);
        }

        return $expanded;
    }

    public static function googleRequestUrlEmojiPart(string $emoji): string
    {
        return implode('-', array_map(fn ($part) => 'u' . strtolower($part), explode('-', $emoji)));
    }

    public static function googleRequestUrl(EmojiCombo $combo): string
    {
        $left = self::googleRequestUrlEmojiPart($combo->leftEmoji);

        return self::BASE_URL . "/{$combo->date}/{$left}/{$left}_" . self::googleRequestUrlEmojiPart($combo->rightEmoji) . '.png';
    }

    public static function getEmojiCombo(string $leftEmoji, string $rightEmoji): ?EmojiCombo
    {
        $newest = null;
        foreach ([[$leftEmoji, $rightEmoji], [$rightEmoji, $leftEmoji]] as [$anchor, $other]) {
            foreach (self::combosOf($anchor) as $entry) {
                if (self::emojiAt($entry[0]) === $other) {
                    $combo = self::expand($anchor, $entry);
                    if ($newest === null || $combo->date > $newest->date) {
                        $newest = $combo;
                    }
                }
            }
        }

        return $newest;
    }

    public static function getEmojiMixUrl(string $leftEmoji, string $rightEmoji, bool $detailedErrors = false): ?string
    {
        $left = self::toUnicode($leftEmoji);
        $right = self::toUnicode($rightEmoji);
        $combo = $left !== null && $right !== null ? self::getEmojiCombo($left, $right) : null;

        if ($combo !== null) {
            return self::googleRequestUrl($combo);
        }

        if (!$detailedErrors) {
            return null;
        }

        if ($left === null) {
            throw new \InvalidArgumentException("'{$leftEmoji}' [leftEmoji] is not a supported emoji.");
        }

        if ($right === null) {
            throw new \InvalidArgumentException("'{$rightEmoji}' [rightEmoji] is not a supported emoji.");
        }

        $compatible = implode(', ', array_map(fn ($entry) => self::emojiAt($entry[0]), self::combosOf($right)));
        throw new \InvalidArgumentException(
            "'{$left}' is not compatible with '{$right}'. Here are all emojis compatible with '{$right}':\n[{$compatible}]"
        );
    }
}
