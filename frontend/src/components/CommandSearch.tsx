"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, X } from "lucide-react";
import { searchNews, SearchResponse } from "@/lib/api";
import { timeAgo } from "@/lib/time";

const EXAMPLES = [
  "What happened in India today?",
  "Why is NVIDIA trending?",
  "AI news this week",
  "What did I miss today?",
];

export default function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setData(null);
    }
  }, [open]);

  async function run(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    try {
      const result = await searchNews(q);
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#151918] shadow-2xl"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(query);
              }}
              className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5"
            >
              <Search className="h-5 w-5 shrink-0 text-stone-500" strokeWidth={2} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask Outside anything…"
                className="w-full bg-transparent text-sm text-[#ededec] outline-none placeholder:text-stone-500"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 text-stone-500 hover:text-stone-300"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              {!data && !loading && (
                <div>
                  <p className="mb-2 text-xs font-medium text-stone-500">
                    Try
                  </p>
                  <div className="space-y-1">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => run(ex)}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-stone-300 transition-colors hover:bg-white/5"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="animate-pulse space-y-2 px-1 py-4">
                  <div className="flex items-center gap-2 text-xs text-[#fbd509]">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                    Outside is connecting the dots…
                  </div>
                  <div className="h-3 w-3/4 rounded bg-white/10" />
                  <div className="h-3 w-1/2 rounded bg-white/10" />
                </div>
              )}

              {!loading && data && (
                <>
                  {data.overview && (
                    <div className="mb-3 rounded-xl border border-[#fbd509]/20 bg-[#fbd509]/5 p-3 text-sm text-[#ededec]">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#fbd509]">
                        <Sparkles className="h-3 w-3" strokeWidth={2} />
                        Outside found {data.results.length} related articles
                      </p>
                      {data.overview}
                    </div>
                  )}
                  {data.results.length === 0 ? (
                    <p className="px-1 py-4 text-center text-sm text-stone-500">
                      No live results — needs a NEWSAPI_KEY configured.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {data.results.map((r) => (
                        <a
                          key={r.url}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                        >
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <span className="text-[#fbd509]">
                              {r.source_name}
                            </span>
                            {r.published_at && (
                              <span>{timeAgo(r.published_at)}</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[#ededec]">
                            {r.title}
                          </p>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-white/10 px-4 py-2 text-[11px] text-stone-600">
              <kbd className="rounded bg-white/5 px-1.5 py-0.5">esc</kbd> to
              close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
