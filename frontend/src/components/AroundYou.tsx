"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { searchNews, NewsResult } from "@/lib/api";
import { timeAgo } from "@/lib/time";

// No user accounts yet, so "around you" is a fixed location rather than
// detected — swap this for real geolocation once there's a profile to store it on.
const LOCATION = "Udupi Karnataka";

export default function AroundYou() {
  const [results, setResults] = useState<NewsResult[] | null>(null);

  useEffect(() => {
    searchNews(LOCATION)
      .then((r) => setResults(r.results.slice(0, 4)))
      .catch(() => setResults([]));
  }, []);

  if (results && results.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-3 flex items-center gap-2 border-b border-stone-200 pb-2 dark:border-stone-800">
        <MapPin className="h-4 w-4 text-amber-700 dark:text-[#fbd509]" strokeWidth={2} />
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Around You
        </h2>
        <span className="text-xs text-stone-400">{LOCATION}</span>
      </div>

      {!results && (
        <p className="text-sm text-stone-400">Looking for local news…</p>
      )}

      {results && results.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="rounded-full bg-[#fbd509]/15 px-1.5 py-0.5 font-medium text-amber-700 dark:text-[#fbd509]">
                  {r.source_name}
                </span>
                {r.published_at && <span>{timeAgo(r.published_at)}</span>}
              </div>
              <p className="mt-1.5 text-sm font-medium text-stone-900 dark:text-stone-50">
                {r.title}
              </p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
