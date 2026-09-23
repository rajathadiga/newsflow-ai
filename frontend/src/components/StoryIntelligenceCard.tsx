"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Cluster } from "@/lib/api";
import { timeAgo } from "@/lib/time";
import ClaimsPanel from "./ClaimsPanel";
import { springs } from "./motion";
import { trackView } from "@/lib/history";

function parseSynthesis(text: string) {
  const get = (label: string) => {
    const match = text.match(new RegExp(`${label}:\\s*(.+?)(?:\\n|$)`, "i"));
    return match ? match[1].trim() : null;
  };
  return {
    whatHappened: get("What happened"),
    whyItMatters: get("Why it matters"),
    stillUnclear: get("Still unclear"),
  };
}

export default function StoryIntelligenceCard({
  cluster,
  index = 0,
}: {
  cluster: Cluster;
  index?: number;
}) {
  const parsed = cluster.synthesis ? parseSynthesis(cluster.synthesis) : null;
  const sources = [...new Set(cluster.articles.map((a) => a.source_name))];
  const timeline = [...cluster.articles].sort((a, b) => {
    const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
    const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
    return ta - tb;
  });
  const earliest = timeline[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { ...springs.soft, delay: (index % 2) * 0.08 },
      }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -4 }}
      transition={springs.soft}
      className="rounded-2xl transition-shadow hover:shadow-xl hover:shadow-stone-900/10 dark:hover:shadow-black/40 border border-[#fbd509]/30 bg-[#fbd509]/[0.04] p-5 dark:border-[#fbd509]/20"
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-[#fbd509]">
        <motion.span
          initial={{ rotate: -180, scale: 0 }}
          whileInView={{ rotate: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ ...springs.bouncy, delay: 0.2 }}
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
        </motion.span>
        OUTSIDE INTELLIGENCE
      </div>

      <h3 className="text-lg font-bold text-stone-900 dark:text-[#ededec]">
        {cluster.headline}
      </h3>
      <p className="mt-1 text-xs text-stone-500">
        {cluster.article_count} articles · {cluster.source_count} independent
        sources ({sources.slice(0, 4).join(", ")}
        {sources.length > 4 ? "…" : ""})
      </p>
      {earliest?.published_at && (
        <p className="mt-0.5 text-xs text-stone-400">
          Earliest source found: {earliest.source_name} ·{" "}
          {timeAgo(earliest.published_at)}
        </p>
      )}

      {parsed ? (
        <div className="mt-3 space-y-2 text-sm">
          {parsed.whatHappened && (
            <p className="text-stone-700 dark:text-stone-300">
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                What happened:{" "}
              </span>
              {parsed.whatHappened}
            </p>
          )}
          {parsed.whyItMatters && (
            <p className="text-stone-700 dark:text-stone-300">
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                Why it matters:{" "}
              </span>
              {parsed.whyItMatters}
            </p>
          )}
          {parsed.stillUnclear && (
            <p className="text-stone-500">
              <span className="font-semibold text-stone-600 dark:text-stone-400">
                Still unclear:{" "}
              </span>
              {parsed.stillUnclear}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-stone-500">
          Multiple sources are covering this — AI synthesis unavailable right
          now.
        </p>
      )}

      {timeline.length > 1 && (
        <div className="mt-4 border-l-2 border-stone-200 pl-3 dark:border-white/10">
          {timeline.map((a, i) => (
            <motion.a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackView("cluster", a.title, a.url)}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{
                opacity: 1,
                x: 0,
                transition: { ...springs.soft, delay: 0.15 + i * 0.07 },
              }}
              viewport={{ once: true }}
              whileHover={{ x: 4 }}
              transition={springs.soft}
              className="relative block pb-2 text-xs last:pb-0"
            >
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ ...springs.bouncy, delay: 0.2 + i * 0.07 }}
                className="absolute top-1 -left-[17px] h-2 w-2 rounded-full bg-[#fbd509]"
              />
              <span className="font-medium text-stone-500">
                {a.published_at ? timeAgo(a.published_at) : ""} ·{" "}
                {a.source_name}
              </span>
              <p className="text-stone-700 dark:text-stone-300">{a.title}</p>
            </motion.a>
          ))}
        </div>
      )}

      <ClaimsPanel
        title={cluster.headline}
        summary={cluster.synthesis || cluster.articles[0]?.summary || ""}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {cluster.articles.slice(0, 4).map((a) => (
          <motion.a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackView("cluster", a.title, a.url)}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={springs.bouncy}
            className="rounded-full border border-stone-200 px-2.5 py-1 text-xs text-stone-600 transition-colors hover:border-[#fbd509] hover:text-amber-700 dark:border-white/10 dark:text-stone-400 dark:hover:text-[#fbd509]"
          >
            {a.source_name}
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}
