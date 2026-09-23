"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { History, ShieldAlert, Sparkles } from "lucide-react";
import { getFomoShield, getBriefing, FomoResponse } from "@/lib/api";
import { getHoursSinceLastVisitAndStamp } from "@/lib/lastVisit";
import StoryCard from "@/components/StoryCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import { Skeleton, StoryCardSkeleton } from "@/components/Skeleton";
import AudioBriefing from "@/components/AudioBriefing";
import { Reveal, springs } from "@/components/motion";

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
    getFomoShield(hours).then(setData);
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
            <motion.span
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ rotate: [0, -12, 10, -6, 0], transition: { duration: 0.5 } }}
              transition={{ ...springs.bouncy, delay: 0.1 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fbd509] text-black"
            >
              <ShieldAlert className="h-5 w-5" strokeWidth={2} />
            </motion.span>
          </div>
          <h1 className="relative mt-2 text-xl font-bold">FOMO Shield</h1>
          <p className="relative mt-1 text-sm text-stone-400">
            {data.fallback
              ? `Not much new since you were here ${formatAway(data.hours_away)} ago`
              : `${data.new_since_visit} new stories while you were away for ${formatAway(data.hours_away)}`}
          </p>
          {data.fallback && (
            <p className="relative mt-0.5 text-xs text-stone-500">
              {data.fallback === "today"
                ? "Here's what still matters from the last 24 hours."
                : "No fresh stories in a day — showing the latest we have."}
            </p>
          )}

          <div className="relative mt-6">
            <p className="text-xs tracking-wide text-stone-400 uppercase">
              {data.fallback ? "Today's catch-up time" : "Estimated catch-up time"}
            </p>
            <p className="text-4xl font-bold text-[#fbd509] sm:text-5xl">
              <AnimatedNumber value={data.estimated_catchup_minutes} />
              <span className="text-lg font-medium text-stone-400"> min</span>
            </p>
          </div>

          <motion.button
            onClick={runBriefing}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { ...springs.soft, delay: 0.5 } }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={springs.bouncy}
            className="group relative mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#fbd509]/30 bg-[#fbd509]/10 px-4 py-2 text-xs font-semibold text-[#fbd509] transition-colors hover:bg-[#fbd509]/20"
          >
            <Sparkles
              className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-[72deg] group-hover:scale-125"
              strokeWidth={2}
            />
            Give me my briefing
          </motion.button>
        </div>

        <motion.div
          className="grid grid-cols-3 divide-x divide-stone-200 dark:divide-stone-800"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.8 },
              show: { opacity: 1, y: 0, scale: 1, transition: springs.bouncy },
            }}
            whileHover={{ scale: 1.08 }}
            className="cursor-default p-2.5 text-center sm:p-4"
          >
            <p className="text-xl font-bold text-rose-500 sm:text-2xl">
              <AnimatedNumber value={data.high} />
            </p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-stone-500 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> major
            </p>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.8 },
              show: { opacity: 1, y: 0, scale: 1, transition: springs.bouncy },
            }}
            whileHover={{ scale: 1.08 }}
            className="cursor-default p-2.5 text-center sm:p-4"
          >
            <p className="text-xl font-bold text-amber-500 sm:text-2xl">
              <AnimatedNumber value={data.medium} />
            </p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-stone-500 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{" "}
              notable
            </p>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.8 },
              show: { opacity: 1, y: 0, scale: 1, transition: springs.bouncy },
            }}
            whileHover={{ scale: 1.08 }}
            className="cursor-default p-2.5 text-center sm:p-4"
          >
            <p className="text-xl font-bold text-emerald-500 sm:text-2xl">
              <AnimatedNumber value={data.low} />
            </p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-stone-500 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
              minor
            </p>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
      {showBriefing && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={springs.soft}
          className="mx-auto max-w-2xl overflow-hidden"
        >
        <div className="mt-4 rounded-2xl border border-[#fbd509]/30 bg-[#fbd509]/[0.04] p-4 text-sm text-stone-700 dark:text-stone-300">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-[#fbd509]">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              Your briefing
            </p>
            {briefing && <AudioBriefing text={briefing} />}
          </div>
          {briefingLoading && (
            <p className="animate-pulse text-stone-400">Putting it together…</p>
          )}
          {!briefingLoading && briefing && (
            <motion.p
              className="whitespace-pre-line"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.012 } } }}
            >
              {briefing.split(/(\s+)/).map((w, i) => (
                <motion.span
                  key={i}
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                >
                  {w}
                </motion.span>
              ))}
            </motion.p>
          )}
          {!briefingLoading && !briefing && (
            <p className="text-stone-400">
              Briefing unavailable right now — AI model may be rate-limited.
              Try again shortly.
            </p>
          )}
        </div>
        </motion.div>
      )}
      </AnimatePresence>

      {topThree.length > 0 && (
        <div className="mx-auto mt-8 max-w-2xl">
          <Reveal className="mb-3 text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-[#fbd509]">
            {data.fallback
              ? `Today's ${topThree.length} most important`
              : `${topThree.length} things actually worth knowing`}
          </Reveal>
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

      <div className="mt-10 text-center">
        <Link
          href="/history"
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-amber-700 dark:hover:text-[#fbd509]"
        >
          <History className="h-3.5 w-3.5" strokeWidth={2} />
          See what you&apos;ve searched and read
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </main>
  );
}
