// Package emojimixer gets the URL of a Google Emoji Kitchen image for two emojis, given as characters or codepoints.
package emojimixer

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"sync"
)

// BaseURL is where Google hosts the Emoji Kitchen images.
const BaseURL = "https://www.gstatic.com/android/keyboard/emojikitchen"

//go:embed compatibility.json
var compatibilityJSON []byte

// Combo is one mix. LeftEmoji and RightEmoji are codepoint keys in the order Google hosts the image under.
type Combo struct {
	LeftEmoji  string
	RightEmoji string
	Date       string
}

type database struct {
	emojis     []string
	dates      []string
	combos     map[string][][2]int // [emojiIndex, dateIndex]; a negative (^i) emojiIndex: the key is on the right
	supported  []string
	byStripped map[string]string
}

var data = sync.OnceValue(func() *database {
	var raw map[string]json.RawMessage
	var emojis []any
	var dates []int64
	must(json.Unmarshal(compatibilityJSON, &raw))
	must(json.Unmarshal(raw["$e"], &emojis))
	must(json.Unmarshal(raw["$d"], &dates))

	d := &database{combos: map[string][][2]int{}, byStripped: map[string]string{}}
	for _, emoji := range emojis {
		if codepoint, ok := emoji.(float64); ok {
			d.emojis = append(d.emojis, strconv.FormatInt(int64(codepoint), 16))
		} else {
			d.emojis = append(d.emojis, emoji.(string))
		}
	}
	for _, date := range dates {
		d.dates = append(d.dates, strconv.FormatInt(date, 10))
	}
	for key, entries := range raw {
		if !strings.HasPrefix(key, "$") {
			var combos [][2]int
			must(json.Unmarshal(entries, &combos))
			d.combos[key] = combos
			d.supported = append(d.supported, key)
		}
	}
	slices.Sort(d.supported)
	for _, key := range d.supported {
		d.byStripped[stripFE0F(key)] = key
	}
	return d
})

func must(err error) {
	if err != nil {
		panic("emojimixer: compatibility.json: " + err.Error())
	}
}

func stripFE0F(codepoints string) string {
	return strings.Join(slices.DeleteFunc(strings.Split(codepoints, "-"), func(part string) bool { return part == "fe0f" }), "-")
}

func (d *database) emojiAt(index int) string {
	if index < 0 {
		index = ^index
	}
	return d.emojis[index]
}

func (d *database) expand(anchor string, entry [2]int) Combo {
	other, date := d.emojiAt(entry[0]), d.dates[entry[1]]
	if entry[0] < 0 {
		return Combo{LeftEmoji: other, RightEmoji: anchor, Date: date}
	}
	return Combo{LeftEmoji: anchor, RightEmoji: other, Date: date}
}

// SupportedEmojis returns the codepoint keys of every supported emoji, sorted.
func SupportedEmojis() []string {
	return slices.Clone(data().supported)
}

var codepointsPattern = regexp.MustCompile(`(?i)^[0-9a-f]+(-[0-9a-f]+)*$`)

// ToUnicode returns the codepoint key of exactly one supported emoji, e.g. "☕" → "2615".
func ToUnicode(input string) (string, bool) {
	codepoints := strings.ToLower(input)
	if !codepointsPattern.MatchString(input) {
		parts := []string{}
		for _, char := range input {
			parts = append(parts, strconv.FormatInt(int64(char), 16))
		}
		codepoints = strings.Join(parts, "-")
	}
	key, ok := data().byStripped[stripFE0F(codepoints)]
	return key, ok
}

// CheckSupported returns every combination containing the emoji, on either side, or false if it is unsupported.
func CheckSupported(emoji string) ([]Combo, bool) {
	key, ok := ToUnicode(emoji)
	if !ok {
		return nil, false
	}
	d := data()
	combos := make([]Combo, 0, len(d.combos[key]))
	for _, entry := range d.combos[key] {
		combos = append(combos, d.expand(key, entry))
	}
	return combos, true
}

// ExpandedEmojiCompatibilityData returns every combination of every supported emoji, by codepoint key.
func ExpandedEmojiCompatibilityData() map[string][]Combo {
	expanded := map[string][]Combo{}
	for _, key := range data().supported {
		expanded[key], _ = CheckSupported(key)
	}
	return expanded
}

// GoogleRequestURLEmojiPart formats one emoji's codepoint key for the image URL.
func GoogleRequestURLEmojiPart(emoji string) string {
	parts := strings.Split(emoji, "-")
	for i, part := range parts {
		parts[i] = "u" + strings.ToLower(part)
	}
	return strings.Join(parts, "-")
}

// GoogleRequestURL builds the image URL of a combination.
func GoogleRequestURL(combo Combo) string {
	left := GoogleRequestURLEmojiPart(combo.LeftEmoji)
	return fmt.Sprintf("%s/%s/%s/%s_%s.png", BaseURL, combo.Date, left, left, GoogleRequestURLEmojiPart(combo.RightEmoji))
}

// EmojiCombo returns the newest combination of two codepoint keys, in Google's order rather than the argument order.
func EmojiCombo(leftEmoji, rightEmoji string) (Combo, bool) {
	d := data()
	var newest Combo
	found := false
	for _, pair := range [][2]string{{leftEmoji, rightEmoji}, {rightEmoji, leftEmoji}} {
		for _, entry := range d.combos[pair[0]] {
			if d.emojiAt(entry[0]) == pair[1] {
				if combo := d.expand(pair[0], entry); !found || combo.Date > newest.Date {
					newest, found = combo, true
				}
			}
		}
	}
	return newest, found
}

// EmojiMixURL returns the image URL for two emojis, or an error saying why there is none.
func EmojiMixURL(leftEmoji, rightEmoji string) (string, error) {
	left, leftOK := ToUnicode(leftEmoji)
	right, rightOK := ToUnicode(rightEmoji)
	switch {
	case !leftOK:
		return "", fmt.Errorf("'%s' [leftEmoji] is not a supported emoji", leftEmoji)
	case !rightOK:
		return "", fmt.Errorf("'%s' [rightEmoji] is not a supported emoji", rightEmoji)
	}
	if combo, ok := EmojiCombo(left, right); ok {
		return GoogleRequestURL(combo), nil
	}
	d := data()
	compatible := make([]string, 0, len(d.combos[right]))
	for _, entry := range d.combos[right] {
		compatible = append(compatible, d.emojiAt(entry[0]))
	}
	return "", fmt.Errorf("'%s' is not compatible with '%s'. Here are all emojis compatible with '%s':\n[%s]",
		left, right, right, strings.Join(compatible, ", "))
}
