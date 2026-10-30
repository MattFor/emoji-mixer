using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace EmojiMixer;

public sealed record EmojiCombo(string LeftEmoji, string RightEmoji, string Date);

public static partial class EmojiKitchen
{
    public const string BaseUrl = "https://www.gstatic.com/android/keyboard/emojikitchen";

    private sealed record Database(
        string[] Emojis,
        string[] Dates,
        Dictionary<string, (int Index, int Date)[]> Combos,
        string[] Supported,
        Dictionary<string, string> ByStripped);

    private static readonly Lazy<Database> database = new(Load);

    private static Database Load()
    {
        using var stream = typeof(EmojiKitchen).Assembly.GetManifestResourceStream("compatibility.json")!;
        using var json = JsonDocument.Parse(stream);
        var root = json.RootElement;
        var combos = new Dictionary<string, (int, int)[]>();
        foreach (var property in root.EnumerateObject().Where(property => !property.Name.StartsWith('$')))
        {
            combos[property.Name] = [.. property.Value.EnumerateArray().Select(entry => (entry[0].GetInt32(), entry[1].GetInt32()))];
        }

        string[] supported = [.. combos.Keys.Order(StringComparer.Ordinal)];
        var byStripped = new Dictionary<string, string>();
        foreach (var key in supported)
        {
            byStripped[StripFe0f(key)] = key;
        }

        return new Database(
            [.. root.GetProperty("$e").EnumerateArray().Select(emoji =>
                emoji.ValueKind == JsonValueKind.Number ? emoji.GetInt32().ToString("x", CultureInfo.InvariantCulture) : emoji.GetString()!)],
            [.. root.GetProperty("$d").EnumerateArray().Select(date => date.GetInt64().ToString(CultureInfo.InvariantCulture))],
            combos,
            supported,
            byStripped);
    }

    private static string StripFe0f(string codepoints) => string.Join('-', codepoints.Split('-').Where(part => part != "fe0f"));

    private static string EmojiAt(int index) => database.Value.Emojis[index < 0 ? ~index : index];

    private static EmojiCombo Expand(string anchor, (int Index, int Date) entry)
    {
        var other = EmojiAt(entry.Index);
        var date = database.Value.Dates[entry.Date];
        return entry.Index < 0 ? new EmojiCombo(other, anchor, date) : new EmojiCombo(anchor, other, date);
    }

    private static (int Index, int Date)[] CombosOf(string emoji) => database.Value.Combos.GetValueOrDefault(emoji, []);

    [GeneratedRegex(@"\A[0-9a-f]+(-[0-9a-f]+)*\z", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CodepointsPattern();

    public static IReadOnlyList<string> SupportedEmojis => Array.AsReadOnly(database.Value.Supported);

    public static string? ToUnicode(string? input)
    {
        if (input is null)
        {
            return null;
        }

        var codepoints = CodepointsPattern().IsMatch(input)
            ? input.ToLowerInvariant()
            : string.Join('-', input.EnumerateRunes().Select(rune => rune.Value.ToString("x", CultureInfo.InvariantCulture)));
        return database.Value.ByStripped.GetValueOrDefault(StripFe0f(codepoints));
    }

    public static IReadOnlyList<EmojiCombo>? CheckSupported(string? emoji)
    {
        var key = ToUnicode(emoji);
        return key is null ? null : [.. CombosOf(key).Select(entry => Expand(key, entry))];
    }

    public static IReadOnlyDictionary<string, IReadOnlyList<EmojiCombo>> GetExpandedEmojiCompatibilityData() =>
        database.Value.Supported.ToDictionary(key => key, key => CheckSupported(key)!);

    public static string GoogleRequestUrlEmojiPart(string emoji) =>
        string.Join('-', emoji.Split('-').Select(part => "u" + part.ToLowerInvariant()));

    public static string GoogleRequestUrl(EmojiCombo combo)
    {
        ArgumentNullException.ThrowIfNull(combo);
        var left = GoogleRequestUrlEmojiPart(combo.LeftEmoji);
        return $"{BaseUrl}/{combo.Date}/{left}/{left}_{GoogleRequestUrlEmojiPart(combo.RightEmoji)}.png";
    }

    public static EmojiCombo? GetEmojiCombo(string leftEmoji, string rightEmoji)
    {
        EmojiCombo? newest = null;
        foreach (var (anchor, other) in new[] { (leftEmoji, rightEmoji), (rightEmoji, leftEmoji) })
        {
            foreach (var entry in CombosOf(anchor).Where(entry => EmojiAt(entry.Index) == other))
            {
                var combo = Expand(anchor, entry);
                if (newest is null || string.CompareOrdinal(combo.Date, newest.Date) > 0)
                {
                    newest = combo;
                }
            }
        }

        return newest;
    }

    public static string? GetEmojiMixUrl(string? leftEmoji, string? rightEmoji, bool detailedErrors = false)
    {
        var left = ToUnicode(leftEmoji);
        var right = ToUnicode(rightEmoji);
        var combo = left is not null && right is not null ? GetEmojiCombo(left, right) : null;

        if (combo is not null)
        {
            return GoogleRequestUrl(combo);
        }

        if (!detailedErrors)
        {
            return null;
        }

        if (left is null)
        {
            throw new ArgumentException($"'{leftEmoji}' [leftEmoji] is not a supported emoji.", nameof(leftEmoji));
        }

        if (right is null)
        {
            throw new ArgumentException($"'{rightEmoji}' [rightEmoji] is not a supported emoji.", nameof(rightEmoji));
        }

        var compatible = string.Join(", ", CombosOf(right).Select(entry => EmojiAt(entry.Index)));
        throw new ArgumentException(
            $"'{left}' is not compatible with '{right}'. Here are all emojis compatible with '{right}':\n[{compatible}]");
    }
}
