export type SocialLink = {
  name: string;
  emoji: string;
  url: string;
  description: string;
};

export function buildSocialLinks(query: string): SocialLink[] {
  const q = encodeURIComponent(query.trim());
  const tag = encodeURIComponent(query.trim().replace(/\s+/g, ""));

  return [
    {
      name: "Instagram",
      emoji: "📸",
      url: `https://www.instagram.com/explore/tags/${tag}/`,
      description: `Posts tagged #${query.trim().replace(/\s+/g, "")}`,
    },
    {
      name: "X (Twitter)",
      emoji: "𝕏",
      url: `https://twitter.com/search?q=${q}&src=typed_query&f=live`,
      description: "Latest posts and discussion",
    },
    {
      name: "Reddit",
      emoji: "👽",
      url: `https://www.reddit.com/search/?q=${q}&sort=hot`,
      description: "Trending threads and comments",
    },
    {
      name: "YouTube",
      emoji: "▶️",
      url: `https://www.youtube.com/results?search_query=${q}`,
      description: "Videos and coverage",
    },
    {
      name: "Google News",
      emoji: "📰",
      url: `https://news.google.com/search?q=${q}`,
      description: "News coverage from every outlet",
    },
  ];
}
