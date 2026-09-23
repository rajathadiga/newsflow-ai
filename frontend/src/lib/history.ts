import { addHistory } from "./api";

// Where an entry came from — also used by the History page for labels and "open again".
export type HistorySource =
  | "search" // header search box
  | "ask" // ⌘K / floating Ask
  | "pulse" // Social Pulse search
  | "pulse_tag" // clicked a trending hashtag
  | "story"
  | "cluster"
  | "around_you"
  | "social_post"
  | "explain";

// Fire-and-forget: history is nice to have, so a failed save must never break the action.
export function trackSearch(source: HistorySource, query: string) {
  const title = query.trim();
  if (!title) return;
  addHistory({ kind: "search", source, title, url: null }).catch(() => {});
}

export function trackView(source: HistorySource, title: string, url: string | null) {
  if (!title.trim()) return;
  addHistory({ kind: "view", source, title: title.trim().slice(0, 500), url }).catch(() => {});
}
