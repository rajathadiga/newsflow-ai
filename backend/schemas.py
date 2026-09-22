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

    class Config:
        from_attributes = True
