import { ShieldAlert } from "lucide-react";
import { getFomoShield } from "@/lib/api";
import StoryCard from "@/components/StoryCard";
import AnimatedNumber from "@/components/AnimatedNumber";

export default async function FomoShieldPage() {
  const data = await getFomoShield(24);

  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="relative overflow-hidden bg-[#0e1312] px-4 py-6 text-center text-[#ededec] sm:px-6 sm:py-8">
          <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 animate-float rounded-full bg-[#fbd509]/10 blur-3xl" />

          <div className="relative flex justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fbd509] text-black">
              <ShieldAlert className="h-5 w-5" strokeWidth={2} />
            </span>
          </div>
          <h1 className="relative mt-2 text-xl font-bold">FOMO Shield</h1>
          <p className="relative mt-1 text-sm text-stone-400">
            You were away for {data.hours_away} hours
          </p>

          <div className="relative mt-6">
            <p className="text-xs tracking-wide text-stone-400 uppercase">
              Estimated catch-up time
            </p>
            <p className="text-4xl font-bold text-[#fbd509] sm:text-5xl">
              <AnimatedNumber value={data.estimated_catchup_minutes} />
              <span className="text-lg font-medium text-stone-400"> min</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-stone-200 dark:divide-stone-800">
          <div className="p-2.5 text-center sm:p-4">
            <p className="text-xl font-bold text-rose-500 sm:text-2xl">
              <AnimatedNumber value={data.high} />
            </p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-stone-500 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> major
            </p>
          </div>
          <div className="p-2.5 text-center sm:p-4">
            <p className="text-xl font-bold text-amber-500 sm:text-2xl">
              <AnimatedNumber value={data.medium} />
            </p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-stone-500 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{" "}
              notable
            </p>
          </div>
          <div className="p-2.5 text-center sm:p-4">
            <p className="text-xl font-bold text-emerald-500 sm:text-2xl">
              <AnimatedNumber value={data.low} />
            </p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-stone-500 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
              minor
            </p>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-xs text-stone-400">
        {data.total_found} pieces of content found — showing the top{" "}
        {data.top_stories.length}.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.top_stories.map((story, i) => (
          <StoryCard key={story.id} story={story} showCategory index={i} />
        ))}
      </div>

      {data.total_found === 0 && (
        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700">
          You&apos;re caught up
        </div>
      )}
    </main>
  );
}
