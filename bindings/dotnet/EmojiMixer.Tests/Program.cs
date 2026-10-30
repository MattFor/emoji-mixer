// No test framework: dotnet run exits non-zero on a failure
using EmojiMixer;

var failures = 0;

void Check(bool ok, string what)
{
    if (!ok)
    {
        failures++;
        Console.Error.WriteLine($"FAIL: {what}");
    }
}

bool ThrowsWith(Action call, string needle)
{
    try
    {
        call();
    }
    catch (ArgumentException e)
    {
        return e.Message.Contains(needle, StringComparison.Ordinal);
    }

    return false;
}

static string Url(string date, string left, string right) => $"{EmojiKitchen.BaseUrl}/{date}/{left}/{left}_{right}.png";

Check(EmojiKitchen.GetEmojiMixUrl("☕", "♈") == Url("20260128", "u2615", "u2648"), "mix ☕ ♈");
Check(EmojiKitchen.GetEmojiMixUrl("♈", "☕") == Url("20260128", "u2615", "u2648"), "mix ♈ ☕");
Check(EmojiKitchen.GetEmojiMixUrl("🔥", "😃") == Url("20201001", "u1f603", "u1f525"), "mix 🔥 😃");
Check(EmojiKitchen.GetEmojiMixUrl("2615", "2615") == Url("20201001", "u2615", "u2615"), "mix 2615 2615");

foreach (var input in new[] { "not an emoji", "abc", "deadbeef", "", "😀😀", null, "\ud800" })
{
    Check(EmojiKitchen.GetEmojiMixUrl(input, "☕") is null, $"mix unsupported {input}");
}

Check(EmojiKitchen.GetEmojiMixUrl("☕", "🌳") is null, "mix ☕ 🌳");

Check(ThrowsWith(() => EmojiKitchen.GetEmojiMixUrl("abc", "☕", true), "'abc' [leftEmoji]"), "error left");
Check(ThrowsWith(() => EmojiKitchen.GetEmojiMixUrl("☕", "abc", true), "'abc' [rightEmoji]"), "error right");
Check(ThrowsWith(() => EmojiKitchen.GetEmojiMixUrl("☕", "🌳", true), "'2615' is not compatible with '1f333'"), "error pair");

foreach (var (input, want) in new[] { ("☕", "2615"), ("☕️", "2615"), ("❤", "2764-fe0f"), ("1F600", "1f600"), ("😮‍💨", "1f62e-200d-1f4a8"), ("❤️‍🩹", "2764-fe0f-200d-1fa79") })
{
    Check(EmojiKitchen.ToUnicode(input) == want, $"ToUnicode {input}");
}

foreach (var input in new[] { "1f6", "2", "a", "☕ hello", "😀😀", "", null, "2615\n" })
{
    Check(EmojiKitchen.ToUnicode(input) is null, $"ToUnicode unsupported {input}");
}

Check(EmojiKitchen.SupportedEmojis.Count > 600, "more than 600 supported emojis");
foreach (var key in EmojiKitchen.SupportedEmojis)
{
    var emoji = string.Concat(key.Split('-').Select(part => char.ConvertFromUtf32(Convert.ToInt32(part, 16))));
    Check(EmojiKitchen.ToUnicode(emoji) == key, $"ToUnicode itself {key}");
    Check(EmojiKitchen.ToUnicode(key.ToUpperInvariant()) == key, $"ToUnicode upper {key}");
    Check(EmojiKitchen.CheckSupported(key) is { Count: > 0 }, $"CheckSupported {key}");
}

Check(EmojiKitchen.GetEmojiCombo("2615", "2648") == new EmojiCombo("2615", "2648", "20260128"), "combo 2615 2648");
Check(EmojiKitchen.GetEmojiCombo("2648", "2615") == new EmojiCombo("2615", "2648", "20260128"), "combo 2648 2615");
Check(EmojiKitchen.GetEmojiCombo("2615", "2615") == new EmojiCombo("2615", "2615", "20201001"), "combo 2615 2615");
Check(EmojiKitchen.GetEmojiCombo("2615", "deadbeef") is null, "combo deadbeef");
Check(EmojiKitchen.GetEmojiCombo("$e", "2615") is null, "combo $e");

var combos = EmojiKitchen.CheckSupported("♈") ?? [];
Check(combos.Contains(new EmojiCombo("2615", "2648", "20260128")), "CheckSupported ♈ has ☕");
Check(combos.All(combo => combo.LeftEmoji == "2648" || combo.RightEmoji == "2648"), "CheckSupported ♈ only ♈");
Check(EmojiKitchen.CheckSupported("abc") is null, "CheckSupported abc");

var expanded = EmojiKitchen.GetExpandedEmojiCompatibilityData();
Check(expanded.Count == EmojiKitchen.SupportedEmojis.Count, "expanded count");
Check(expanded["2615"].SequenceEqual(EmojiKitchen.CheckSupported("2615")!), "expanded 2615");

Check(EmojiKitchen.GoogleRequestUrlEmojiPart("1f642-200d-2194-FE0F") == "u1f642-u200d-u2194-ufe0f", "url part");

Console.WriteLine(failures == 0 ? "ok" : $"{failures} failed");
return failures == 0 ? 0 : 1;
