from datetime import datetime, timezone

import feedparser
from sqlalchemy.exc import IntegrityError

from database import Base, SessionLocal, engine
from feeds import FEEDS
from models import Story
from summarizer import summarize

Base.metadata.create_all(bind=engine)


def parse_published(entry):
    if getattr(entry, "published_parsed", None):
        return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
    return None


def ingest_all(limit_per_feed: int = 10) -> int:
    db = SessionLocal()
    added = 0
    try:
        for feed in FEEDS:
            parsed = feedparser.parse(feed["url"])
            for entry in parsed.entries[:limit_per_feed]:
                url = entry.get("link")
                if not url:
                    continue
                if db.query(Story).filter(Story.url == url).first():
                    continue

                title = entry.get("title", "Untitled")
                content = entry.get("summary", "") or entry.get("description", "")
                ai = summarize(title, content)

                story = Story(
                    title=title,
                    summary=ai["summary"],
                    url=url,
                    source_name=feed["name"],
                    category=feed["category"],
                    importance=ai["importance"],
                    published_at=parse_published(entry),
                )
                db.add(story)
                try:
                    db.commit()
                    added += 1
                except IntegrityError:
                    db.rollback()
        print(f"[ingest] added {added} new stories")
        return added
    finally:
        db.close()


if __name__ == "__main__":
    ingest_all()
