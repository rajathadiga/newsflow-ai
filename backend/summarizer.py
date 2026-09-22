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
    model = os.environ.get("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
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


_STOPWORDS = {
    "news", "about", "latest", "please", "show", "me", "find", "search",
    "for", "the", "a", "an", "in", "on", "at", "is", "are", "was", "were",
    "today", "recent", "update", "updates", "happening", "regarding",
    "related", "to", "of", "what", "whats", "what's", "give", "get", "tell",
    "any", "there", "i", "want", "need", "know", "with", "how", "who",
    "when", "where", "why", "can", "you", "my", "our", "this", "that",
    "these", "those", "it", "its", "going", "on",
}


def local_refine_query(text: str) -> str:
    """A non-AI fallback: strip common filler words, keep the rest as keywords.
    Used when the AI query-refinement call is unavailable (e.g. rate-limited),
    so search still gets a reasonable query instead of a full sentence.
    """
    words = text.strip().split()
    kept = [w for w in words if w.lower().strip(",.?!") not in _STOPWORDS]
    result = " ".join(kept).strip()
    return result if result else text.strip()


def refine_query(user_text: str) -> str:
    """Turn a natural-language search into a tighter keyword query for a news search API.
    e.g. "murder news in udupi" -> "murder Udupi". Falls back to the raw text if no API
    key is set or the call fails, so search never breaks.
    """
    model = os.environ.get("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
    prompt = (
        "Convert the user's natural-language news search into a short, effective keyword "
        "query for a news search API (like Google News search terms). Keep key entities "
        "(people, places, organizations, topics). Drop filler words like 'news', 'about', "
        "'latest'. Respond with ONLY the query text, nothing else.\n\n"
        f'User search: "{user_text}"'
    )
    try:
        resp = get_client().chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        refined = resp.choices[0].message.content.strip().strip('"')
        return refined if refined else user_text
    except Exception as e:
        print(f"[summarizer] query refinement failed for '{user_text}': {e}")
        return local_refine_query(user_text)


def synthesize_overview(query: str, articles: list[dict]) -> str | None:
    """Given search results, ask the model for a short 'here's what's going on' overview.
    Returns None if no API key is set or the call fails — the raw results still work fine
    without this, it's just a nice-to-have layer on top.
    """
    if not articles:
        return None

    model = os.environ.get("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
    headlines = "\n".join(
        f"- {a['title']}: {a.get('description') or ''}" for a in articles[:8]
    )
    prompt = (
        f'A user searched for "{query}". Based on these real, current headlines, '
        "write a 2-3 sentence plain-English overview of what's currently being reported. "
        "Do not invent facts beyond what's in the headlines. If the headlines don't clearly "
        "relate to the query, say so briefly instead of guessing.\n\n"
        f"{headlines}"
    )
    try:
        resp = get_client().chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[summarizer] overview failed for '{query}': {e}")
        return None


def synthesize_story(articles: list[dict]) -> str | None:
    """Given several articles clustered as the same event, ask the model to
    write a short multi-source synthesis: what happened, what's confirmed,
    what's still unclear. Returns None if the AI call fails — the cluster
    still displays fine with just its source list, this is a bonus layer.
    """
    if len(articles) < 2:
        return None

    model = os.environ.get("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
    listing = "\n".join(
        f"- [{a['source_name']}] {a['title']}: {a.get('summary') or ''}"
        for a in articles[:10]
    )
    prompt = (
        f"These {len(articles)} articles from different sources appear to be reporting "
        "on the same event. Write a short synthesis in this exact format:\n\n"
        "What happened: <1-2 sentences>\n"
        "Why it matters: <1 sentence>\n"
        "Still unclear: <1 sentence, or 'Nothing significant noted' if everything "
        "seems settled>\n\n"
        "Base this ONLY on the article snippets below — do not invent facts. If the "
        "articles turn out not to be about the same event, say so in 'What happened' "
        "instead of forcing a synthesis.\n\n"
        f"{listing}"
    )
    try:
        resp = get_client().chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[summarizer] story synthesis failed: {e}")
        return None


_DEPTH_PROMPTS = {
    "30sec": "Explain this in one plain sentence a busy person could read in 5 seconds.",
    "simple": "Explain this in 2-3 simple sentences, no jargon, like explaining to a friend.",
    "detailed": "Explain this in a short paragraph: background, what's happening now, and why it matters.",
    "technical": "Explain this with relevant technical/domain terminology and specific context a specialist would expect.",
}


def explain_story(title: str, summary: str, depth: str) -> str | None:
    """Re-explain a story at a requested depth level. Returns None on failure —
    the caller should fall back to just showing the existing summary.
    """
    instruction = _DEPTH_PROMPTS.get(depth, _DEPTH_PROMPTS["simple"])
    model = os.environ.get("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
    prompt = (
        f"{instruction}\n\nBase this only on the facts given below — do not add "
        f"information not present here.\n\nTitle: {title}\nSummary: {summary}"
    )
    try:
        resp = get_client().chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[summarizer] explain failed for '{title}' at depth {depth}: {e}")
        return None


def extract_claims(title: str, summary: str) -> list[dict] | None:
    """Break a story into discrete claims with a confidence label, so users can
    see what's solidly reported vs. still unverified. Returns None on failure.
    """
    model = os.environ.get("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
    prompt = (
        "List the distinct factual claims made in this article snippet. For each, "
        "label its confidence based ONLY on how the snippet itself presents it "
        "(not your own outside knowledge). Respond with ONLY a JSON array, no prose:\n"
        '[{"claim": "...", "confidence": "reported" | "claimed" | "unverified"}]\n\n'
        "- reported: stated as established fact by the source\n"
        "- claimed: attributed to a person/party's statement, not independently confirmed\n"
        "- unverified: speculative, analysis, or explicitly uncertain in the text\n\n"
        f"Title: {title}\nText: {summary[:1500]}"
    )
    try:
        resp = get_client().chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        raw = resp.choices[0].message.content.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        claims = json.loads(raw)
        return claims if isinstance(claims, list) else None
    except Exception as e:
        print(f"[summarizer] claim extraction failed for '{title}': {e}")
        return None


def synthesize_briefing(stories_by_category: dict[str, list[dict]]) -> str | None:
    """Generate a short personal briefing across all categories. Returns None
    on failure — the caller should just show the regular feed instead.
    """
    if not stories_by_category:
        return None

    model = os.environ.get("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
    sections = []
    for category, stories in stories_by_category.items():
        headlines = "\n".join(f"  - {s['title']}" for s in stories[:6])
        sections.append(f"{category}:\n{headlines}")
    listing = "\n\n".join(sections)

    prompt = (
        "Write a short personal news briefing (5 minutes to read) organized by the "
        "categories below. For each category, pick only the 1-3 most significant "
        "headlines and give one sentence on why each matters. Skip categories with "
        "nothing significant. Base this ONLY on the headlines given — do not invent "
        "details beyond the headline text. Keep it concise and scannable, use the "
        "category names as headers.\n\n"
        f"{listing}"
    )
    try:
        resp = get_client().chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[summarizer] briefing synthesis failed: {e}")
        return None
