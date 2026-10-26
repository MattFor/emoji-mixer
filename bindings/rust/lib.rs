use serde_json::Value;
use std::collections::HashMap;
use std::sync::LazyLock;

pub const BASE_URL: &str = "https://www.gstatic.com/android/keyboard/emojikitchen";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmojiCombo {
	pub left_emoji: String,
	pub right_emoji: String,
	pub date: String,
}

struct Data {
	emojis: Vec<String>,
	dates: Vec<String>,
	combos: HashMap<String, Vec<(i64, usize)>>,
	supported: Vec<String>,
	by_stripped_key: HashMap<String, String>,
}

static DATA: LazyLock<Data> = LazyLock::new(|| {
	let data: HashMap<String, Value> = serde_json::from_str(include_str!("../../compatibility.json")).unwrap();
	let hex = |value: &Value| {
		value
			.as_u64()
			.map_or_else(|| value.as_str().unwrap().to_owned(), |n| format!("{n:x}"))
	};
	let combos: HashMap<String, Vec<(i64, usize)>> = data
		.iter()
		.filter(|(key, _)| !key.starts_with('$'))
		.map(|(key, entries)| {
			let entries = entries.as_array().unwrap().iter();
			(
				key.clone(),
				entries
					.map(|entry| (entry[0].as_i64().unwrap(), entry[1].as_u64().unwrap() as usize))
					.collect(),
			)
		})
		.collect();
	let mut supported: Vec<String> = combos.keys().cloned().collect();
	supported.sort();

	Data {
		emojis: data["$e"].as_array().unwrap().iter().map(hex).collect(),
		dates: data["$d"].as_array().unwrap().iter().map(Value::to_string).collect(),
		by_stripped_key: supported.iter().map(|key| (strip_fe0f(key), key.clone())).collect(),
		combos,
		supported,
	}
});

fn strip_fe0f(codepoints: &str) -> String {
	codepoints
		.split('-')
		.filter(|part| *part != "fe0f")
		.collect::<Vec<_>>()
		.join("-")
}

fn combos_of(emoji: &str) -> &'static [(i64, usize)] {
	DATA.combos.get(emoji).map_or(&[][..], Vec::as_slice)
}

fn emoji_at(index: i64) -> &'static str {
	let index = if index < 0 { !index } else { index };
	&DATA.emojis[index as usize]
}

fn expand(anchor: &str, (index, date_index): (i64, usize)) -> EmojiCombo {
	let (other, date) = (emoji_at(index).to_owned(), DATA.dates[date_index].clone());

	if index < 0 {
		EmojiCombo {
			left_emoji: other,
			right_emoji: anchor.to_owned(),
			date,
		}
	} else {
		EmojiCombo {
			left_emoji: anchor.to_owned(),
			right_emoji: other,
			date,
		}
	}
}

pub fn supported_emojis() -> &'static [String] {
	&DATA.supported
}

pub fn to_unicode(input: &str) -> Option<&'static str> {
	let is_codepoints = input
		.split('-')
		.all(|part| !part.is_empty() && part.chars().all(|c| c.is_ascii_hexdigit()));
	let codepoints = if is_codepoints {
		input.to_ascii_lowercase()
	} else {
		input
			.chars()
			.map(|c| format!("{:x}", c as u32))
			.collect::<Vec<_>>()
			.join("-")
	};

	DATA.by_stripped_key.get(&strip_fe0f(&codepoints)).map(String::as_str)
}

pub fn check_supported(emoji: &str) -> Option<Vec<EmojiCombo>> {
	let key = to_unicode(emoji)?;
	Some(combos_of(key).iter().map(|&entry| expand(key, entry)).collect())
}

pub fn google_request_url_emoji_part(emoji: &str) -> String {
	emoji
		.split('-')
		.map(|part| format!("u{}", part.to_lowercase()))
		.collect::<Vec<_>>()
		.join("-")
}

pub fn google_request_url(combo: &EmojiCombo) -> String {
	let left = google_request_url_emoji_part(&combo.left_emoji);
	format!(
		"{BASE_URL}/{}/{left}/{left}_{}.png",
		combo.date,
		google_request_url_emoji_part(&combo.right_emoji)
	)
}

