"""Social Pulse: fetch real public posts about a topic from Reddit, Mastodon and Hacker News.

Every source is converted into the same "post" shape so the frontend can render one mixed feed:
    {id, platform, author, author_url, avatar, community, title, text, url, image,
     published_at, likes, comments, shares}
"""

import html
import re
import time
from concurrent.futures import ThreadPoolExecutor
from itertools import zip_longest
from datetime import datetime, timezone

import feedparser
import requests

# Reddit rejects requests without a descriptive User-Agent.
HEADERS = {"User-Agent": "windows:newsflow-ai:v0.1 (learning project)"}
TIMEOUT = 8

# query -> (fetched_at, posts). Reddit rate-limits hard, so identical searches
# within CACHE_SECONDS are served from memory instead of hitting the APIs again.
CACHE_SECONDS = 300
_cache: dict[str, tuple[float, dict]] = {}

TAG_RE = re.compile(r"<[^>]+>")
IMG_RE = re.compile(r'<img[^>]+src="([^"]+)"')


BLOCK_RE = re.compile(r"<(br|/p|/div|/li)\s*/?>", re.I)


def _strip_html(raw: str) -> str:
    # Block tags become line breaks; inline tags (e.g. <span> inside "#<span>tag</span>")
    # are removed without adding a space.
    text = BLOCK_RE.sub("\n", raw or "")
    text = html.unescape(TAG_RE.sub("", text))
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\s*\n\s*", "\n", text).strip()


