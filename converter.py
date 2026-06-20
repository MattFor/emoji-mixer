#!/usr/bin/env python3

"""
Emoji Mix URL Generator Version 1.3.1

Created by MattFor (Discord: MattFor#9884 (currently: mattfor)).
Contact: mattfor@relaxy.xyz
Licensed under the MIT Licence.

This utility downloads the latest Emoji Kitchen metadata from
https://emojikitchen.dev/metadata.json and converts it into a compact
compatibility database suitable for use by Emoji Mix URL Generator and
other Emoji Kitchen tooling.

The generated output is written to `compatibility.json`.

The converter performs the following steps:

1. Downloads the latest metadata file from EmojiKitchen.dev.
2. Streams or loads the metadata depending on whether `ijson` is available.
3. Extracts only the information required for compatibility lookups:
   - leftEmoji
   - rightEmoji
   - date
4. Discards all other metadata to reduce file size.
5. Writes the resulting structure to `compatibility.json`.
6. Removes temporary downloaded files.

The resulting JSON structure has the following format:

{
    "2615": [
        {
            "leftEmoji": "2615",
            "rightEmoji": "2615",
            "date": "20201001"
        },
        {
            "leftEmoji": "2753",
            "rightEmoji": "2615",
            "date": "20250130"
        }
    ]
}

Dependencies:

- Python 3.8+
- Optional but recommended: ijson

When `ijson` is installed, the metadata is processed using a streaming
parser which significantly reduces memory usage and increases conversion speed.

Functions:

download_metadata()
    Downloads the latest Emoji Kitchen metadata and returns the path to
    a temporary file.

normalize_codepoint()
    Converts emoji codepoints to a normalized lowercase string.

iter_data_items()
    Iterates through entries in the metadata's top-level `data` object.

write_output()
    Converts metadata into the compact compatibility format and writes
    the resulting JSON.

main()
    Coordinates downloading, conversion, clean-up, and output generation.
"""

import os
import sys
import json
import tempfile
import urllib.request

from typing import Dict, Iterable, Tuple, TextIO, Any

try:
	import ijson
except ImportError:
	ijson = None

OUTPUT_FILE = "compatibility.json"
SOURCE_URL = "https://emojikitchen.dev/metadata.json"


def download_metadata() -> str:
	print(f"Downloading {SOURCE_URL}...", file=sys.stderr)

	tmp = tempfile.NamedTemporaryFile(
		prefix="emojikitchen_",
		suffix=".json",
		delete=False,
	)

	try:
		with urllib.request.urlopen(SOURCE_URL) as response:
			total = response.headers.get("Content-Length")
			total = int(total) if total else None

			downloaded = 0
			while True:
				chunk = response.read(1024 * 1024)
				if not chunk:
					break

				tmp.write(chunk)
				downloaded += len(chunk)

				if total:
					percent = downloaded * 100 / total
					print(
						f"\rDownloaded {downloaded:,}/{total:,} bytes ({percent:.3f}%)",
						end="",
						file=sys.stderr,
					)
	finally:
		tmp.close()

	if total:
		print(file=sys.stderr)
	print("Download complete.", file=sys.stderr)

	return tmp.name


def normalize_codepoint(value: Any, fallback: str = "") -> str:
	if value is None:
		return fallback
	return str(value).lower()


def iter_data_items(path: str) -> Iterable[Tuple[str, Dict[str, Any]]]:
	"""
	Yields (outer_codepoint, emoji_data) from top-level JSON.data.
	Uses ijson if available; falls back to full load if not.
	"""
	if ijson is None:
		with open(path, "r", encoding="utf-8") as f:
			root = json.load(f)
		data = root.get("data", {})
		if not isinstance(data, dict):
			raise TypeError("Expected top-level 'data' to be an object.")
		yield from data.items()
		return

	with open(path, "rb") as f:
		yield from ijson.kvitems(f, "data")


