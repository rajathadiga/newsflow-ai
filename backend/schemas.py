from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


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


class HistoryIn(BaseModel):
    kind: Literal["search", "view"]
    source: str = Field(max_length=40)
    title: str = Field(min_length=1, max_length=500)
    url: Optional[str] = Field(default=None, max_length=1000)


class HistoryOut(HistoryIn):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
