"""
Reads journal entries from data/entries/ and loads them into the database.

Expected file format: data/entries/YYYY-MM-DD.md, plain text/markdown content.
Only new or changed files trigger re-embedding downstream (see embed.py).

If your journal lives somewhere else (Day One export, Notion, a spreadsheet),
this is the file to adapt — everything downstream just expects
(date, filename, raw_text) tuples, however you produce them.
"""
import hashlib
import re
from src.config import ENTRIES_DIR
from src.db import init_db, upsert_entry

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}")


def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def parse_date_from_filename(filename: str) -> str:
    match = DATE_RE.match(filename)
    if not match:
        raise ValueError(
            f"Could not find a YYYY-MM-DD date at the start of filename: {filename}"
        )
    return match.group(0)


def ingest_all() -> dict:
    """Scan ENTRIES_DIR and load/update every .md file. Returns a summary dict."""
    init_db()

    if not ENTRIES_DIR.exists():
        raise FileNotFoundError(f"Entries directory not found: {ENTRIES_DIR}")

    files = sorted(ENTRIES_DIR.glob("*.md"))
    if not files:
        print(f"No .md files found in {ENTRIES_DIR}")
        return {"new_or_changed": [], "unchanged": 0, "total": 0}

    new_or_changed = []
    unchanged = 0

    for path in files:
        raw_text = path.read_text(encoding="utf-8").strip()
        if not raw_text:
            continue

        date = parse_date_from_filename(path.name)
        content_hash = hash_text(raw_text)
        entry_id, changed = upsert_entry(date, path.name, raw_text, content_hash)

        if changed:
            new_or_changed.append(entry_id)
        else:
            unchanged += 1

    summary = {"new_or_changed": new_or_changed, "unchanged": unchanged, "total": len(files)}
    print(
        f"Ingested {summary['total']} files: "
        f"{len(new_or_changed)} new/changed, {unchanged} unchanged."
    )
    return summary


if __name__ == "__main__":
    ingest_all()
