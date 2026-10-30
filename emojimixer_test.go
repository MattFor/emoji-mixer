package emojimixer

import (
	"slices"
	"strconv"
	"strings"
	"testing"
)

func url(date, left, right string) string {
	return BaseURL + "/" + date + "/" + left + "/" + left + "_" + right + ".png"
}

func TestEmojiMixURLUsesGooglesOrderWhicheverWayItIsCalled(t *testing.T) {
	t.Parallel()
	for _, c := range []struct{ left, right, want string }{
		{"☕", "♈", url("20260128", "u2615", "u2648")},
		{"♈", "☕", url("20260128", "u2615", "u2648")},
		{"🔥", "😃", url("20201001", "u1f603", "u1f525")},
		{"2615", "2615", url("20201001", "u2615", "u2615")},
	} {
		if got, err := EmojiMixURL(c.left, c.right); got != c.want || err != nil {
			t.Errorf("EmojiMixURL(%q, %q) = %q, %v; want %q", c.left, c.right, got, err, c.want)
		}
	}
}

func TestEmojiMixURLErrorsNameTheProblem(t *testing.T) {
	t.Parallel()
	for _, input := range []string{"not an emoji", "abc", "deadbeef", "", "😀😀"} {
		if got, err := EmojiMixURL(input, "☕"); got != "" || err == nil {
			t.Errorf("EmojiMixURL(%q, ☕) = %q, %v; want an error", input, got, err)
		}
	}
	for _, c := range []struct{ left, right, want string }{
		{"abc", "☕", "'abc' [leftEmoji]"},
		{"☕", "abc", "'abc' [rightEmoji]"},
		{"☕", "🌳", "'2615' is not compatible with '1f333'"},
	} {
		if _, err := EmojiMixURL(c.left, c.right); err == nil || !strings.Contains(err.Error(), c.want) {
			t.Errorf("EmojiMixURL(%q, %q) error = %v; want it to contain %q", c.left, c.right, err, c.want)
		}
	}
}

func TestToUnicodeAcceptsExactlyOneSupportedEmoji(t *testing.T) {
	t.Parallel()
	for input, want := range map[string]string{
		"☕":     "2615",
		"☕️":    "2615",
		"❤":     "2764-fe0f",
		"1F600": "1f600",
		"😮‍💨":   "1f62e-200d-1f4a8",
		"❤️‍🩹":  "2764-fe0f-200d-1fa79",
	} {
		if got, ok := ToUnicode(input); got != want || !ok {
			t.Errorf("ToUnicode(%q) = %q, %v; want %q", input, got, ok, want)
		}
	}
	for _, input := range []string{"1f6", "2", "a", "☕ hello", "😀😀", ""} {
		if got, ok := ToUnicode(input); ok {
			t.Errorf("ToUnicode(%q) = %q; want not supported", input, got)
		}
	}
}

func TestEverySupportedEmojiResolvesToItself(t *testing.T) {
	t.Parallel()
	for _, key := range SupportedEmojis() {
		var emoji strings.Builder
		for _, part := range strings.Split(key, "-") {
			codepoint, _ := strconv.ParseInt(part, 16, 32)
			emoji.WriteRune(rune(codepoint))
		}
		for _, input := range []string{emoji.String(), strings.ToUpper(key)} {
			if got, ok := ToUnicode(input); got != key || !ok {
				t.Errorf("ToUnicode(%q) = %q, %v; want %q", input, got, ok, key)
			}
		}
		if combos, ok := CheckSupported(key); !ok || len(combos) == 0 {
			t.Errorf("CheckSupported(%q) has no combinations", key)
		}
	}
}

func TestEmojiComboReturnsTheNewestComboInGooglesOrder(t *testing.T) {
	t.Parallel()
	for _, c := range []struct {
		left, right string
		want        Combo
		ok          bool
	}{
		{"2615", "2648", Combo{"2615", "2648", "20260128"}, true},
		{"2648", "2615", Combo{"2615", "2648", "20260128"}, true},
		{"2615", "2615", Combo{"2615", "2615", "20201001"}, true},
		{"2615", "deadbeef", Combo{}, false},
		{"$e", "2615", Combo{}, false},
	} {
		if got, ok := EmojiCombo(c.left, c.right); got != c.want || ok != c.ok {
			t.Errorf("EmojiCombo(%q, %q) = %v, %v; want %v, %v", c.left, c.right, got, ok, c.want, c.ok)
		}
	}
}

func TestCheckSupportedListsCombosContainingTheEmoji(t *testing.T) {
	t.Parallel()
	combos, ok := CheckSupported("♈")
	if !ok || !slices.Contains(combos, Combo{"2615", "2648", "20260128"}) {
		t.Errorf("CheckSupported(♈) = %v, %v; want it to contain ☕ + ♈", len(combos), ok)
	}
	for _, combo := range combos {
		if combo.LeftEmoji != "2648" && combo.RightEmoji != "2648" {
			t.Errorf("CheckSupported(♈) contains %v", combo)
		}
	}
	if _, ok := CheckSupported("abc"); ok {
		t.Error("CheckSupported(abc) is supported")
	}
}

func TestExpandedDataCoversEveryEmoji(t *testing.T) {
	t.Parallel()
	expanded := ExpandedEmojiCompatibilityData()
	coffee, _ := CheckSupported("2615")
	if len(expanded) != len(SupportedEmojis()) || !slices.Equal(expanded["2615"], coffee) {
		t.Errorf("ExpandedEmojiCompatibilityData() has %d emojis, ☕ %d combos", len(expanded), len(expanded["2615"]))
	}
}

func TestGoogleRequestURLEmojiPartFormatsCodepoints(t *testing.T) {
	t.Parallel()
	if got := GoogleRequestURLEmojiPart("1f642-200d-2194-FE0F"); got != "u1f642-u200d-u2194-ufe0f" {
		t.Errorf("GoogleRequestURLEmojiPart = %q", got)
	}
}

func TestCompressedDataOnlyReferencesExistingEntries(t *testing.T) {
	t.Parallel()
	d := data()
	if len(d.supported) <= 600 {
		t.Fatalf("only %d supported emojis", len(d.supported))
	}
	for key, entries := range d.combos {
		for _, entry := range entries {
			index := entry[0]
			if index < 0 {
				index = ^index
			}
			if index >= len(d.emojis) || entry[1] < 0 || entry[1] >= len(d.dates) {
				t.Fatalf("%s has entry %v outside the lookup tables", key, entry)
			}
		}
	}
}