def encode_emoji(emoji: str):
	if "-" in emoji:
		return emoji

	try:
		return int(emoji, 16)
	except ValueError:
		return emoji


def write_output(input_path: str, output: TextIO, progress_every: int = 10) -> None:
	output.write("{\n")

	first_outer = True
	outer_count = 0
	combo_count = 0

	for outer_codepoint, emoji_data in iter_data_items(input_path):
		outer_count += 1

		combinations = {}
		if isinstance(emoji_data, dict):
			combinations = emoji_data.get("combinations", {}) or {}

		if not isinstance(combinations, dict):
			combinations = {}

		entries = []

		for combo_key, combo_list in combinations.items():
			if not isinstance(combo_list, list):
				continue

			for combo in combo_list:
				if not isinstance(combo, dict):
					continue

				entries.append({
					"leftEmoji": normalize_codepoint(
						combo.get("leftEmojiCodepoint"),
						fallback=str(outer_codepoint),
					),
					"rightEmoji": normalize_codepoint(
						combo.get("rightEmojiCodepoint"),
						fallback=str(combo_key),
					),
					"date": "" if combo.get("date") is None else str(combo.get("date")),
				})

		if not first_outer:
			output.write(",\n")
		first_outer = False

		output.write(json.dumps(outer_codepoint))
		output.write(": ")
		json.dump(entries, output, ensure_ascii=False)

		combo_count += len(entries)

		if progress_every and outer_count % progress_every == 0:
			print(
				f"Processed {outer_count} emoji groups, {combo_count} combinations",
				file=sys.stderr,
			)

	output.write("\n}\n")

	print(
		f"Done. Processed {outer_count} emoji groups, {combo_count} combinations.",
		file=sys.stderr,
	)


def write_output_compressed(input_path: str, output: TextIO, progress_every: int = 10) -> None:
	output.write("{")

	first_outer = True
	outer_count = 0
	combo_count = 0

	for outer_codepoint, emoji_data in iter_data_items(input_path):
		outer_count += 1

		combinations = {}
		if isinstance(emoji_data, dict):
			combinations = emoji_data.get("combinations", {}) or {}

		if not isinstance(combinations, dict):
			combinations = {}

		entries = []

		for combo_key, combo_list in combinations.items():
			if not isinstance(combo_list, list):
				continue

			for combo in combo_list:
				if not isinstance(combo, dict):
					continue

				right_emoji = normalize_codepoint(
					combo.get("rightEmojiCodepoint"),
					fallback=str(combo_key),
				)

				date = combo.get("date")

				try:
					date = int(date)
				except (TypeError, ValueError):
					date = 0

				entries.append([
					right_emoji,
					date,
				])

		if not first_outer:
			output.write(",")

		first_outer = False

		output.write(json.dumps(outer_codepoint))
		output.write(":")

		json.dump(
			entries,
			output,
			ensure_ascii=False,
			separators=(",", ":"),
		)

		combo_count += len(entries)

		if progress_every and outer_count % progress_every == 0:
			print(
				f"Processed {outer_count} emoji groups, {combo_count} combinations",
				file=sys.stderr,
			)

	output.write("}")

	print(
		f"Done. Processed {outer_count} emoji groups, {combo_count} combinations.",
		file=sys.stderr,
	)


