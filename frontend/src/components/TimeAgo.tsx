"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/time";

/**
 * Renders relative time only after mount. Computing this during SSR would
 * produce a different string than the client re-render a moment later
 * (e.g. "48m ago" vs "49m ago"), causing a hydration mismatch — so we
 * render nothing on the server and fill it in on the client instead.
 */
export default function TimeAgo({ date }: { date: string | null }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(timeAgo(date));
  }, [date]);

  return <>{label}</>;
}
