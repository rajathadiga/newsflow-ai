import Link from "next/link";
import { getFomoShield } from "@/lib/api";

export default async function FomoShieldPage() {
  const data = await getFomoShield(24);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Back to Today
      </Link>

      <div className="mt-4 rounded-2xl border border-zinc-200 p-6">
        <h1 className="text-xl font-bold">🛡️ FOMO Shield</h1>
        <p className="mt-1 text-sm text-zinc-500">
          You were away for {data.hours_away} hours.
        </p>

        <p className="mt-4 text-sm">
          We found <strong>{data.total_found}</strong> pieces of content.
          You only need to know:
        </p>

        <ul className="mt-3 space-y-1 text-sm">
          <li>🔴 {data.high} major events</li>
          <li>🟡 {data.medium} notable developments</li>
          <li>🟢 {data.low} interesting stories</li>
        </ul>

        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Estimated catch-up time
          </p>
          <p className="text-3xl font-bold">
            {data.estimated_catchup_minutes} min
          </p>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Top stories</h2>
      <ul className="space-y-4">
        {data.top_stories.map((story) => (
          <li key={story.id} className="border-b border-zinc-200 pb-4">
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
            >
              {story.title}
            </a>
            {story.summary && (
              <p className="mt-1 text-sm text-zinc-600">{story.summary}</p>
            )}
            <p className="mt-1 text-xs text-zinc-400">
              {story.category} · {story.source_name}
            </p>
          </li>
        ))}
      </ul>

      {data.total_found === 0 && (
        <p className="text-zinc-500">You&apos;re caught up ✓</p>
      )}
    </main>
  );
}
