from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime

from database import Base


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
