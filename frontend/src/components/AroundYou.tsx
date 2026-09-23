"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LocateFixed, MapPin } from "lucide-react";
import { searchNews, NewsResult } from "@/lib/api";
import { timeAgo } from "@/lib/time";
import {
  DEFAULT_LOCATION,
  SavedLocation,
  detectLocation,
  geolocationAlreadyGranted,
  loadLocation,
  manualLocation,
  saveLocation,
} from "@/lib/location";
import { Reveal, Stagger, StaggerItem, TiltCard, springs } from "./motion";
import { trackView } from "@/lib/history";

type Results = { query: string; items: NewsResult[] };

/** Saved choice first; then silent GPS if permission was granted before; else the default. */
async function initialLocation(): Promise<SavedLocation> {
  const stored = loadLocation();
  if (stored) return stored;
  if (await geolocationAlreadyGranted()) {
    try {
      const detected = await detectLocation();
      saveLocation(detected);
      return detected;
    } catch {
      // fall through to the default
    }
  }
  return DEFAULT_LOCATION;
}

export default function AroundYou() {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [picking, setPicking] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    initialLocation().then(setLocation);
  }, []);

  useEffect(() => {
    if (!location) return;
    const query = location.query;
    searchNews(query)
      .then((r) => setResults({ query, items: r.results.slice(0, 4) }))
      .catch(() => setResults({ query, items: [] }));
  }, [location]);

  function choose(loc: SavedLocation) {
    saveLocation(loc);
    setLocation(loc);
    setPicking(false);
    setError(null);
    setDraft("");
  }

  async function useMyLocation() {
    setDetecting(true);
    setError(null);
    try {
      choose(await detectLocation());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDetecting(false);
    }
  }

  const loading = !location || results?.query !== location.query;
  const items = loading ? [] : results!.items;

  return (
    <section className="mb-12">
      <Reveal className="mb-3 flex flex-wrap items-center gap-2 border-b border-stone-200 pb-2 dark:border-stone-800">
        <MapPin
          className="h-4 w-4 animate-bounce text-amber-700 [animation-iteration-count:2] dark:text-[#fbd509]"
          strokeWidth={2}
        />
        <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50">
          Around You
        </h2>
        {location && (
          <motion.button
            onClick={() => setPicking((p) => !p)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            transition={springs.bouncy}
            className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-0.5 text-xs text-stone-500 hover:border-stone-300 hover:text-stone-800 dark:border-white/10 dark:text-stone-400 dark:hover:text-stone-200"
          >
            {location.source === "gps" && (
              <LocateFixed className="h-3 w-3" strokeWidth={2} />
            )}
            {location.label}
            <motion.span animate={{ rotate: picking ? 180 : 0 }} transition={springs.soft}>
              <ChevronDown className="h-3 w-3" strokeWidth={2} />
            </motion.span>
          </motion.button>
        )}
      </Reveal>

      <AnimatePresence>
        {picking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springs.soft}
            className="overflow-hidden"
          >
            <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-stone-100 p-3 sm:flex-row sm:items-center dark:bg-white/5">
              <motion.button
                onClick={useMyLocation}
                disabled={detecting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                transition={springs.bouncy}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#fbd509] px-3.5 py-1.5 text-xs font-semibold text-black disabled:opacity-60"
              >
                <LocateFixed
                  className={`h-3.5 w-3.5 ${detecting ? "animate-spin" : ""}`}
                  strokeWidth={2}
                />
                {detecting ? "Finding you…" : "Use my location"}
              </motion.button>

              <span className="text-center text-xs text-stone-400">or</span>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draft.trim()) choose(manualLocation(draft));
                }}
                className="flex flex-1 gap-2"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a city, e.g. Mangaluru"
                  className="min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 outline-none focus:border-[#fbd509] focus:ring-2 focus:ring-[#fbd509]/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:text-stone-300"
                >
                  Set
                </button>
              </form>
            </div>
            {error && <p className="-mt-2 mb-4 px-1 text-xs text-rose-500">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <p className="animate-pulse text-sm text-stone-400">
          {location ? `Looking for news around ${location.label}…` : "Finding your area…"}
        </p>
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-stone-400">
          No local news found for {location!.label} right now.
        </p>
      )}

      {items.length > 0 && (
        <Stagger key={location!.query} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => (
            <StaggerItem key={r.url}>
              <TiltCard className="h-full rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900 dark:hover:shadow-black/40">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackView("around_you", r.title, r.url)}
                  className="block p-4"
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
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
