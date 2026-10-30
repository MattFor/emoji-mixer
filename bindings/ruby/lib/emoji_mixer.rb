# frozen_string_literal: true

require "json"

module EmojiMixer
  BASE_URL = "https://www.gstatic.com/android/keyboard/emojikitchen"

  EmojiCombo = Data.define(:left_emoji, :right_emoji, :date)

  DATA_FILE = File.expand_path("../../../compatibility.json", __dir__)
  private_constant :DATA_FILE

  class << self
    def supported_emojis
      data[:supported].dup
    end

    def to_unicode(input)
      return nil unless input.is_a?(String) && input.valid_encoding?

      codepoints = if input.match?(/\A[0-9a-f]+(-[0-9a-f]+)*\z/i)
        input.downcase
      else
        input.each_char.map { |char| char.ord.to_s(16) }.join("-")
      end
      data[:by_stripped][strip_fe0f(codepoints)]
    end

    def check_supported(emoji)
      key = to_unicode(emoji)
      key && combos_of(key).map { |entry| expand(key, entry) }
    end

    def expanded_emoji_compatibility_data
      data[:supported].to_h { |key| [key, check_supported(key)] }
    end

    def google_request_url_emoji_part(emoji)
      emoji.split("-").map { |part| "u#{part.downcase}" }.join("-")
    end

    def google_request_url(combo)
      left = google_request_url_emoji_part(combo.left_emoji)
      "#{BASE_URL}/#{combo.date}/#{left}/#{left}_#{google_request_url_emoji_part(combo.right_emoji)}.png"
    end

    def emoji_combo(left_emoji, right_emoji)
      [[left_emoji, right_emoji], [right_emoji, left_emoji]]
        .flat_map { |anchor, other| combos_of(anchor).select { |index, _| emoji_at(index) == other }.map { |entry| expand(anchor, entry) } }
        .max_by(&:date)
    end

    def emoji_mix_url(left_emoji, right_emoji, detailed_errors: false)
      left = to_unicode(left_emoji)
      right = to_unicode(right_emoji)
      combo = left && right && emoji_combo(left, right)

      return google_request_url(combo) if combo
      return nil unless detailed_errors

      raise ArgumentError, "'#{left_emoji}' [left_emoji] is not a supported emoji." unless left
      raise ArgumentError, "'#{right_emoji}' [right_emoji] is not a supported emoji." unless right

      compatible = combos_of(right).map { |index, _| emoji_at(index) }.join(", ")
      raise ArgumentError,
        "'#{left}' is not compatible with '#{right}'. Here are all emojis compatible with '#{right}':\n[#{compatible}]"
    end

    private

    def data
      @data ||= begin
        raw = JSON.parse(File.read(DATA_FILE))
        combos = raw.reject { |key, _| key.start_with?("$") }
        supported = combos.keys.sort
        {
          emojis: raw["$e"].map { |emoji| emoji.is_a?(Integer) ? emoji.to_s(16) : emoji },
          dates: raw["$d"].map(&:to_s),
          combos: combos,
          supported: supported,
          by_stripped: supported.to_h { |key| [strip_fe0f(key), key] }
        }
      end
    end

    def strip_fe0f(codepoints)
      codepoints.split("-").reject { |part| part == "fe0f" }.join("-")
    end

    def combos_of(emoji)
      data[:combos].fetch(emoji, [])
    end

    def emoji_at(index)
      data[:emojis][index.negative? ? ~index : index]
    end

    def expand(anchor, (index, date_index))
      other = emoji_at(index)
      date = data[:dates][date_index]
      index.negative? ? EmojiCombo.new(other, anchor, date) : EmojiCombo.new(anchor, other, date)
    end
  end
end
