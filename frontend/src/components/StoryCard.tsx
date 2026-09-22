"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Story } from "@/lib/api";
import { categoryMeta } from "@/lib/categories";
import TimeAgo from "./TimeAgo";

const IMPORTANCE_RING: Record<number, string> = {
  5: "ring-rose-500/50",
  4: "ring-rose-500/50",
  3: "ring-amber-500/50",
  2: "ring-emerald-500/50",
  1: "ring-emerald-500/50",
};

const IMPORTANCE_DOT: Record<number, string> = {
  5: "bg-rose-500",
  4: "bg-rose-500",
  3: "bg-amber-500",
  2: "bg-emerald-500",
  1: "bg-emerald-500",
};

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default function StoryCard({
  story,
  showCategory = false,
  index = 0,
}: {
  story: Story;
  showCategory?: boolean;
  index?: number;
}) {
  const meta = categoryMeta(story.category);

  return (
    <motion.div
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="group animate-fade-in-up rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-stone-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:shadow-black/30"
    >
      <a href={story.url} target="_blank" rel="noopener noreferrer">
        <div className="mb-2 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ${
              IMPORTANCE_RING[story.importance] ?? "ring-stone-400/50"
            } ${meta.avatar}`}
          >
            {initials(story.source_name)}
          </span>
          {showCategory && (
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${meta.chip}`}
            >
              {meta.label}
            </span>
          )}
          <span className="truncate">{story.source_name}</span>
          <span
            className={`h-1 w-1 shrink-0 rounded-full ${IMPORTANCE_DOT[story.importance] ?? "bg-stone-400"}`}
          />
          <span className="shrink-0">
            <TimeAgo date={story.published_at} />
          </span>
        </div>

        <h3 className="font-semibold leading-snug text-stone-900 transition-colors group-hover:text-amber-700 dark:text-stone-50 dark:group-hover:text-[#fbd509]">
          {story.title}
        </h3>

        {story.summary && (
          <p className="mt-1.5 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
            {story.summary}
          </p>
        )}
      </a>

      <Link
        href={`/pulse?q=${encodeURIComponent(story.title)}`}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-stone-400 transition-colors hover:text-amber-700 dark:hover:text-[#fbd509]"
      >
        <Flame className="h-3 w-3" strokeWidth={2} />
        See what people are saying
        <span className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </motion.div>
  );
}
