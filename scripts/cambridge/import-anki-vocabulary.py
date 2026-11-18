#!/usr/bin/env python3
"""Import the text fields from Cambridge IELTS AnkiWeb .apkg decks.

Usage: python scripts/cambridge/import-anki-vocabulary.py "D:/"

Only note text is written to the app seed. Embedded audio and image media are
intentionally omitted; source deck IDs and attribution are retained.
"""

from __future__ import annotations

import argparse
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sqlite3
import zipfile
from datetime import datetime, timezone


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "src/data/seed/vocab-cambridge/anki-decks.json"
AUTHOR = "Daniel (Đăng Ngô VN)"
SOURCE_URL = "https://ankiweb.net/shared/by-author/450912368"
DECK_IDS = {
    9: "603904745",
    10: "1067348591",
    11: "135650386",
    12: "1489543174",
    13: "855176509",
    14: "2056487172",
    15: "1109561363",
    16: "2124004847",
    17: "1287341757",
    18: "450912368",
    19: "371735441",
    20: "1125872886",
}


class PlainText(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"br", "p", "li", "div"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"p", "li", "div"}:
            self.parts.append("\n")


def plain_text(value: str) -> str:
    parser = PlainText()
    parser.feed(value or "")
    text = html.unescape("".join(parser.parts))
    return re.sub(r"[ \t\u00a0]+", " ", re.sub(r"\n\s*\n+", "\n", text)).strip()


def split_terms(value: str) -> list[str]:
    text = plain_text(value)
    if not text:
        return []
    return [item.strip() for item in re.split(r"[\n;,]+", text) if item.strip()]


def location_from_tags(tags: list[str], fields: dict[str, str], book_number: int) -> dict[str, int | str | None] | None:
    for tag in tags:
        reading = re.fullmatch(r"R(\d+)(?:\.(\d+))?", tag, re.IGNORECASE)
        if reading:
            return {
                "section": "Reading",
                "test": int(reading.group(1)),
                "passage": int(reading.group(2)) if reading.group(2) else None,
                "part": None,
            }
        reading_without_passage = re.fullmatch(r"R(\d+)\.", tag, re.IGNORECASE)
        if reading_without_passage:
            return {"section": "Reading", "test": int(reading_without_passage.group(1)), "passage": None, "part": None}
        listening = re.fullmatch(r"L(\d+)", tag, re.IGNORECASE)
        if listening:
            part = int(listening.group(1))
            # IELTS has four Listening parts; larger L-number tags identify a
            # source/list item but are not valid part numbers.
            return {"section": "Listening", "test": None, "passage": None, "part": part if 1 <= part <= 4 else None}

    # Some decks split the reading location into separate tags, such as `R` + `1.1`.
    if any(tag.casefold() == "r" for tag in tags):
        positions = [re.fullmatch(r"([1-4])\.([1-3])", tag) for tag in tags]
        positions = [position for position in positions if position]
        if len(positions) == 1:
            return {
                "section": "Reading",
                "test": int(positions[0].group(1)),
                "passage": int(positions[0].group(2)),
                "part": None,
            }
        # An `R` tag by itself still identifies the section, but not the test.
        return {"section": "Reading", "test": None, "passage": None, "part": None}

    # Cambridge 19 stores section and test in note fields instead of Anki tags.
    if book_number == 19:
        section = plain_text(fields.get("tag_4", "")).strip().title()
        test = re.fullmatch(r"Test\s+(\d+)", plain_text(fields.get("tag_3", "")).strip(), re.IGNORECASE)
        if section in {"Reading", "Listening"} and test:
            return {
                "section": section,
                "test": int(test.group(1)),
                "passage": None,
                "part": None,
            }
    return None


def source_location_tags(location: dict[str, int | str | None] | None) -> list[str]:
    if not location:
        return []
    if location["section"] == "Reading":
        test = location["test"]
        passage = location["passage"]
        if test and passage:
            return [f"R{test}.{passage}"]
        return [f"R{test}" if test else "R"]
    if location["section"] == "Listening":
        part = location["part"]
        test = location["test"]
        if part:
            return [f"L{part}"]
        return [f"Test {test}", "Listening"] if test else ["Listening"]
    return []