pub fn get_emoji_combo(left_emoji: &str, right_emoji: &str) -> Option<EmojiCombo> {
	[(left_emoji, right_emoji), (right_emoji, left_emoji)]
		.into_iter()
		.flat_map(|(anchor, other)| {
			combos_of(anchor)
				.iter()
				.filter(move |&&(index, _)| emoji_at(index) == other)
				.map(move |&entry| expand(anchor, entry))
		})
		.max_by(|a, b| a.date.cmp(&b.date))
}

pub fn get_emoji_mix_url(left_emoji: &str, right_emoji: &str) -> Option<String> {
	get_emoji_combo(to_unicode(left_emoji)?, to_unicode(right_emoji)?).map(|combo| google_request_url(&combo))
}

#[cfg(test)]
mod tests {
	use super::*;

	fn url(date: &str, left: &str, right: &str) -> Option<String> {
		Some(format!("{BASE_URL}/{date}/{left}/{left}_{right}.png"))
	}

	fn combo(left_emoji: &str, right_emoji: &str, date: &str) -> EmojiCombo {
		EmojiCombo {
			left_emoji: left_emoji.into(),
			right_emoji: right_emoji.into(),
			date: date.into(),
		}
	}

	#[test]
	fn mix_url_uses_googles_order_whichever_way_it_is_called() {
		assert_eq!(get_emoji_mix_url("☕", "♈"), url("20260128", "u2615", "u2648"));
		assert_eq!(get_emoji_mix_url("♈", "☕"), url("20260128", "u2615", "u2648"));
		assert_eq!(get_emoji_mix_url("🔥", "😃"), url("20201001", "u1f603", "u1f525"));
		assert_eq!(get_emoji_mix_url("2615", "2615"), url("20201001", "u2615", "u2615"));
	}

	#[test]
	fn mix_url_returns_none_for_unsupported_input_and_pairs() {
		for input in ["not an emoji", "abc", "deadbeef", "", "😀😀"] {
			assert_eq!(get_emoji_mix_url(input, "☕"), None);
		}

		assert_eq!(get_emoji_mix_url("☕", "🌳"), None);
	}

	#[test]
	fn to_unicode_accepts_exactly_one_supported_emoji() {
		assert_eq!(to_unicode("☕"), Some("2615"));
		assert_eq!(to_unicode("☕️"), Some("2615"));
		assert_eq!(to_unicode("❤"), Some("2764-fe0f"));
		assert_eq!(to_unicode("1F600"), Some("1f600"));
		assert_eq!(to_unicode("😮‍💨"), Some("1f62e-200d-1f4a8"));
		assert_eq!(to_unicode("❤️‍🩹"), Some("2764-fe0f-200d-1fa79"));

		for input in ["1f6", "2", "a", "☕ hello", "😀😀", ""] {
			assert_eq!(to_unicode(input), None);
		}
	}

	#[test]
	fn every_supported_emoji_resolves_to_itself() {
		for key in supported_emojis() {
			let emoji: String = key
				.split('-')
				.map(|part| char::from_u32(u32::from_str_radix(part, 16).unwrap()).unwrap())
				.collect();

			assert_eq!(to_unicode(&emoji), Some(key.as_str()));
			assert_eq!(to_unicode(&key.to_uppercase()), Some(key.as_str()));
			assert!(check_supported(key).is_some_and(|combos| !combos.is_empty()));
		}
	}

	#[test]
	fn get_emoji_combo_returns_the_newest_combo_in_googles_order() {
		assert_eq!(get_emoji_combo("2615", "2648"), Some(combo("2615", "2648", "20260128")));
		assert_eq!(get_emoji_combo("2648", "2615"), Some(combo("2615", "2648", "20260128")));
		assert_eq!(get_emoji_combo("2615", "2615"), Some(combo("2615", "2615", "20201001")));
		assert_eq!(get_emoji_combo("2615", "deadbeef"), None);
		assert_eq!(get_emoji_combo("$e", "2615"), None);
	}

	#[test]
	fn check_supported_lists_combos_containing_the_emoji() {
		let combos = check_supported("♈").unwrap();

		assert!(combos.contains(&combo("2615", "2648", "20260128")));
		assert!(combos.iter().all(|c| c.left_emoji == "2648" || c.right_emoji == "2648"));
		assert_eq!(check_supported("abc"), None);
	}

	#[test]
	fn url_part_formats_codepoints() {
		assert_eq!(
			google_request_url_emoji_part("1f642-200d-2194-FE0F"),
			"u1f642-u200d-u2194-ufe0f"
		);
	}
}
