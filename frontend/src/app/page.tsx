import { getClusters, getStories, Story } from "@/lib/api";
import { CATEGORY_ORDER, categoryMeta } from "@/lib/categories";
import StoryCard from "@/components/StoryCard";
import StoryIntelligenceCard from "@/components/StoryIntelligenceCard";
import HomeHero from "@/components/HomeHero";
import { Reveal } from "@/components/motion";
import NewSinceBanner from "@/components/NewSinceBanner";
import AroundYou from "@/components/AroundYou";

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
  const [stories, clusters] = await Promise.all([getStories(), getClusters()]);
  const groups = groupByCategory(stories);
  const activeCategories = CATEGORY_ORDER.filter((c) => groups[c]?.length);

  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <HomeHero
        dateLabel={todayLabel()}
        greeting={greeting()}
        storyCount={stories.length}
        topicCount={activeCategories.length}
        chips={activeCategories.map((category) => {
          const meta = categoryMeta(category);
          return {
            category,
            label: meta.label,
            chip: meta.chip,
            count: groups[category].length,
          };
        })}
      />

      <NewSinceBanner count={stories.length} />

      {stories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700">
          No stories yet — run the ingestion once from the backend.
        </div>
      )}

      {clusters.length > 0 && (
        <section className="mb-12">
          <Reveal className="mb-3 flex items-center gap-2 border-b border-stone-200 pb-2 dark:border-stone-800">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
              Top Developments
            </h2>
          </Reveal>
          <div className="grid gap-3 lg:grid-cols-2">
            {clusters.map((cluster, i) => (
              <StoryIntelligenceCard key={cluster.id} cluster={cluster} index={i} />
            ))}
          </div>
        </section>
      )}

      <AroundYou />

      <div className="space-y-12">
        {activeCategories.map((category) => {
          const meta = categoryMeta(category);
          return (
            <section key={category} id={category} className="scroll-mt-20">
              <Reveal className="mb-3 flex items-center gap-2 border-b border-stone-200 pb-2 dark:border-stone-800">
                <span className={`h-2 w-2 rounded-full ${meta.avatar}`} />
                <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
                  {meta.label}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.chip}`}
                >
                  {groups[category].length}
                </span>
              </Reveal>
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
        <Reveal className="mt-12 text-center text-sm text-stone-400">
          <span className="text-amber-700 dark:text-[#fbd509]">✓</span> You&apos;ve
          reached the end. You&apos;re caught up.
        </Reveal>
      )}
    </main>
  );
}
