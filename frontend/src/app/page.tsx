import Link from "next/link";
import { getStories, Story } from "@/lib/api";

const CATEGORY_ORDER = ["World", "India", "Technology", "Internet"];
const CATEGORY_EMOJI: Record<string, string> = {
  World: "🌍",
  India: "🇮🇳",
  Technology: "💻",
  Internet: "🔥",
};

function groupByCategory(stories: Story[]) {
  const groups: Record<string, Story[]> = {};
  for (const story of stories) {
    groups[story.category] = groups[story.category] || [];
    groups[story.category].push(story);
  }
  return groups;
}

export default async function Home() {
  const stories = await getStories();
  const groups = groupByCategory(stories);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outside</h1>
          <p className="text-sm text-zinc-500">
            Stay informed. Stay offline.
          </p>
        </div>
        <Link
          href="/fomo"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
        >
          🛡️ FOMO Shield
        </Link>
      </div>

      {stories.length === 0 && (
        <p className="text-zinc-500">
          No stories yet — run the ingestion once from the backend.
        </p>
      )}

      {CATEGORY_ORDER.filter((c) => groups[c]?.length).map((category) => (
        <section key={category} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">
            {CATEGORY_EMOJI[category]} {category}
          </h2>
          <ul className="space-y-4">
            {groups[category].map((story) => (
              <li key={story.id} className="border-b border-zinc-200 pb-4">
                <a
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                >
                  {story.title}
                </a>
                {story.summary && (
                  <p className="mt-1 text-sm text-zinc-600">
                    {story.summary}
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-400">
                  {story.source_name}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
