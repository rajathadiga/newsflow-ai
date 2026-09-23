"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Eye, History as HistoryIcon, Search, Trash2, X } from "lucide-react";
import {
  clearHistory,
  deleteHistoryEntry,
  getHistory,
  HistoryEntry,
  HistoryKind,
} from "@/lib/api";
import { HistorySource } from "@/lib/history";
import { springs } from "@/components/motion";
import { Skeleton } from "@/components/Skeleton";

type Tab = "all" | HistoryKind;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "search", label: "Searched" },
  { key: "view", label: "Seen" },
];

const SOURCE_LABEL: Record<HistorySource, string> = {
  search: "Search",
  ask: "Ask Outside",
  pulse: "Social Pulse",
  pulse_tag: "Trending tag",
  story: "Story",
  cluster: "Top development",
  around_you: "Around You",
  social_post: "Social post",
  explain: "Explained",
};

// The backend stores UTC without a "Z"; add it so the browser converts to local time.
function parseUtc(value: string) {
  return new Date(value.endsWith("Z") ? value : `${value}Z`);
}

function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function groupByDay(entries: HistoryEntry[]) {
  const groups: { label: string; items: HistoryEntry[] }[] = [];
  for (const entry of entries) {
    const label = dayLabel(parseUtc(entry.created_at));
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(entry);
    else groups.push({ label, items: [entry] });
  }
  return groups;
}

/** Where clicking an entry takes you: re-run the search, or reopen what was seen. */
function EntryAction({ entry, children }: { entry: HistoryEntry; children: React.ReactNode }) {
  const className = "block min-w-0 flex-1";
  if (entry.kind === "search") {
    if (entry.source === "pulse" || entry.source === "pulse_tag") {
      return (
        <Link href={`/pulse?q=${encodeURIComponent(entry.title)}`} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <button
        onClick={() =>
          document.dispatchEvent(
            new CustomEvent("outside:open-ask", { detail: { query: entry.title } }),
          )
        }
        className={`${className} text-left`}
      >
        {children}
      </button>
    );
  }
  if (entry.url) {
    return (
      <a href={entry.url} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return <div className={className}>{children}</div>;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    getHistory()
      .then(setEntries)
      .catch(() => setFailed(true));
  }, []);

  const all = entries ?? [];
  const visible = tab === "all" ? all : all.filter((e) => e.kind === tab);
  const counts: Record<Tab, number> = {
    all: all.length,
    search: all.filter((e) => e.kind === "search").length,
    view: all.filter((e) => e.kind === "view").length,
  };

  async function remove(id: number) {
    setEntries((prev) => prev?.filter((e) => e.id !== id) ?? null);
    await deleteHistoryEntry(id).catch(() => {});
  }

  async function clearAll() {
    setConfirmClear(false);
    setEntries([]);
    await clearHistory().catch(() => {});
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.soft}
            className="flex items-center gap-2 text-2xl font-bold text-stone-900 dark:text-stone-50"
          >
            <HistoryIcon className="h-6 w-6 text-amber-700 dark:text-[#fbd509]" strokeWidth={2} />
            History
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-1 text-sm text-stone-500 dark:text-stone-400"
          >
            Everything you&apos;ve searched for and opened. Click to pick up where you left off.
          </motion.p>
        </div>

        {all.length > 0 && (
          <AnimatePresence mode="wait" initial={false}>
            {confirmClear ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 text-xs"
              >
                <span className="text-stone-500">Clear all history?</span>
                <button
                  onClick={clearAll}
                  className="rounded-full bg-rose-500 px-3 py-1 font-semibold text-white hover:bg-rose-600"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="rounded-full px-2 py-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="clear"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1 text-xs font-medium text-stone-500 hover:border-rose-300 hover:text-rose-600 dark:border-white/10 dark:text-stone-400"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                Clear history
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>

      <div className="mt-6 inline-flex gap-0.5 rounded-full border border-stone-200 bg-stone-100/80 p-1 text-xs dark:border-white/10 dark:bg-white/5">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative rounded-full px-3 py-1.5 font-medium transition-colors ${
                active
                  ? "text-black"
                  : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="history-tab-pill"
                  className="absolute inset-0 rounded-full bg-[#fbd509]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                />
              )}
              <span className="relative">
                {t.label} <span className="opacity-60">{counts[t.key]}</span>
              </span>
            </button>
          );
        })}
      </div>

      {!entries && !failed && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {failed && (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700">
          Couldn&apos;t load history — is the backend running?
        </div>
      )}

      {entries && visible.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700"
        >
          {tab === "search"
            ? "No searches yet. Try the search bar, ⌘K, or Social Pulse."
            : tab === "view"
              ? "Nothing opened yet. Stories and posts you click will show up here."
              : "Nothing here yet — what you search and read will show up here."}
        </motion.div>
      )}

      <div className="mt-6 space-y-8">
        {groupByDay(visible).map((group) => (
          <section key={group.label}>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-stone-400 uppercase">
              {group.label}
            </h2>
            <div className="space-y-2">
              <AnimatePresence initial={true}>
                {group.items.map((entry, i) => {
                  const Icon = entry.kind === "search" ? Search : Eye;
                  const clickable = entry.kind === "search" || !!entry.url;
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { ...springs.soft, delay: Math.min(i, 10) * 0.03 },
                      }}
                      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                      whileHover={clickable ? { x: 4 } : undefined}
                      transition={springs.soft}
                      className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 dark:bg-white/5 dark:text-stone-400">
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <EntryAction entry={entry}>
                        <p className="truncate text-sm font-medium text-stone-900 transition-colors group-hover:text-amber-700 dark:text-stone-50 dark:group-hover:text-[#fbd509]">
                          {entry.title}
                        </p>
                        <p className="text-xs text-stone-400">
                          {SOURCE_LABEL[entry.source as HistorySource] ?? entry.source} ·{" "}
                          {parseUtc(entry.created_at).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </EntryAction>
                      {clickable && (
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#fbd509]"
                          strokeWidth={2}
                        />
                      )}
                      <button
                        onClick={() => remove(entry.id)}
                        aria-label="Remove from history"
                        className="shrink-0 rounded-full p-1 text-stone-300 transition-colors hover:bg-stone-100 hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-white/5"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