def read_deck(path: Path, book_number: int) -> dict:
    with zipfile.ZipFile(path) as archive:
        # Modern Anki exports keep the real collection in .anki21 and leave a
        # compatibility stub in .anki2. Prefer the real collection when both exist.
        db_name = next((name for name in ("collection.anki21", "collection.anki2") if name in archive.namelist()), None)
        if not db_name:
            raise ValueError(f"{path.name}: no supported Anki collection database found")
        connection = sqlite3.connect(":memory:")
        try:
            connection.deserialize(archive.read(db_name))
            models_json = connection.execute("SELECT models FROM col").fetchone()[0]
            models = json.loads(models_json)
            notes = []
            for guid, model_id, fields_blob, raw_tags in connection.execute("SELECT guid, mid, flds, tags FROM notes ORDER BY id"):
                model = models.get(str(model_id), {})
                field_names = [field.get("name", "") for field in model.get("flds", [])]
                values = fields_blob.split("\x1f")
                fields = {name: values[index] if index < len(values) else "" for index, name in enumerate(field_names)}
                word = re.sub(r"\s+", " ", plain_text(fields.get("word", ""))).strip()
                if not word:
                    continue

                tags = raw_tags.split()
                location = location_from_tags(tags, fields, book_number)
                example = plain_text(fields.get("example", ""))
                example = re.sub(r"^ex:\s*", "", example, flags=re.IGNORECASE)
                example_vi = plain_text(fields.get("example_translated", ""))
                example_vi = re.sub(r"^ví dụ:\s*", "", example_vi, flags=re.IGNORECASE)
                notes.append({
                    "id": str(guid),
                    "word": word,
                    "meaningVi": plain_text(fields.get("meaning", "")),
                    "definitionEn": plain_text(fields.get("explain", "")),
                    "pos": plain_text(fields.get("pos", "")),
                    "example": example,
                    "exampleVi": example_vi,
                    "forms": plain_text(fields.get("forms", "")),
                    "ipa": plain_text(fields.get("transliteration", "")),
                    "synonyms": split_terms(fields.get("synonym", "")),
                    "antonyms": split_terms(fields.get("antonym", "")),
                    "sourceTags": source_location_tags(location),
                    "section": location["section"] if location else None,
                    "test": location["test"] if location else None,
                    "passage": location["passage"] if location else None,
                    "part": location["part"] if location else None,
                    "markedDuplicate": "duplicate" in tags,
                })
        finally:
            connection.close()

    return {
        "n": book_number,
        "deckId": DECK_IDS[book_number],
        "deckTitle": f"IELTS VOCAB CAMBRIDGE {book_number:02d} IN VIETNAMESE",
        "sourceUrl": f"https://ankiweb.net/shared/info/{DECK_IDS[book_number]}",
        "noteCount": len(notes),
        "notes": notes,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_dir", type=Path, help="Folder containing IELTS_VOCAB_CAMBRIDGE_XX_IN_VIETNAMESE.apkg files")
    args = parser.parse_args()
    books = []
    for book_number in DECK_IDS:
        filename = f"IELTS_VOCAB_CAMBRIDGE_{book_number:02d}_IN_VIETNAMESE.apkg"
        path = args.input_dir / filename
        if path.exists():
            books.append(read_deck(path, book_number))

    if not books:
        raise SystemExit(f"No Cambridge Anki decks found in {args.input_dir}")

    coverage = [book["n"] for book in books]
    payload = {
        "schemaVersion": 1,
        "source": "AnkiWeb shared Cambridge IELTS vocabulary decks",
        "sourceUrl": SOURCE_URL,
        "sourceAuthor": AUTHOR,
        "sourceCredit": "© Đăng Ngô VN – All rights reserved. Attribution retained; user confirms separate permission for this app use.",
        "retrievedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "coverage": {"books": coverage, "missingBooks": [n for n in DECK_IDS if n not in coverage]},
        "noteCount": sum(book["noteCount"] for book in books),
        "books": books,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    temporary.replace(OUTPUT)
    print(json.dumps({"output": str(OUTPUT), "books": coverage, "missingBooks": payload["coverage"]["missingBooks"], "notes": payload["noteCount"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
