"""
Command-line entry point.

Usage:
    python cli.py ingest              # scan data/entries/, load new/changed entries, embed them
    python cli.py ask "question"      # ask a question grounded in your journal
    python cli.py tag                 # auto-tag mood/topics for entries that don't have them
    python cli.py stats               # quick summary of what's loaded
"""
import sys
from src.ingest import ingest_all
from src.embed import embed_new_entries
from src.ask import ask
from src.db import entry_count


def cmd_ingest():
    summary = ingest_all()
    embed_new_entries(summary["new_or_changed"])


def cmd_ask(question: str):
    if not question.strip():
        print('Usage: python cli.py ask "your question here"')
        return
    result = ask(question)
    print(f"\nQ: {result['question']}\n")
    print(result["answer"])
    sources = ", ".join(s["date"] for s in result["sources"])
    print(f"\nSources: {sources or 'none'}")


def cmd_tag():
    from src.tag import tag_all_entries
    tag_all_entries()


def cmd_stats():
    print(f"Entries loaded: {entry_count()}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    command = sys.argv[1]
    rest = " ".join(sys.argv[2:])

    if command == "ingest":
        cmd_ingest()
    elif command == "ask":
        cmd_ask(rest)
    elif command == "tag":
        cmd_tag()
    elif command == "stats":
        cmd_stats()
    else:
        print(f"Unknown command: {command}\n")
        print(__doc__)


if __name__ == "__main__":
    main()
