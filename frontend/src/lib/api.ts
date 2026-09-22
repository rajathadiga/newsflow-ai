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
};

export type FomoResponse = {
  hours_away: number;
  total_found: number;
  high: number;
  medium: number;
  low: number;
  estimated_catchup_minutes: number;
  top_stories: Story[];
};

export async function getStories(category?: string): Promise<Story[]> {
  const url = new URL(`${API_URL}/api/stories`);
  if (category) url.searchParams.set("category", category);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch stories");
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
};

export async function searchNews(query: string): Promise<SearchResponse> {
  const res = await fetch(
    `${API_URL}/api/search?q=${encodeURIComponent(query)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}
