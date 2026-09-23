from datetime import datetime, timezone
from sqlalchemy import Column, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship

from database import Base


class StoryCluster(Base):
    __tablename__ = "story_clusters"

    id = Column(Integer, primary_key=True, index=True)
    headline = Column(String(500), nullable=False)
    synthesis = Column(Text, nullable=True)
    source_count = Column(Integer, default=1)
    article_count = Column(Integer, default=1)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    articles = relationship("Story", back_populates="cluster")


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    summary = Column(Text, nullable=True)
    url = Column(String(1000), nullable=False, unique=True)
    source_name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    importance = Column(Integer, default=3)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    cluster_id = Column(Integer, ForeignKey("story_clusters.id"), nullable=True, index=True)
    cluster = relationship("StoryCluster", back_populates="articles")


class HistoryEntry(Base):
    """One thing the user searched for or opened. No accounts yet, so it's a single shared history."""

    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String(20), nullable=False, index=True)  # "search" | "view"
    # Where it happened: "search" (header), "ask" (⌘K), "pulse", "pulse_tag",
    # "story", "cluster", "around_you", "social_post", "explain"
    source = Column(String(40), nullable=False)
    title = Column(String(500), nullable=False)  # the query text, or the story/post title
    url = Column(String(1000), nullable=True)  # set for views
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
