package emojimixer_test

import (
	"fmt"

	emojimixer "github.com/MattFor/emoji-mixer/v2"
)

func ExampleEmojiMixURL() {
	url, err := emojimixer.EmojiMixURL("🔥", "😃")
	fmt.Println(url, err)
	// Output: https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f603/u1f603_u1f525.png <nil>
}
