import unittest

from emoji_mixer import (
    BASE_URL,
    EmojiCombo,
    check_supported,
    get_emoji_combo,
    get_emoji_mix_url,
    get_expanded_emoji_compatibility_data,
    google_request_url_emoji_part,
    supported_emojis,
    to_unicode,
)


def url(date, left, right):
    return f"{BASE_URL}/{date}/{left}/{left}_{right}.png"


class EmojiMixerTest(unittest.TestCase):
    def test_mix_url_uses_googles_order_whichever_way_it_is_called(self):
        self.assertEqual(get_emoji_mix_url("☕", "♈"), url(20260128, "u2615", "u2648"))
        self.assertEqual(get_emoji_mix_url("♈", "☕"), url(20260128, "u2615", "u2648"))
        self.assertEqual(
            get_emoji_mix_url("🔥", "😃"), url(20201001, "u1f603", "u1f525")
        )
        self.assertEqual(
            get_emoji_mix_url("2615", "2615"), url(20201001, "u2615", "u2615")
        )

    def test_mix_url_returns_none_for_unsupported_input_and_pairs(self):
        for value in ["not an emoji", "abc", "deadbeef", "", "😀😀", None]:
            self.assertIsNone(get_emoji_mix_url(value, "☕"))

        self.assertIsNone(get_emoji_mix_url("☕", "🌳"))

    def test_detailed_errors_name_the_problem(self):
        with self.assertRaisesRegex(ValueError, r"'abc' \[left_emoji\]"):
            get_emoji_mix_url("abc", "☕", True)

        with self.assertRaisesRegex(ValueError, r"'abc' \[right_emoji\]"):
            get_emoji_mix_url("☕", "abc", True)

        with self.assertRaisesRegex(
            ValueError, "'2615' is not compatible with '1f333'"
        ):
            get_emoji_mix_url("☕", "🌳", True)

    def test_to_unicode_accepts_exactly_one_supported_emoji(self):
        self.assertEqual(to_unicode("☕"), "2615")
        self.assertEqual(to_unicode("☕️"), "2615")
        self.assertEqual(to_unicode("❤"), "2764-fe0f")
        self.assertEqual(to_unicode("1F600"), "1f600")
        self.assertEqual(to_unicode("😮‍💨"), "1f62e-200d-1f4a8")
        self.assertEqual(to_unicode("❤️‍🩹"), "2764-fe0f-200d-1fa79")

        for value in ["1f6", "2", "a", "☕ hello", "😀😀", "", None, 2615]:
            self.assertIsNone(to_unicode(value))

    def test_every_supported_emoji_resolves_to_itself(self):
        for key in supported_emojis:
            self.assertEqual(
                to_unicode("".join(chr(int(part, 16)) for part in key.split("-"))), key
            )
            self.assertEqual(to_unicode(key.upper()), key)
            self.assertTrue(check_supported(key))

    def test_get_emoji_combo_returns_the_newest_combo_in_googles_order(self):
        combo = EmojiCombo("2615", "2648", "20260128")

        self.assertEqual(get_emoji_combo("2615", "2648"), combo)
        self.assertEqual(get_emoji_combo("2648", "2615"), combo)
        self.assertEqual(
            get_emoji_combo("2615", "2615"), EmojiCombo("2615", "2615", "20201001")
        )
        self.assertIsNone(get_emoji_combo("2615", "deadbeef"))
        self.assertIsNone(get_emoji_combo("$e", "2615"))

    def test_check_supported_lists_combos_containing_the_emoji(self):
        combos = check_supported("♈")

        self.assertIn(EmojiCombo("2615", "2648", "20260128"), combos)
        self.assertTrue(
            all("2648" in (combo.left_emoji, combo.right_emoji) for combo in combos)
        )
        self.assertIsNone(check_supported("abc"))

    def test_expanded_data_covers_every_emoji(self):
        expanded = get_expanded_emoji_compatibility_data()

        self.assertEqual(list(expanded), supported_emojis)
        self.assertEqual(expanded["2615"], check_supported("2615"))

    def test_url_part_formats_codepoints(self):
        self.assertEqual(
            google_request_url_emoji_part("1f642-200d-2194-FE0F"),
            "u1f642-u200d-u2194-ufe0f",
        )


if __name__ == "__main__":
    unittest.main()
