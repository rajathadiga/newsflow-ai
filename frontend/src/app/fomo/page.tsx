"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Sparkles } from "lucide-react";
import { getFomoShield, getBriefing, FomoResponse } from "@/lib/api";
import { getHoursSinceLastVisitAndStamp } from "@/lib/lastVisit";
import StoryCard from "@/components/StoryCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { Skeleton, StoryCardSkeleton } from "@/components/Skeleton";
import AudioBriefing from "@/components/AudioBriefing";

function formatAway(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function FomoShieldPage() {
  const [data, setData] = useState<FomoResponse | null>(null);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  useEffect(() => {
    const hours = getHoursSinceLastVisitAndStamp();
    getFomoShield(Math.max(1, Math.round(hours))).then(setData);
  }, []);

  async function runBriefing() {
    setShowBriefing(true);
    if (briefing) return;
    setBriefingLoading(true);
    try {
      const res = await getBriefing();
      setBriefing(res.briefing);
    } finally {
      setBriefingLoading(false);
    }
  }

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-white p-8 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-4 h-12 w-24" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      </main>
    );
  }

  const topThree = data.top_stories.slice(0, 3);
  const rest = data.top_stories.slice(3);
  const minorCount = Math.max(0, data.total_found - topThree.length);

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
            You were away for {formatAway(data.hours_away)}
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

          <button
            onClick={runBriefing}
            className="relative mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#fbd509]/30 bg-[#fbd509]/10 px-4 py-2 text-xs font-semibold text-[#fbd509] transition-colors hover:bg-[#fbd509]/20"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            Give me my briefing
          </button>
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

      {showBriefing && (
        <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-[#fbd509]/30 bg-[#fbd509]/[0.04] p-4 text-sm text-stone-700 dark:text-stone-300">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-[#fbd509]">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              Your briefing
            </p>
            {briefing && <AudioBriefing text={briefing} />}
          </div>
          {briefingLoading && (
            <p className="text-stone-400">Putting it together…</p>
          )}
          {!briefingLoading && briefing && (
            <p className="whitespace-pre-line">{briefing}</p>
          )}
          {!briefingLoading && !briefing && (
            <p className="text-stone-400">
              Briefing unavailable right now — AI model may be rate-limited.
              Try again shortly.
            </p>
          )}
        </div>
      )}

      {topThree.length > 0 && (
        <div className="mx-auto mt-8 max-w-2xl">
          <p className="mb-3 text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-[#fbd509]">
            {topThree.length} things actually worth knowing
          </p>
          <div className="space-y-3">
            {topThree.map((story, i) => (
              <StoryCard key={story.id} story={story} showCategory index={i} />
            ))}
          </div>
        </div>
      )}

      {minorCount > 0 && (
        <p className="mx-auto mt-4 max-w-2xl text-xs text-stone-400">
          + {minorCount} other update{minorCount === 1 ? "" : "s"} — showing
          the next {rest.length} below.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rest.map((story, i) => (
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
