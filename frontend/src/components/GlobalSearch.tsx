"use client";

import { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, X, Sparkles } from "lucide-react";
import { searchNews, SearchResponse } from "@/lib/api";
import { timeAgo } from "@/lib/time";
import MicButton from "./MicButton";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  async function runSearchFor(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const result = await searchNews(text);
      setData(result);
    } catch {
      setError("Search failed — is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    runSearchFor(query);
  }

  function onVoiceResult(text: string) {
    setQuery(text);
    runSearchFor(text);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <form onSubmit={runSearch}>
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400"
            strokeWidth={2}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => data && setOpen(true)}
            placeholder="Ask Outside anything..."
            className="w-full rounded-full border border-stone-200 bg-stone-100/80 py-1.5 pr-20 pl-9 text-sm text-stone-900 outline-none transition-colors focus:border-[#fbd509] focus:bg-white focus:ring-2 focus:ring-[#fbd509]/30 dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:focus:bg-[#0e1312] dark:focus:ring-[#fbd509]/20"
          />
          <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-2">
            <MicButton onResult={onVoiceResult} />
            {!query && (
              <kbd className="pointer-events-none rounded border border-stone-300 px-1.5 py-0.5 text-[10px] text-stone-400 dark:border-white/10">
                ⌘K
              </kbd>
            )}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setData(null);
                  setOpen(false);
                }}
                aria-label="Clear search"
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </form>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-2 max-h-[70vh] w-[28rem] max-w-[90vw] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-[#0e1312]">
          {loading && (
            <p className="px-2 py-4 text-center text-sm text-stone-400">
              Searching…
            </p>
          )}

          {error && (
            <p className="px-2 py-4 text-center text-sm text-rose-500">
              {error}
            </p>
          )}

          {!loading && data && (
            <>
              {data.refined_query !== data.query && (
                <p className="px-2 text-xs text-stone-400">
                  Searched as{" "}
                  <span className="font-medium text-stone-500 dark:text-stone-300">
                    &quot;{data.refined_query}&quot;
                  </span>
                </p>
              )}

              {data.overview && (
                <div className="mx-1 mt-2 rounded-xl border border-[#fbd509]/30 bg-[#fbd509]/10 p-3 text-sm text-amber-900 dark:border-[#fbd509]/20 dark:bg-[#fbd509]/5 dark:text-[#ededec]">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-[#fbd509]">
                    <Sparkles className="h-3 w-3" strokeWidth={2} />
                    AI overview
                  </p>
                  {data.overview}
                </div>
              )}

              {data.results.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-stone-500">
                  {data.configured ? (
                    <>
                      No recent articles found for &quot;{data.refined_query}
                      &quot;. Try a different phrasing or a broader term.
                    </>
                  ) : (
                    <>
                      Live search needs a{" "}
                      <code className="rounded bg-stone-200 px-1 dark:bg-stone-800">
                        NEWSAPI_KEY
                      </code>{" "}
                      set in <code>backend/.env</code>.
                    </>
                  )}
                </p>
              ) : (
                <div className="mt-2 space-y-1">
                  {data.results.map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl px-2 py-2 transition-colors hover:bg-stone-100 dark:hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <span className="rounded-full bg-[#fbd509]/15 px-1.5 py-0.5 font-medium text-amber-700 dark:text-[#fbd509]">
                          {r.source_name}
                        </span>
                        {r.published_at && <span>{timeAgo(r.published_at)}</span>}
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-stone-900 dark:text-stone-50">
                        {r.title}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
