"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { buildSocialLinks } from "@/lib/socialLinks";

function PulseSearch() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [submitted, setSubmitted] = useState(params.get("q") ?? "");

  const links = submitted ? buildSocialLinks(submitted) : [];

  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Social Pulse
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          See what people are saying about a topic — across Instagram, X,
          Reddit, YouTube and news, without opening any of those apps
          yourself.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(query);
          }}
          className="mt-6 flex gap-2"
        >
          <div className="relative flex-1">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
              strokeWidth={2}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a topic, e.g. 'Karnataka rains'"
              className="w-full rounded-full border border-stone-300 bg-white py-2.5 pr-4 pl-10 text-sm text-stone-900 outline-none transition-colors focus:border-[#fbd509] focus:ring-2 focus:ring-[#fbd509]/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-[#fbd509]"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-[#fbd509] hover:brightness-95 px-5 py-2.5 text-sm font-bold text-black shadow-sm shadow-[#fbd509]/30 transition-transform hover:scale-105"
          >
            Search
          </button>
        </form>
      </div>

      {submitted && (
        <div className="mt-8">
          <p className="mb-3 text-sm text-stone-500">
            Results for <span className="font-medium">“{submitted}”</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex animate-fade-in-up items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700"
              >
                <div>
                  <p className="font-semibold text-stone-900 transition-colors group-hover:text-amber-700 dark:text-stone-50 dark:group-hover:text-[#fbd509]">
                    {link.emoji} {link.name}
                  </p>
                  <p className="text-sm text-stone-500">{link.description}</p>
                </div>
                <span className="text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#fbd509]">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default function PulsePage() {
  return (
    <Suspense fallback={null}>
      <PulseSearch />
    </Suspense>
  );
}
