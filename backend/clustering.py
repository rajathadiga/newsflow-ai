"""Groups articles that are (probably) reporting on the same event, using
keyword overlap on titles. No embeddings/vector DB — this is the cheap,
deterministic first pass the AI architecture should sit on top of, not a
replacement for real semantic clustering.
"""

from sqlalchemy.orm import Session

from models import Story, StoryCluster
from summarizer import synthesize_story

_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "of", "in", "on", "at", "to",
    "for", "with", "from", "by", "as", "is", "are", "was", "were", "be",
    "been", "being", "it", "its", "this", "that", "these", "those", "he",
    "she", "they", "we", "you", "i", "his", "her", "their", "our", "your",
    "after", "over", "into", "about", "against", "amid", "than", "up",
    "out", "not", "no", "new", "says", "say", "said", "will", "has",
    "have", "had", "who", "what", "when", "where", "why", "how",
}

MATCH_THRESHOLD = 0.4


def _keywords(title: str) -> set[str]:
    words = title.lower().replace("'", "").split()
    return {
        w.strip(",.?!:;\"()") for w in words
        if len(w) > 3 and w.strip(",.?!:;\"()") not in _STOPWORDS
    }


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    intersection = len(a & b)
    union = len(a | b)
    return intersection / union if union else 0.0


def cluster_new_stories(db: Session) -> int:
    """Assign cluster_id to any stories that don't have one yet. Returns the
    number of stories newly grouped into a multi-article cluster.
    """
    unclustered = db.query(Story).filter(Story.cluster_id.is_(None)).all()
    if not unclustered:
        return 0

    existing_clusters = db.query(StoryCluster).all()
    cluster_keywords = {
        c.id: _keywords(c.headline) for c in existing_clusters
    }

    grouped = 0
    touched_clusters: set[int] = set()

    for story in unclustered:
        story_kw = _keywords(story.title)
        if not story_kw:
            continue

        best_cluster_id = None
        best_score = 0.0
        for cid, kw in cluster_keywords.items():
            score = _jaccard(story_kw, kw)
            if score > best_score:
                best_score = score
                best_cluster_id = cid

        if best_score >= MATCH_THRESHOLD and best_cluster_id is not None:
            story.cluster_id = best_cluster_id
            touched_clusters.add(best_cluster_id)
            grouped += 1
            continue

        # No existing cluster matched — check other still-unclustered
        # stories from this same batch for a pairing.
        for other in unclustered:
            if other.id == story.id or other.cluster_id is not None:
                continue
            other_kw = _keywords(other.title)
            if _jaccard(story_kw, other_kw) >= MATCH_THRESHOLD:
                new_cluster = StoryCluster(headline=story.title)
                db.add(new_cluster)
                db.flush()  # get new_cluster.id
                story.cluster_id = new_cluster.id
                other.cluster_id = new_cluster.id
                cluster_keywords[new_cluster.id] = story_kw
                touched_clusters.add(new_cluster.id)
                grouped += 2
                break

    db.commit()

    for cid in touched_clusters:
        _refresh_cluster(db, cid)

    return grouped


def _refresh_cluster(db: Session, cluster_id: int) -> None:
    cluster = db.get(StoryCluster, cluster_id)
    articles = (
        db.query(Story).filter(Story.cluster_id == cluster_id).all()
    )
    if not cluster or len(articles) < 2:
        return

    cluster.article_count = len(articles)
    cluster.source_count = len({a.source_name for a in articles})
    cluster.headline = max(articles, key=lambda a: len(a.title or "")).title

    synthesis = synthesize_story(
        [{"title": a.title, "summary": a.summary, "source_name": a.source_name} for a in articles]
    )
    if synthesis:
        cluster.synthesis = synthesis

    db.commit()
