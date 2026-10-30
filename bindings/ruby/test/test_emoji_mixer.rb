# frozen_string_literal: true

require "minitest/autorun"
require "emoji_mixer"

class TestEmojiMixer < Minitest::Test
  Combo = EmojiMixer::EmojiCombo

  def url(date, left, right)
    "#{EmojiMixer::BASE_URL}/#{date}/#{left}/#{left}_#{right}.png"
  end

  def test_mix_url_uses_googles_order_whichever_way_it_is_called
    assert_equal url("20260128", "u2615", "u2648"), EmojiMixer.emoji_mix_url("☕", "♈")
    assert_equal url("20260128", "u2615", "u2648"), EmojiMixer.emoji_mix_url("♈", "☕")
    assert_equal url("20201001", "u1f603", "u1f525"), EmojiMixer.emoji_mix_url("🔥", "😃")
    assert_equal url("20201001", "u2615", "u2615"), EmojiMixer.emoji_mix_url("2615", "2615")
  end

  def test_mix_url_returns_nil_for_unsupported_input_and_pairs
    ["not an emoji", "abc", "deadbeef", "", "😀😀", nil, "\xff"].each do |input|
      assert_nil EmojiMixer.emoji_mix_url(input, "☕"), input.inspect
    end
    assert_nil EmojiMixer.emoji_mix_url("☕", "🌳")
  end

  def test_detailed_errors_name_the_problem
    assert_match(/'abc' \[left_emoji\]/, assert_raises(ArgumentError) { EmojiMixer.emoji_mix_url("abc", "☕", detailed_errors: true) }.message)
    assert_match(/'abc' \[right_emoji\]/, assert_raises(ArgumentError) { EmojiMixer.emoji_mix_url("☕", "abc", detailed_errors: true) }.message)
    assert_match(/'2615' is not compatible with '1f333'/, assert_raises(ArgumentError) { EmojiMixer.emoji_mix_url("☕", "🌳", detailed_errors: true) }.message)
  end

  def test_to_unicode_accepts_exactly_one_supported_emoji
    {"☕" => "2615", "☕️" => "2615", "❤" => "2764-fe0f", "1F600" => "1f600", "😮‍💨" => "1f62e-200d-1f4a8", "❤️‍🩹" => "2764-fe0f-200d-1fa79"}.each do |input, want|
      assert_equal want, EmojiMixer.to_unicode(input), input
    end
    ["1f6", "2", "a", "☕ hello", "😀😀", "", nil, 2615, "2615\n"].each do |input|
      assert_nil EmojiMixer.to_unicode(input), input.inspect
    end
  end

  def test_every_supported_emoji_resolves_to_itself
    assert_operator EmojiMixer.supported_emojis.size, :>, 600
    EmojiMixer.supported_emojis.each do |key|
      assert_equal key, EmojiMixer.to_unicode(key.split("-").map { |part| part.hex.chr(Encoding::UTF_8) }.join)
      assert_equal key, EmojiMixer.to_unicode(key.upcase)
      refute_empty EmojiMixer.check_supported(key)
    end
  end

  def test_emoji_combo_returns_the_newest_combo_in_googles_order
    assert_equal Combo.new("2615", "2648", "20260128"), EmojiMixer.emoji_combo("2615", "2648")
    assert_equal Combo.new("2615", "2648", "20260128"), EmojiMixer.emoji_combo("2648", "2615")
    assert_equal Combo.new("2615", "2615", "20201001"), EmojiMixer.emoji_combo("2615", "2615")
    assert_nil EmojiMixer.emoji_combo("2615", "deadbeef")
    assert_nil EmojiMixer.emoji_combo("$e", "2615")
  end

  def test_check_supported_lists_combos_containing_the_emoji
    combos = EmojiMixer.check_supported("♈")
    assert_includes combos, Combo.new("2615", "2648", "20260128")
    assert(combos.all? { |combo| [combo.left_emoji, combo.right_emoji].include?("2648") })
    assert_nil EmojiMixer.check_supported("abc")
  end

  def test_expanded_data_covers_every_emoji
    expanded = EmojiMixer.expanded_emoji_compatibility_data
    assert_equal EmojiMixer.supported_emojis, expanded.keys
    assert_equal EmojiMixer.check_supported("2615"), expanded["2615"]
  end

  def test_url_part_formats_codepoints
    assert_equal "u1f642-u200d-u2194-ufe0f", EmojiMixer.google_request_url_emoji_part("1f642-200d-2194-FE0F")
  end
end
