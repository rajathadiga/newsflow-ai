import os

import requests
from dotenv import load_dotenv

load_dotenv()

EVENTREGISTRY_URL = "https://eventregistry.org/api/v1/article/getArticles"


def is_configured() -> bool:
    return bool(os.environ.get("NEWSAPI_KEY"))


def search_news(query: str, page_size: int = 15) -> list[dict]:
    """Search live web news via Event Registry. Returns [] if no key is set or the call fails."""
    api_key = os.environ.get("NEWSAPI_KEY")
    if not api_key:
        return []

    try:
        resp = requests.get(
            EVENTREGISTRY_URL,
            params={
                "keyword": query,
                "apiKey": api_key,
                "resultType": "articles",
                "articlesSortBy": "date",
                "articlesCount": page_size,
                "lang": "eng",
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        print(f"[news_search] request failed for '{query}': {e}")
        return []

    articles = []
    for item in data.get("articles", {}).get("results", []):
        if not item.get("title"):
            continue
        body = item.get("body") or ""
        articles.append(
            {
                "title": item["title"],
                "description": (body[:220].strip() + "…") if body else None,
                "url": item.get("url"),
                "source_name": (item.get("source") or {}).get("title", "Unknown"),
                "published_at": item.get("dateTimePub") or item.get("dateTime"),
            }
        )
    return articles
