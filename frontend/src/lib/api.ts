const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type Story = {
  id: number;
  title: string;
  summary: string | null;
  url: string;
  source_name: string;
  category: string;
  importance: number;
  published_at: string | null;
  created_at: string;
  cluster_id: number | null;
};

export type FomoResponse = {
  hours_away: number;
  new_since_visit: number;
  // "today": little was new since the last visit, so these are the day's top stories.
  // "latest": nothing ingested in 24h, so these are simply the newest stories we have.
  fallback: "today" | "latest" | null;
  total_found: number;
  high: number;
  medium: number;
  low: number;
  estimated_catchup_minutes: number;
  top_stories: Story[];
};

export async function getStories(category?: string): Promise<Story[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const qs = params.toString();
  const res = await fetch(`${API_URL}/api/stories${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch stories");
  return res.json();
}

export type Cluster = {
  id: number;
  headline: string;
  synthesis: string | null;
  source_count: number;
  article_count: number;
  updated_at: string;
  articles: Story[];
};

export async function getClusters(): Promise<Cluster[]> {
  const res = await fetch(`${API_URL}/api/clusters`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch clusters");
  return res.json();
}

export async function getFomoShield(hours: number): Promise<FomoResponse> {
  const res = await fetch(`${API_URL}/api/fomo?hours=${hours}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch FOMO shield data");
  return res.json();
}

export type NewsResult = {
  title: string;
  description: string | null;
  url: string;
  source_name: string;
  published_at: string | null;
};

export type SearchResponse = {
  query: string;
  refined_query: string;
  overview: string | null;
  results: NewsResult[];
  configured: boolean;
};

export async function searchNews(query: string): Promise<SearchResponse> {
  const res = await fetch(
    `${API_URL}/api/search?q=${encodeURIComponent(query)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export type ExplainDepth = "30sec" | "simple" | "detailed" | "technical";

export async function explainStory(
  title: string,
  summary: string,
  depth: ExplainDepth,
): Promise<string | null> {
  const params = new URLSearchParams({ title, summary, depth });
  const res = await fetch(`${API_URL}/api/explain?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.explanation;
}

export type Claim = {
  claim: string;
  confidence: "reported" | "claimed" | "unverified";
};

export async function getClaims(
  title: string,
  summary: string,
): Promise<Claim[] | null> {
  const params = new URLSearchParams({ title, summary });
  const res = await fetch(`${API_URL}/api/claims?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.claims;
}

export type BriefingResponse = {
  briefing: string | null;
  story_count: number;
};

export async function getBriefing(): Promise<BriefingResponse> {
  const res = await fetch(`${API_URL}/api/briefing`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch briefing");
  return res.json();
}

export type SocialPlatform = "reddit" | "mastodon" | "hackernews";

export type SocialPost = {
  id: string;
  platform: SocialPlatform;
  author: string;
  author_url: string | null;
  avatar: string | null;
  community: string | null;
  title: string | null;
  text: string | null;
  url: string;
  image: string | null;
  published_at: string | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};

export type SocialResponse = {
  query: string;
  posts: SocialPost[];
  // per-source outcome: "ok" | "empty" | "rate_limited" | "error"
  sources: Partial<Record<SocialPlatform, string>>;
};

export async function getSocial(query: string): Promise<SocialResponse> {
  const res = await fetch(
    `${API_URL}/api/social?q=${encodeURIComponent(query)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Social search failed");
  return res.json();
}

export type Place = {
  city: string | null;
  state: string | null;
  country: string | null;
  query: string;
};

export async function reverseGeocode(lat: number, lon: number): Promise<Place | null> {
  const res = await fetch(`${API_URL}/api/location?lat=${lat}&lon=${lon}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.place;
}

export type TrendingResponse = {
  posts: SocialPost[];
  tags: string[]; // trending hashtags on Mastodon
  sources: Partial<Record<SocialPlatform, string>>;
  updated_at: string;
};

export async function getTrending(): Promise<TrendingResponse> {
  const res = await fetch(`${API_URL}/api/social/trending`, { cache: "no-store" });
  if (!res.ok) throw new Error("Trending fetch failed");
  return res.json();
}

export type HistoryKind = "search" | "view";

export type HistoryEntry = {
  id: number;
  kind: HistoryKind;
  source: string;
  title: string;
  url: string | null;
  created_at: string;
};

export async function addHistory(
  entry: Omit<HistoryEntry, "id" | "created_at">,
): Promise<void> {
  await fetch(`${API_URL}/api/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
    // keepalive lets the request finish even if the click navigates away.
    keepalive: true,
  });
}

export async function getHistory(kind?: HistoryKind): Promise<HistoryEntry[]> {
  const res = await fetch(`${API_URL}/api/history${kind ? `?kind=${kind}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  await fetch(`${API_URL}/api/history/${id}`, { method: "DELETE" });
}

export async function clearHistory(): Promise<void> {
  await fetch(`${API_URL}/api/history`, { method: "DELETE" });
}
