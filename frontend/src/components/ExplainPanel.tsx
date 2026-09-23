"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { explainStory, ExplainDepth } from "@/lib/api";
import { trackView } from "@/lib/history";

const DEPTHS: { key: ExplainDepth; label: string }[] = [
  { key: "30sec", label: "30 sec" },
  { key: "simple", label: "Simple" },
  { key: "detailed", label: "Detailed" },
  { key: "technical", label: "Technical" },
];

export default function ExplainPanel({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  const pillId = useId();
  const [open, setOpen] = useState(false);
  const [depth, setDepth] = useState<ExplainDepth>("simple");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [cache, setCache] = useState<Partial<Record<ExplainDepth, string>>>(
    {},
  );

  async function pick(d: ExplainDepth) {
    setDepth(d);
    if (cache[d]) {
      setText(cache[d]!);
      return;
    }
    setLoading(true);
    setText(null);
    const result = await explainStory(title, summary, d);
    setLoading(false);
    if (result) {
      setCache((c) => ({ ...c, [d]: result }));
      setText(result);
    }
  }

  return (
    <div onClick={(e) => e.preventDefault()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          const next = !open;
          setOpen(next);
          if (next) trackView("explain", title, null);
          if (next && !text) pick(depth);
        }}
        className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 transition-colors hover:text-amber-700 dark:hover:text-[#fbd509]"
      >
        {open ? "Hide explanation" : "Explain"}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="inline-block"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl bg-stone-100 p-3 dark:bg-white/5">
              <div className="flex gap-1">
                {DEPTHS.map((d) => (
                  <button
                    key={d.key}
                    onClick={(e) => {
                      e.stopPropagation();
                      pick(d.key);
                    }}
                    className={`relative rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      depth === d.key
                        ? "text-black"
                        : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                    }`}
                  >
                    {depth === d.key && (
                      <motion.span
                        layoutId={`explain-depth-${pillId}`}
                        className="absolute inset-0 rounded-full bg-[#fbd509]"
                        transition={{ type: "spring", bounce: 0.25, duration: 0.45 }}
                      />
                    )}
                    <span className="relative">{d.label}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={loading ? "loading" : depth}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className={`mt-2 text-sm text-stone-700 dark:text-stone-300 ${loading ? "animate-pulse" : ""}`}
                >
                  {loading ? "Thinking…" : text || "Explanation unavailable."}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