def _to_iso(struct_time) -> str | None:
    if not struct_time:
        return None
    # "Z" suffix (not "+00:00") — the frontend's timeAgo() expects that form.
    return datetime(*struct_time[:6], tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# --- Converters: one raw item from a platform -> our shared post shape ---------------


def _reddit_posts(rss_text: str) -> list[dict]:
    posts = []
    for e in feedparser.parse(rss_text).entries:
        link = e.get("link", "")
        if "/comments/" not in link:  # skip subreddit / user results
            continue
        body_html = e.get("content", [{}])[0].get("value", "") or e.get("summary", "")
        thumbs = e.get("media_thumbnail") or []
        image = thumbs[0].get("url") if thumbs else None
        if not image:
            match = IMG_RE.search(body_html)
            image = html.unescape(match.group(1)) if match else None

        text = _strip_html(body_html)
        # Reddit appends "submitted by /u/x [link] [comments]" to every entry — drop it.
        text = re.split(r"\s*submitted by\s+/u/", text)[0].strip()

        author = (e.get("author") or "").replace("/u/", "")
        subreddit = e.get("tags", [{}])[0].get("term") if e.get("tags") else None
        posts.append(
            {
                "id": f"reddit-{e.get('id', link)}",
                "platform": "reddit",
                "author": author or "unknown",
                "author_url": f"https://www.reddit.com/user/{author}" if author else None,
                "avatar": None,
                "community": f"r/{subreddit}" if subreddit else None,
                "title": e.get("title"),
                "text": text[:500] or None,
                "url": link,
                "image": image,
                "published_at": _to_iso(e.get("published_parsed") or e.get("updated_parsed")),
                "likes": None,
                "comments": None,
                "shares": None,
            }
        )
    return posts


def _mastodon_post(s: dict) -> dict | None:
    # Mastodon is global; keep English to match the rest of the app.
    if s.get("sensitive") or s.get("language") not in ("en", None):
        return None
    account = s.get("account", {})
    image = next(
        (
            m.get("preview_url")
            for m in s.get("media_attachments", [])
            if m.get("type") in ("image", "gifv", "video")
        ),
        None,
    )
    return {
        "id": f"mastodon-{s['id']}",
        "platform": "mastodon",
        "author": account.get("display_name") or account.get("username") or "unknown",
        "author_url": account.get("url"),
        "avatar": account.get("avatar"),
        "community": f"@{account.get('acct')}" if account.get("acct") else None,
        "title": None,
        "text": _strip_html(s.get("content", ""))[:500] or None,
        "url": s.get("url") or s.get("uri"),
        "image": image,
        "published_at": s.get("created_at"),
        "likes": s.get("favourites_count"),
        "comments": s.get("replies_count"),
        "shares": s.get("reblogs_count"),
    }


def _hn_post(h: dict) -> dict:
    return {
        "id": f"hn-{h['objectID']}",
        "platform": "hackernews",
        "author": h.get("author") or "unknown",
        "author_url": f"https://news.ycombinator.com/user?id={h.get('author')}",
        "avatar": None,
        "community": "Hacker News",
        "title": h.get("title"),
        "text": _strip_html(h.get("story_text") or "")[:500] or None,
        "url": f"https://news.ycombinator.com/item?id={h['objectID']}",
        "image": None,
        "published_at": h.get("created_at"),
        "likes": h.get("points"),
        "comments": h.get("num_comments"),
        "shares": None,
    }


def _get(url: str, **params) -> requests.Response:
    resp = requests.get(url, params=params, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp


# --- Search: posts about a topic -------------------------------------------------------


def fetch_reddit(query: str, limit: int = 15) -> list[dict]:
    # The JSON API now requires OAuth, but the public search RSS feed still works.
    resp = _get(
        "https://www.reddit.com/search.rss",
        q=query, sort="relevance", t="month", type="link", limit=limit,
    )
    return _reddit_posts(resp.text)


def fetch_mastodon(query: str, limit: int = 20) -> list[dict]:
    # Unauthenticated full-text search isn't allowed, but hashtag timelines are public.
    # "Karnataka rains" -> #karnatakarains plus the individual meaningful words.
    words = [w for w in re.findall(r"[a-zA-Z0-9]+", query.lower()) if len(w) > 3]
    tags = list(dict.fromkeys(["".join(words)] + words[:3])) if words else []

    posts: dict[str, dict] = {}
    for tag in tags:
        try:
            statuses = _get(f"https://mastodon.social/api/v1/timelines/tag/{tag}", limit=limit).json()
        except requests.HTTPError:
            continue
        for s in statuses:
            post = _mastodon_post(s)
            if post:
                posts[post["id"]] = post
    # Several tags can return lots of posts; keep the newest so Mastodon doesn't drown out other sources.
    newest = sorted(posts.values(), key=lambda p: p["published_at"] or "", reverse=True)
    return newest[:limit]


def fetch_hackernews(query: str, limit: int = 15) -> list[dict]:
    resp = _get("https://hn.algolia.com/api/v1/search", query=query, tags="story", hitsPerPage=limit)
    return [_hn_post(h) for h in resp.json().get("hits", [])]


# --- Trending: what's hot right now, no query needed ------------------------------------


def trending_reddit() -> list[dict]:
    # r/popular filtered to India — Reddit's own "hot right now" ranking.
    return _reddit_posts(_get("https://www.reddit.com/r/popular/.rss", geo_filter="IN").text)


def trending_mastodon() -> list[dict]:
    statuses = _get("https://mastodon.social/api/v1/trends/statuses", limit=20).json()
    return [p for p in map(_mastodon_post, statuses) if p]


def trending_hackernews() -> list[dict]:
    resp = _get("https://hn.algolia.com/api/v1/search", tags="front_page", hitsPerPage=15)
    return [_hn_post(h) for h in resp.json().get("hits", [])]


def trending_tags() -> list[str]:
    tags = _get("https://mastodon.social/api/v1/trends/tags", limit=10).json()
    return [t["name"] for t in tags]


# --- Running the sources ---------------------------------------------------------------


def _run_sources(sources: dict, *args) -> tuple[dict[str, list[dict]], dict[str, str]]:
    """Call every source in parallel. A failing source is reported in `status`, not fatal."""
    found: dict[str, list[dict]] = {}
    status: dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=len(sources)) as pool:
        futures = {name: pool.submit(fn, *args) for name, fn in sources.items()}
        for name, future in futures.items():
            try:
                found[name] = future.result()
                status[name] = "ok" if found[name] else "empty"
            except requests.HTTPError as e:
                code = e.response.status_code if e.response is not None else None
                status[name] = "rate_limited" if code == 429 else "error"
                print(f"[social] {name} failed: {e}")
            except Exception as e:
                status[name] = "error"
                print(f"[social] {name} failed: {e}")
    return found, status


SEARCH_SOURCES = {
    "reddit": fetch_reddit,
    "mastodon": fetch_mastodon,
    "hackernews": fetch_hackernews,
}

TRENDING_SOURCES = {
    "reddit": trending_reddit,
    "mastodon": trending_mastodon,
    "hackernews": trending_hackernews,
}


def search_social(query: str) -> dict:
    key = query.strip().lower()
    cached = _cache.get(key)
    if cached and time.time() - cached[0] < CACHE_SECONDS:
        return cached[1]

    found, status = _run_sources(SEARCH_SOURCES, query)
    posts = [p for items in found.values() for p in items]
    posts.sort(key=lambda p: p["published_at"] or "", reverse=True)
    result = {"query": query, "posts": posts, "sources": status}

    # Don't cache a result where Reddit was rate-limited — retry it next time.
    if status.get("reddit") != "rate_limited":
        _cache[key] = (time.time(), result)
    return result


# Shared by every visitor, so each source sees at most one trending request per CACHE_SECONDS.
_trending_cache: tuple[float, dict] | None = None
# Last good posts per source, reused when a source fails on a later refresh.
_trending_last_good: dict[str, list[dict]] = {}


def get_trending() -> dict:
    global _trending_cache
    if _trending_cache and time.time() - _trending_cache[0] < CACHE_SECONDS:
        return _trending_cache[1]

    found, status = _run_sources(TRENDING_SOURCES)
    for name in TRENDING_SOURCES:
        if found.get(name):
            _trending_last_good[name] = found[name]
        elif name in _trending_last_good:
            # e.g. Reddit rate-limited this time — show its previous posts instead of none.
            found[name] = _trending_last_good[name]

    try:
        tags = trending_tags()
    except Exception as e:
        print(f"[social] trending tags failed: {e}")
        tags = []

    # Each source is already ranked by popularity, so interleave them
    # (#1 Reddit, #1 Mastodon, #1 HN, #2 Reddit, ...) instead of sorting by time.
    lists = [found.get(name, []) for name in TRENDING_SOURCES]
    posts = [p for row in zip_longest(*lists) for p in row if p]

    result = {
        "posts": posts,
        "tags": tags,
        "sources": status,
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    _trending_cache = (time.time(), result)
    return result
