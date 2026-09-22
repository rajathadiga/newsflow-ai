import { getStories, Story } from "@/lib/api";
import { CATEGORY_ORDER, categoryMeta } from "@/lib/categories";
import StoryCard from "@/components/StoryCard";

function groupByCategory(stories: Story[]) {
  const groups: Record<string, Story[]> = {};
  for (const story of stories) {
    groups[story.category] = groups[story.category] || [];
    groups[story.category].push(story);
  }
  return groups;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function Home() {
  const stories = await getStories();
  const groups = groupByCategory(stories);
  const activeCategories = CATEGORY_ORDER.filter((c) => groups[c]?.length);

  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="relative mb-10 overflow-hidden rounded-3xl">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 animate-float rounded-full bg-[#fbd509]/15 blur-3xl" />

        <div className="relative px-1 py-6 sm:py-8">
          <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-[#fbd509]">
            {todayLabel()}
          </p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
            {greeting()}.
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Here&apos;s what&apos;s happening —{" "}
            <span className="font-medium text-stone-800 dark:text-stone-200">
              {stories.length} stories
            </span>{" "}
            across {activeCategories.length} topics.
          </p>

          {activeCategories.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {activeCategories.map((category) => {
                const meta = categoryMeta(category);
                return (
                  <a
                    key={category}
                    href={`#${category}`}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-transform hover:scale-105 ${meta.chip}`}
                  >
                    {meta.label} · {groups[category].length}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {stories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700">
          No stories yet — run the ingestion once from the backend.
        </div>
      )}

      <div className="space-y-12">
        {activeCategories.map((category) => {
          const meta = categoryMeta(category);
          return (
            <section key={category} id={category} className="scroll-mt-20">
              <div className="mb-3 flex items-center gap-2 border-b border-stone-200 pb-2 dark:border-stone-800">
                <span
                  className={`h-2 w-2 rounded-full ${meta.avatar}`}
                />
                <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
                  {meta.label}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.chip}`}
                >
                  {groups[category].length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {groups[category].map((story, i) => (
                  <StoryCard key={story.id} story={story} index={i} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {stories.length > 0 && (
        <p className="mt-12 text-center text-sm text-stone-400">
          <span className="text-amber-700 dark:text-[#fbd509]">✓</span> You&apos;ve
          reached the end. You&apos;re caught up.
        </p>
      )}
    </main>
  );
}
