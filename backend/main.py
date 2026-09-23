from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from geo import reverse_geocode
from ingest import ingest_all
from models import HistoryEntry, Story, StoryCluster
from news_search import is_configured, search_news
from scheduler import start_scheduler
from social import get_trending, search_social
from schemas import ClusterOut, HistoryIn, HistoryOut, StoryOut
from summarizer import (
    explain_story,
    extract_claims,
    refine_query,
    synthesize_briefing,
    synthesize_overview,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="newsflow_ai")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    start_scheduler()


@app.get("/")
def read_root():
    return {"status": "ok", "message": "newsflow_ai backend is running"}


@app.get("/api/stories", response_model=List[StoryOut])
def list_stories(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Story)
    if category:
        query = query.filter(Story.category == category)
    return query.order_by(desc(Story.published_at)).limit(50).all()


@app.get("/api/clusters", response_model=List[ClusterOut])
def list_clusters(db: Session = Depends(get_db)):
    clusters = (
        db.query(StoryCluster)
        .filter(StoryCluster.article_count >= 2)
        .order_by(desc(StoryCluster.article_count))
        .limit(10)
        .all()
    )
    return clusters


# Fewer than this many new stories since the last visit -> also show the day's top stories.
FOMO_MIN_NEW = 3


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    # SQLite hands datetimes back without tzinfo; they were stored as UTC.
    return dt.replace(tzinfo=timezone.utc) if dt and dt.tzinfo is None else dt


def _fomo_score(story: Story, cluster_sizes: dict[int, int], now: datetime) -> float:
    """AI importance, boosted when several outlets cover the same story and when it's fresh.

    The AI falls back to importance=3 whenever it's rate-limited, so on its own it can't
    separate stories; cluster size and recency break those ties.
    """
    score = float(story.importance)
    size = cluster_sizes.get(story.cluster_id, 1) if story.cluster_id else 1
    score += min(size - 1, 3) * 0.5  # up to +1.5 for wide coverage
    when = _as_utc(story.published_at) or _as_utc(story.created_at)
    age_hours = (now - when).total_seconds() / 3600 if when else 24
    score += max(0.0, 1 - age_hours / 24)  # up to +1 for brand-new stories
    return score


def _tier(score: float) -> str:
    if score >= 4.5:
        return "high"
    if score >= 3.5:
        return "medium"
    return "low"


@app.get("/api/fomo")
def fomo_shield(hours: float = 24, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    new_stories = db.query(Story).filter(Story.created_at >= now - timedelta(hours=hours)).all()

    stories = new_stories
    fallback = None
    if len(new_stories) < FOMO_MIN_NEW:
        # Little happened since the last visit — show the most important of the last day instead.
        stories = db.query(Story).filter(Story.created_at >= now - timedelta(hours=24)).all()
        fallback = "today"
        if not stories:
            # Ingestion hasn't run for a day; still show the latest stories we have.
            stories = db.query(Story).order_by(desc(Story.created_at)).limit(30).all()
            fallback = "latest"

    cluster_sizes = dict(db.query(StoryCluster.id, StoryCluster.source_count).all())
    scored = sorted(
        ((s, _fomo_score(s, cluster_sizes, now)) for s in stories),
        key=lambda pair: -pair[1],
    )
    tiers = [_tier(score) for _, score in scored]
    high, medium, low = (tiers.count(t) for t in ("high", "medium", "low"))

    return {
        "hours_away": hours,
        "new_since_visit": len(new_stories),
        "fallback": fallback,  # None | "today" | "latest"
        "total_found": len(stories),
        "high": high,
        "medium": medium,
        "low": low,
        "estimated_catchup_minutes": round(high * 2 + medium * 1 + low * 0.5),
        "top_stories": [StoryOut.model_validate(s) for s, _ in scored[:10]],
    }


@app.get("/api/search")
def search(q: str):
    q = q.strip()
    if not q:
        return {
            "query": q,
            "refined_query": q,
            "overview": None,
            "results": [],
            "configured": is_configured(),
        }

    refined = refine_query(q)
    results = search_news(refined)
    if not results and refined != q:
        results = search_news(q)

    overview = synthesize_overview(q, results)

    return {
        "query": q,
        "refined_query": refined,
        "overview": overview,
        "results": results,
        "configured": is_configured(),
    }



@app.get("/api/social/trending")
def social_trending():
    return get_trending()


@app.get("/api/social")
def social(q: str):
    q = q.strip()
    if not q:
        return {"query": q, "posts": [], "sources": {}}
    return search_social(q)


@app.get("/api/location")
def location(lat: float, lon: float):
    return {"place": reverse_geocode(lat, lon)}

@app.get("/api/explain")
def explain(title: str, summary: str = "", depth: str = "simple"):
    text = explain_story(title, summary, depth)
    return {"depth": depth, "explanation": text}


@app.get("/api/claims")
def claims(title: str, summary: str = ""):
    result = extract_claims(title, summary)
    return {"claims": result}


@app.get("/api/briefing")
def briefing(db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    stories = db.query(Story).filter(Story.created_at >= since).all()

    by_category: dict[str, list[dict]] = {}
    for s in stories:
        by_category.setdefault(s.category, []).append({"title": s.title})

    text = synthesize_briefing(by_category)
    return {"briefing": text, "story_count": len(stories)}


# Repeating the same search/opening the same story within this window just bumps its time.
HISTORY_DEDUPE_MINUTES = 10


@app.post("/api/history", response_model=HistoryOut)
def add_history(entry: HistoryIn, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    recent = (
        db.query(HistoryEntry)
        .filter(
            HistoryEntry.kind == entry.kind,
            HistoryEntry.title == entry.title,
            HistoryEntry.created_at >= now - timedelta(minutes=HISTORY_DEDUPE_MINUTES),
        )
        .first()
    )
    if recent:
        recent.created_at = now
        recent.source = entry.source
        row = recent
    else:
        row = HistoryEntry(**entry.model_dump(), created_at=now)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.get("/api/history", response_model=List[HistoryOut])
def list_history(kind: Optional[str] = None, limit: int = 200, db: Session = Depends(get_db)):
    query = db.query(HistoryEntry)
    if kind:
        query = query.filter(HistoryEntry.kind == kind)
    return query.order_by(desc(HistoryEntry.created_at)).limit(min(limit, 500)).all()


@app.delete("/api/history/{entry_id}")
def delete_history_entry(entry_id: int, db: Session = Depends(get_db)):
    deleted = db.query(HistoryEntry).filter(HistoryEntry.id == entry_id).delete()
    db.commit()
    return {"deleted": deleted}


@app.delete("/api/history")
def clear_history(db: Session = Depends(get_db)):
    deleted = db.query(HistoryEntry).delete()
    db.commit()
    return {"deleted": deleted}


@app.post("/api/ingest")
def trigger_ingest():
    added = ingest_all()
    return {"added": added}
