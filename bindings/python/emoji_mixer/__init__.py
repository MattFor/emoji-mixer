import json
import re
from importlib.resources import files
from typing import NamedTuple

BASE_URL = "https://www.gstatic.com/android/keyboard/emojikitchen"

emoji_compatibility_data = json.loads(files(__name__).joinpath("compatibility.json").read_text("utf-8"))
supported_emojis = sorted(key for key in emoji_compatibility_data if not key.startswith("$"))


class EmojiCombo(NamedTuple):
	left_emoji: str
	right_emoji: str
	date: str


def _strip_fe0f(codepoints: str) -> str:
	return "-".join(part for part in codepoints.split("-") if part != "fe0f")


_supported = set(supported_emojis)
_by_stripped_key = {_strip_fe0f(key): key for key in supported_emojis}


def _combos_of(emoji: str) -> list[list[int]]:
	return emoji_compatibility_data[emoji] if emoji in _supported else []


def _emoji_at(index: int) -> str:
	emoji = emoji_compatibility_data["$e"][~index if index < 0 else index]
	return format(emoji, "x") if isinstance(emoji, int) else emoji


def _expand(anchor: str, entry: list[int]) -> EmojiCombo:
	index, date_index = entry
	other, date = _emoji_at(index), str(emoji_compatibility_data["$d"][date_index])
	return EmojiCombo(other, anchor, date) if index < 0 else EmojiCombo(anchor, other, date)


def to_unicode(value: str) -> str | None:
	if not isinstance(value, str):
		return None

	if re.fullmatch(r"[0-9a-f]+(-[0-9a-f]+)*", value, re.IGNORECASE):
		codepoints = value.lower()
	else:
		codepoints = "-".join(format(ord(char), "x") for char in value)

	return _by_stripped_key.get(_strip_fe0f(codepoints))


def check_supported(emoji: str) -> list[EmojiCombo] | None:
	key = to_unicode(emoji)
	return [_expand(key, entry) for entry in _combos_of(key)] if key else None


def get_expanded_emoji_compatibility_data() -> dict[str, list[EmojiCombo]]:
	return {emoji: check_supported(emoji) for emoji in supported_emojis}


def google_request_url_emoji_part(emoji: str) -> str:
	return "-".join(f"u{part.lower()}" for part in emoji.split("-"))


def google_request_url(combo: EmojiCombo) -> str:
	left = google_request_url_emoji_part(combo.left_emoji)
	return f"{BASE_URL}/{combo.date}/{left}/{left}_{google_request_url_emoji_part(combo.right_emoji)}.png"


def get_emoji_combo(left_emoji: str, right_emoji: str) -> EmojiCombo | None:
	matches = [
		_expand(anchor, entry)
		for anchor, other in ((left_emoji, right_emoji), (right_emoji, left_emoji))
		for entry in _combos_of(anchor)
		if _emoji_at(entry[0]) == other
	]
	return max(matches, key=lambda combo: combo.date, default=None)


def get_emoji_mix_url(left_emoji: str, right_emoji: str, detailed_errors: bool = False) -> str | None:
	left, right = to_unicode(left_emoji), to_unicode(right_emoji)
	combo = get_emoji_combo(left, right) if left and right else None

	if combo:
		return google_request_url(combo)

	if not detailed_errors:
		return None

	if not left:
		raise ValueError(f"'{left_emoji}' [left_emoji] is not a supported emoji.")

	if not right:
		raise ValueError(f"'{right_emoji}' [right_emoji] is not a supported emoji.")

	compatible = ", ".join(_emoji_at(index) for index, _ in _combos_of(right))
	raise ValueError(
		f"'{left}' is not compatible with '{right}'. Here are all emojis compatible with '{right}':\n[{compatible}]"
	)
