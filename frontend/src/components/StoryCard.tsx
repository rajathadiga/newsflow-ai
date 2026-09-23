"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Story } from "@/lib/api";
import { categoryMeta } from "@/lib/categories";
import TimeAgo from "./TimeAgo";
import FollowButton from "./FollowButton";
import ExplainPanel from "./ExplainPanel";
import { TiltCard, springs } from "./motion";
import { trackView } from "@/lib/history";

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
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...springs.soft, delay: (index % 6) * 0.06 }}
      className="h-full"
    >
    <TiltCard className="group h-full rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-[border-color,box-shadow] hover:border-stone-300 hover:shadow-xl hover:shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:shadow-black/40">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ${
              IMPORTANCE_RING[story.importance] ?? "ring-stone-400/50"
            } ${meta.avatar}`}
          >
            {initials(story.source_name)}
          </span>
          {showCategory && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${meta.chip}`}
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
        <FollowButton storyId={story.id} />
      </div>

      {story.cluster_id !== null && (
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={springs.bouncy}
          className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#fbd509]/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-700 uppercase dark:text-[#fbd509]"
        >
          <span className="animate-pulse">🟡</span> Developing
        </motion.span>
      )}

      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackView("story", story.title, story.url)}
      >
        <h3 className="font-semibold leading-snug text-stone-900 transition-colors group-hover:text-amber-700 dark:text-stone-50 dark:group-hover:text-[#fbd509]">
          {story.title}
        </h3>

        {story.summary && (
          <p className="mt-1.5 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
            {story.summary}
          </p>
        )}
      </a>

      <div className="mt-3 flex items-center justify-between">
        <Link
          href={`/pulse?q=${encodeURIComponent(story.title)}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 transition-colors hover:text-amber-700 dark:hover:text-[#fbd509]"
        >
          <Flame
            className="h-3 w-3 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-125"
            strokeWidth={2}
          />
          Social Pulse
        </Link>
        <ExplainPanel title={story.title} summary={story.summary || ""} />
      </div>
    </TiltCard>
    </motion.div>
  );
}
