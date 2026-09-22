"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const KEY = "outside_last_story_count";

export default function NewSinceBanner({ count }: { count: number }) {
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const diff = count - Number(stored);
        if (diff > 0) setNewCount(diff);
      }
      localStorage.setItem(KEY, String(count));
    } catch {
      // localStorage unavailable — skip the "what's new" comparison
    }
  }, [count]);

  return (
    <AnimatePresence>
      {newCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mb-4 flex items-center gap-2 rounded-full bg-[#fbd509]/10 px-4 py-2 text-xs font-medium text-amber-700 dark:text-[#fbd509]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {newCount} new stor{newCount === 1 ? "y" : "ies"} since you were
            last here.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
