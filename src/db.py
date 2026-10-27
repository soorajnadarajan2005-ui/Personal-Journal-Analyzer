"""
SQLite schema + small helper functions.
Everything else in the project talks to the DB through these functions
rather than writing raw SQL inline.
"""
import sqlite3
import numpy as np
from src.config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    filename TEXT UNIQUE NOT NULL,
    raw_text TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    mood TEXT,
    topics TEXT
);

CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding BLOB NOT NULL
);
"""


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def upsert_entry(date: str, filename: str, raw_text: str, content_hash: str) -> tuple[int, bool]:
    """
    Insert an entry, or update it if the filename already exists but content changed.
    Returns (entry_id, changed) where changed=True means chunks need to be re-embedded.
    """
    conn = get_connection()
    cur = conn.execute("SELECT id, content_hash FROM entries WHERE filename = ?", (filename,))
    row = cur.fetchone()

    if row is None:
        cur = conn.execute(
            "INSERT INTO entries (date, filename, raw_text, content_hash) VALUES (?, ?, ?, ?)",
            (date, filename, raw_text, content_hash),
        )
        conn.commit()
        entry_id = cur.lastrowid
        conn.close()
        return entry_id, True

    entry_id = row["id"]
    changed = row["content_hash"] != content_hash
    if changed:
        conn.execute(
            "UPDATE entries SET raw_text = ?, content_hash = ?, date = ? WHERE id = ?",
            (raw_text, content_hash, date, entry_id),
        )
        conn.execute("DELETE FROM chunks WHERE entry_id = ?", (entry_id,))
        conn.commit()
    conn.close()
    return entry_id, changed


def insert_chunk(entry_id: int, chunk_text: str, embedding: np.ndarray):
    conn = get_connection()
    conn.execute(
        "INSERT INTO chunks (entry_id, chunk_text, embedding) VALUES (?, ?, ?)",
        (entry_id, chunk_text, embedding.astype(np.float32).tobytes()),
    )
    conn.commit()
    conn.close()


def get_all_chunks():
    """Returns list of dicts: id, entry_id, chunk_text, embedding (np.ndarray), date, filename."""
    init_db()
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT chunks.id, chunks.entry_id, chunks.chunk_text, chunks.embedding,
               entries.date, entries.filename
        FROM chunks
        JOIN entries ON entries.id = chunks.entry_id
        """
    ).fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "chunk_id": r["id"],
            "entry_id": r["entry_id"],
            "chunk_text": r["chunk_text"],
            "embedding": np.frombuffer(r["embedding"], dtype=np.float32),
            "date": r["date"],
            "filename": r["filename"],
        })
    return results


def update_entry_tags(entry_id: int, mood: str, topics: str):
    conn = get_connection()
    conn.execute("UPDATE entries SET mood = ?, topics = ? WHERE id = ?", (mood, topics, entry_id))
    conn.commit()
    conn.close()


def get_all_entries():
    init_db()
    conn = get_connection()
    rows = conn.execute("SELECT * FROM entries ORDER BY date").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def entry_count() -> int:
    init_db()
    conn = get_connection()
    count = conn.execute("SELECT COUNT(*) AS c FROM entries").fetchone()["c"]
    conn.close()
    return count
