const KEY = "outside_last_visit";

/** Returns hours since the last recorded visit (default 24 if none/unavailable),
 * then stamps "now" as the new last-visit time for next time. Client-only.
 */
export function getHoursSinceLastVisitAndStamp(): number {
  try {
    const stored = localStorage.getItem(KEY);
    const now = Date.now();
    localStorage.setItem(KEY, String(now));
    if (!stored) return 24;
    const hours = (now - Number(stored)) / (1000 * 60 * 60);
    return Math.max(0.1, Math.min(hours, 24 * 14)); // clamp: 6min .. 14 days
  } catch {
    return 24;
  }
}
