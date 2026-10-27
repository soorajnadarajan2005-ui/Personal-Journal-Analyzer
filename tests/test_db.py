import sqlite3

import src.db as db


def test_entry_count_creates_schema_when_missing(tmp_path, monkeypatch):
    db_path = tmp_path / "journal.db"
    monkeypatch.setattr(db, "DB_PATH", db_path)

    assert db.entry_count() == 0

    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='entries'"
        ).fetchone()

    assert row is not None
