"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getClaims, Claim } from "@/lib/api";

const CONFIDENCE_STYLE: Record<Claim["confidence"], string> = {
  reported: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  claimed: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  unverified: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

export default function ClaimsPanel({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState<Claim[] | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && claims === null) {
      setLoading(true);
      const result = await getClaims(title, summary);
      setClaims(result || []);
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={toggle}
        className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 transition-colors hover:text-amber-700 dark:hover:text-[#fbd509]"
      >
        {open ? "Hide claims & evidence" : "Claims & evidence"}
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
            <div className="mt-2 space-y-1.5">
              {loading && (
                <p className="animate-pulse text-xs text-stone-400">Analyzing claims…</p>
              )}
              {!loading && claims && claims.length === 0 && (
                <p className="text-xs text-stone-400">
                  Claim analysis unavailable right now.
                </p>
              )}
              {!loading &&
                claims?.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22, delay: i * 0.08 }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 + i * 0.08 }}
                      className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${CONFIDENCE_STYLE[c.confidence]}`}
                    >
                      {c.confidence}
                    </motion.span>
                    <span className="text-stone-700 dark:text-stone-300">
                      {c.claim}
                    </span>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
