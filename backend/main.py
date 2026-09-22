from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from ingest import ingest_all
from models import Story
from news_search import search_news
from scheduler import start_scheduler
from schemas import StoryOut
from summarizer import refine_query, synthesize_overview

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


@app.get("/api/fomo")
def fomo_shield(hours: int = 24, db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    stories = db.query(Story).filter(Story.created_at >= since).all()

    high = [s for s in stories if s.importance >= 4]
    medium = [s for s in stories if s.importance == 3]
    low = [s for s in stories if s.importance <= 2]

    catchup_minutes = round(len(high) * 2 + len(medium) * 1 + len(low) * 0.5)
    top_sorted = sorted(stories, key=lambda s: -s.importance)[:10]

    return {
        "hours_away": hours,
        "total_found": len(stories),
        "high": len(high),
        "medium": len(medium),
        "low": len(low),
        "estimated_catchup_minutes": catchup_minutes,
        "top_stories": [StoryOut.model_validate(s) for s in top_sorted],
    }


@app.get("/api/search")
def search(q: str):
    q = q.strip()
    if not q:
        return {"query": q, "refined_query": q, "overview": None, "results": []}

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
    }


@app.post("/api/ingest")
def trigger_ingest():
    added = ingest_all()
    return {"added": added}
