"""
Optional: auto-tags each entry with a mood word and a few topics using Claude.
Run standalone after ingesting: python -m src.tag
"""
import json
from anthropic import Anthropic
from src.config import ANTHROPIC_API_KEY, ANSWER_MODEL
from src.db import get_all_entries, update_entry_tags

TAG_PROMPT = """Read this journal entry and respond with ONLY a JSON object, no other text:
{{"mood": "<one word describing the overall emotional tone>", "topics": "<comma-separated list of 2-4 short topics mentioned>"}}

Entry:
{entry_text}"""


def tag_entry(client: Anthropic, entry_text: str) -> dict:
    response = client.messages.create(
        model=ANSWER_MODEL,
        max_tokens=200,
        messages=[{"role": "user", "content": TAG_PROMPT.format(entry_text=entry_text)}],
    )
    raw = "".join(b.text for b in response.content if b.type == "text").strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"mood": "unknown", "topics": ""}


def tag_all_entries():
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    entries = get_all_entries()
    untagged = [e for e in entries if not e.get("mood")]

    if not untagged:
        print("All entries already tagged.")
        return

    for entry in untagged:
        tags = tag_entry(client, entry["raw_text"])
        update_entry_tags(entry["id"], tags.get("mood", ""), tags.get("topics", ""))
        print(f"{entry['date']}: mood={tags.get('mood')}, topics={tags.get('topics')}")

    print(f"Tagged {len(untagged)} entries.")


if __name__ == "__main__":
    tag_all_entries()
