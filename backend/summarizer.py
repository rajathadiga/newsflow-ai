import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

_client = None


def get_client():
    global _client
    if _client is None:
        _client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.environ.get("OPENROUTER_API_KEY", "missing-key"),
        )
    return _client


def summarize(title: str, content: str) -> dict:
    """Ask the model for a short summary and an importance rating (1-5).
    Falls back to a naive truncation if no API key is set or the call fails,
    so ingestion never breaks while we're still wiring up AI.
    """
    model = os.environ.get("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
    prompt = (
        "You are a news editor. Given the article title and text below, respond with "
        "ONLY valid JSON in this exact shape:\n"
        '{"summary": "one or two sentence plain-English summary", "importance": <int 1-5, '
        '5 = major world event, 1 = minor>}\n\n'
        f"Title: {title}\nText: {content[:2000]}"
    )
    try:
        resp = get_client().chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        raw = resp.choices[0].message.content.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(raw)
        return {
            "summary": str(data.get("summary", title))[:1000],
            "importance": max(1, min(5, int(data.get("importance", 3)))),
        }
    except Exception as e:
        print(f"[summarizer] falling back for '{title}': {e}")
        fallback = content[:300].strip() if content else title
        return {"summary": fallback, "importance": 3}
