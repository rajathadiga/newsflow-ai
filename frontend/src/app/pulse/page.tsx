"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Flame, Hash, RefreshCw, Search as SearchIcon } from "lucide-react";
import {
  getSocial,
  getTrending,
  SocialPlatform,
  SocialPost,
  SocialResponse,
  TrendingResponse,
} from "@/lib/api";
import { buildSocialLinks } from "@/lib/socialLinks";
import { timeAgo } from "@/lib/time";
import { springs } from "@/components/motion";
import { StoryCardSkeleton } from "@/components/Skeleton";
import SocialPostCard, { PLATFORM_META } from "@/components/SocialPostCard";
import { trackSearch } from "@/lib/history";

type Filter = "all" | SocialPlatform;

const PLATFORMS = Object.keys(PLATFORM_META) as SocialPlatform[];

// Platforms we can't pull posts from (no free public API) — shown as outbound links instead.
const LINK_ONLY = ["X (Twitter)", "Instagram", "YouTube", "Google News"];

const SOURCE_PROBLEM: Record<string, string> = {
  rate_limited: "is busy right now — try again in a minute",
  error: "couldn't be reached",
};

// Matches the backend cache, so every poll can bring fresh posts.
const REFRESH_MS = 5 * 60 * 1000;

function SkeletonGrid() {
  return (
    <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Platform filter tabs + animated grid of posts. Shared by search results and trending. */
function PostFeed({
  posts,
  sources,
  heading,
}: {
  posts: SocialPost[];
  sources: Partial<Record<SocialPlatform, string>>;
  heading: React.ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = filter === "all" ? posts : posts.filter((p) => p.platform === filter);
  const counts = Object.fromEntries(
    PLATFORMS.map((p) => [p, posts.filter((post) => post.platform === p).length]),
  ) as Record<SocialPlatform, number>;
  const problems = PLATFORMS.filter((p) => sources[p] && SOURCE_PROBLEM[sources[p]!]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {heading}
        {posts.length > 0 && (
          <div className="flex gap-0.5 overflow-x-auto rounded-full border border-stone-200 bg-stone-100/80 p-1 text-xs dark:border-white/10 dark:bg-white/5">
            {(["all", ...PLATFORMS] as Filter[]).map((f) => {
              const count = f === "all" ? posts.length : counts[f];
              const active = filter === f;
              return (
                <button
                  key={f}
                  disabled={count === 0}
                  onClick={() => setFilter(f)}
                  className={`relative shrink-0 rounded-full px-3 py-1.5 font-medium transition-colors disabled:opacity-40 ${
                    active
                      ? "text-black"
                      : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="pulse-filter-pill"
                      className="absolute inset-0 rounded-full bg-[#fbd509]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                    />
                  )}
                  <span className="relative">
                    {f === "all" ? "All" : `${PLATFORM_META[f].emoji} ${PLATFORM_META[f].label}`}{" "}
                    <span className="opacity-60">{count}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {problems.length > 0 && (
        <p className="mb-4 text-xs text-stone-400">
          {problems.map((p) => `${PLATFORM_META[p].label} ${SOURCE_PROBLEM[sources[p]!]}`).join(" · ")}.
        </p>
      )}

      <motion.div layout className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {visible.map((post) => (
            <SocialPostCard key={post.id} post={post} />
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

/** Fetches trending posts now and every REFRESH_MS; pauses while the tab is hidden. */
function useTrending() {
  const [data, setData] = useState<TrendingResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const lastFetch = useRef(0);
  const knownIds = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = await getTrending();
      // Count posts we haven't shown before (skip on the very first load).
      if (knownIds.current.size > 0) {
        const fresh = next.posts.filter((p) => !knownIds.current.has(p.id)).length;
        if (fresh > 0) setNewCount(fresh);
      }
      knownIds.current = new Set(next.posts.map((p) => p.id));
      setData(next);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      lastFetch.current = Date.now();
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (Date.now() - lastFetch.current > REFRESH_MS) refresh();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);
    // Coming back to a tab that's been hidden a while — catch up immediately.
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastFetch.current > REFRESH_MS) {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // Hide the "N new posts" pill after a few seconds.
  useEffect(() => {
    if (!newCount) return;
    const t = setTimeout(() => setNewCount(0), 5000);
    return () => clearTimeout(t);
  }, [newCount]);

  return { data, failed, refreshing, newCount, refresh };
}

/** Re-renders every 30s so "Updated 3m ago" stays current. */
function useTick(ms = 30000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

function TrendingView({ onPickTag }: { onPickTag: (tag: string) => void }) {
  const { data, failed, refreshing, newCount, refresh } = useTrending();
  useTick();

  if (!data && failed) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700">
        Couldn&apos;t load trending posts — is the backend running?
      </div>
    );
  }
  if (!data) return <SkeletonGrid />;

  return (
    <>
      {data.tags.length > 0 && (
        <motion.div
          className="mb-6 flex flex-wrap items-center gap-2"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          <span className="mr-1 text-xs font-semibold tracking-wide text-stone-400 uppercase">
            Trending on Mastodon
          </span>
          {data.tags.map((tag) => (
            <motion.button
              key={tag}
              onClick={() => onPickTag(tag)}
              variants={{
                hidden: { opacity: 0, scale: 0.6 },
                show: { opacity: 1, scale: 1, transition: springs.bouncy },
              }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.92 }}
              className="inline-flex items-center gap-0.5 rounded-full bg-[#fbd509]/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-[#fbd509]"
            >
              <Hash className="h-3 w-3" strokeWidth={2.5} />
              {tag}
            </motion.button>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {newCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={springs.bouncy}
            className="mb-4 flex justify-center"
          >
            <span className="rounded-full bg-[#fbd509] px-4 py-1.5 text-xs font-bold text-black shadow-lg shadow-[#fbd509]/30">
              ✨ {newCount} new post{newCount === 1 ? "" : "s"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <PostFeed
        posts={data.posts}
        sources={data.sources}
        heading={
          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-stone-900 dark:text-stone-50">
              <Flame className="h-4 w-4 text-amber-700 dark:text-[#fbd509]" strokeWidth={2} />
              Trending now
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-stone-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#fbd509] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#fbd509]" />
              </span>
              Updated {timeAgo(data.updated_at)} · refreshes every 5 min
            </span>
            <motion.button
              onClick={refresh}
              disabled={refreshing}
              aria-label="Refresh trending"
              whileTap={{ scale: 0.85 }}
              className="rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                strokeWidth={2}
              />
            </motion.button>
          </div>
        }
      />
    </>
  );
}

type Result = { query: string; data: SocialResponse | null };

function SearchView({ query }: { query: string }) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSocial(query)
      .then((data) => !cancelled && setResult({ query, data }))
      .catch(() => !cancelled && setResult({ query, data: null }));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const loading = result?.query !== query;
  const data = loading ? null : result!.data;
  const links = buildSocialLinks(query).filter((l) => LINK_ONLY.includes(l.name));

  return (
    <>
      {loading && (
        <>
          <p className="mb-4 text-sm text-stone-500">
            Listening for <span className="font-medium text-stone-800 dark:text-stone-200">“{query}”</span>
          </p>
          <SkeletonGrid />
        </>
      )}

      {!loading && !data && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700">
          Couldn&apos;t reach the backend — is it running?
        </div>
      )}

      {data && (
        <PostFeed
          key={query}
          posts={data.posts}
          sources={data.sources}
          heading={
            <p className="text-sm text-stone-500">
              {data.posts.length} posts about{" "}
              <span className="font-medium text-stone-800 dark:text-stone-200">“{query}”</span>
            </p>
          }
        />
      )}

      {data && data.posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700">
          No public posts found. Try a broader topic or fewer words.
        </div>
      )}

      <div className="mt-10 border-t border-stone-200 pt-5 dark:border-stone-800">
        <p className="mb-3 text-xs font-semibold tracking-wide text-stone-400 uppercase">
          Keep looking on
        </p>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <motion.a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={springs.bouncy}
              className="group inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300"
            >
              {link.emoji} {link.name}
              <span className="text-stone-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#fbd509]">
                ↗
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </>
  );
}

function PulsePage() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [submitted, setSubmitted] = useState(params.get("q") ?? "");

  function search(q: string, source: "pulse" | "pulse_tag" = "pulse") {
    setQuery(q);
    setSubmitted(q.trim());
    trackSearch(source, q);
  }

  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springs.soft}
          className="text-2xl font-bold text-stone-900 dark:text-stone-50"
        >
          Social Pulse
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-1 text-sm text-stone-500 dark:text-stone-400"
        >
          What people are talking about right now on Reddit, Mastodon and
          Hacker News — or search any topic.
        </motion.p>

        <motion.form
          onSubmit={(e) => {
            e.preventDefault();
            search(query);
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.soft, delay: 0.2 }}
          className="mt-6 flex gap-2"
        >
          <div className="group relative flex-1">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400 transition-transform duration-300 group-focus-within:scale-110 group-focus-within:-rotate-12"
              strokeWidth={2}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a topic, e.g. 'Karnataka rains'"
              className="w-full rounded-full border border-stone-300 bg-white py-2.5 pr-4 pl-10 text-sm text-stone-900 outline-none transition-colors focus:border-[#fbd509] focus:ring-2 focus:ring-[#fbd509]/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-[#fbd509]"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={springs.bouncy}
            className="rounded-full bg-[#fbd509] hover:brightness-95 px-5 py-2.5 text-sm font-bold text-black shadow-sm shadow-[#fbd509]/30"
          >
            Search
          </motion.button>
        </motion.form>
      </div>

      <div className="mt-8">
        {submitted ? (
          <>
            <motion.button
              onClick={() => search("")}
              whileHover={{ x: -3 }}
              className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-amber-700 dark:hover:text-[#fbd509]"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              Back to trending
            </motion.button>
            <SearchView query={submitted} />
          </>
        ) : (
          <TrendingView onPickTag={(tag) => search(tag, "pulse_tag")} />
        )}
      </div>
    </main>
  );
}

export default function PulsePageWrapper() {
  return (
    <Suspense fallback={null}>
      <PulsePage />
    </Suspense>
  );
}
