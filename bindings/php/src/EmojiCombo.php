<?php

declare(strict_types=1);

namespace MattFor\EmojiMixer;

final class EmojiCombo
{
    public function __construct(
        public readonly string $leftEmoji,
        public readonly string $rightEmoji,
        public readonly string $date,
    ) {
    }
}
