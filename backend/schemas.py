from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class StoryOut(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    url: str
    source_name: str
    category: str
    importance: int
    published_at: Optional[datetime] = None
    created_at: datetime
    cluster_id: Optional[int] = None

    class Config:
        from_attributes = True


class ClusterOut(BaseModel):
    id: int
    headline: str
    synthesis: Optional[str] = None
    source_count: int
    article_count: int
    updated_at: datetime
    articles: list[StoryOut]

    class Config:
        from_attributes = True