def write_output_compressed_v2(input_path: str, output: TextIO, progress_every: int = 10) -> None:
	all_data = {}
	date_to_index = {}
	dates = []

	outer_count = 0
	combo_count = 0

	for outer_codepoint, emoji_data in iter_data_items(input_path):
		outer_count += 1

		combinations = {}
		if isinstance(emoji_data, dict):
			combinations = emoji_data.get("combinations", {}) or {}

		if not isinstance(combinations, dict):
			combinations = {}

		entries = []

		for combo_key, combo_list in combinations.items():
			if not isinstance(combo_list, list):
				continue

			for combo in combo_list:
				if not isinstance(combo, dict):
					continue

				right_emoji = normalize_codepoint(
					combo.get("rightEmojiCodepoint"),
					fallback=str(combo_key),
				)

				try:
					date = int(combo.get("date"))
				except (TypeError, ValueError):
					date = 0

				date_index = date_to_index.get(date)

				if date_index is None:
					date_index = len(dates)
					date_to_index[date] = date_index
					dates.append(date)

				entries.append([
					right_emoji,
					date_index,
				])

		all_data[outer_codepoint] = entries

		combo_count += len(entries)

		if progress_every and outer_count % progress_every == 0:
			print(
				f"Processed {outer_count} emoji groups, {combo_count} combinations",
				file=sys.stderr,
			)

	result = {
		"_d": dates,
		**all_data,
	}

	json.dump(
		result,
		output,
		ensure_ascii=False,
		separators=(",", ":"),
	)

	print(
		f"Done. Processed {outer_count} emoji groups, "
		f"{combo_count} combinations, "
		f"{len(dates)} unique dates.",
		file=sys.stderr,
	)


def write_output_compressed_v3(input_path: str, output: TextIO, progress_every: int = 10) -> None:
	all_data = {}

	date_to_index = {}
	dates = []

	emoji_to_index = {}
	emojis = []

	outer_count = 0
	combo_count = 0

	def get_date_index(date: int) -> int:
		idx = date_to_index.get(date)

		if idx is None:
			idx = len(dates)
			date_to_index[date] = idx
			dates.append(date)

		return idx

	def get_emoji_index(emoji: str) -> int:
		idx = emoji_to_index.get(emoji)

		if idx is None:
			idx = len(emojis)
			emoji_to_index[emoji] = idx
			emojis.append(encode_emoji(emoji))

		return idx

	for outer_codepoint, emoji_data in iter_data_items(input_path):
		outer_count += 1

		combinations = {}
		if isinstance(emoji_data, dict):
			combinations = emoji_data.get("combinations", {}) or {}

		if not isinstance(combinations, dict):
			combinations = {}

		entries = []

		for combo_key, combo_list in combinations.items():
			if not isinstance(combo_list, list):
				continue

			for combo in combo_list:
				if not isinstance(combo, dict):
					continue

				left = normalize_codepoint(
					combo.get("leftEmojiCodepoint"),
					fallback=str(outer_codepoint),
				)

				right = normalize_codepoint(
					combo.get("rightEmojiCodepoint"),
					fallback=str(combo_key),
				)

				try:
					date = int(combo.get("date"))
				except (TypeError, ValueError):
					date = 0

				# Store only the emoji that is NOT the anchor.
				if left == outer_codepoint:
					other = right
				elif right == outer_codepoint:
					other = left
				else:
					# Fallback for weird future metadata.
					other = right

				emoji_index = get_emoji_index(other)
				date_index = get_date_index(date)

				entries.append([
					emoji_index,
					date_index,
				])

		all_data[outer_codepoint] = entries

		combo_count += len(entries)

		if progress_every and outer_count % progress_every == 0:
			print(
				f"Processed {outer_count} emoji groups, "
				f"{combo_count} combinations",
				file=sys.stderr,
			)

	result = {
		"$d": dates,
		"$e": emojis,
		**all_data,
	}

	json.dump(
		result,
		output,
		ensure_ascii=False,
		separators=(",", ":"),
	)

	print(
		f"Done. Processed {outer_count} emoji groups, "
		f"{combo_count} combinations, "
		f"{len(dates)} unique dates, "
		f"{len(emojis)} unique emojis.",
		file=sys.stderr,
	)


def main() -> int:
	metadata_path = download_metadata()

	try:
		with open(OUTPUT_FILE, "w", encoding="utf-8", newline="\n") as out:
			# write_output(metadata_path, out, progress_every=10)
			write_output_compressed_v3(metadata_path, out, progress_every=10)
	finally:
		try:
			os.unlink(metadata_path)
		except OSError:
			pass

	print(f"Wrote {OUTPUT_FILE}", file=sys.stderr)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
