"use client";

import { motion } from "framer-motion";
import { ArrowBigUp, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { SocialPlatform, SocialPost } from "@/lib/api";
import TimeAgo from "./TimeAgo";
import { springs } from "./motion";
import { trackView } from "@/lib/history";

export const PLATFORM_META: Record<SocialPlatform, { label: string; emoji: string }> = {
  reddit: { label: "Reddit", emoji: "👽" },
  mastodon: { label: "Mastodon", emoji: "🐘" },
  hackernews: { label: "Hacker News", emoji: "🟧" },
};

function compact(n: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

export default function SocialPostCard({ post }: { post: SocialPost }) {
  const meta = PLATFORM_META[post.platform];
  // Reddit/HN count upvotes; Mastodon counts favourites.
  const LikeIcon = post.platform === "mastodon" ? Heart : ArrowBigUp;

  return (
    <motion.a
      layout
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackView("social_post", post.title || post.text?.slice(0, 140) || post.author, post.url)
      }
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={springs.soft}
      className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-[border-color,box-shadow] hover:border-stone-300 hover:shadow-xl hover:shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700 dark:hover:shadow-black/40"
    >
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          {post.avatar ? (
            // Remote avatars come from many hosts, so a plain <img> is simpler than next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.avatar}
              alt=""
              loading="lazy"
              className="h-8 w-8 shrink-0 rounded-full bg-stone-200 object-cover dark:bg-stone-800"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-base dark:bg-white/5">
              {meta.emoji}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-50">
              {post.author}
            </p>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">
              {post.community ?? meta.label}
              {post.published_at && (
                <>
                  {" · "}
                  <TimeAgo date={post.published_at} />
                </>
              )}
            </p>
          </div>
          <span
            title={meta.label}
            className="shrink-0 text-base transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-12"
          >
            {meta.emoji}
          </span>
        </div>

        {post.title && (
          <h3 className="mt-3 font-semibold leading-snug text-stone-900 transition-colors group-hover:text-amber-700 dark:text-stone-50 dark:group-hover:text-[#fbd509]">
            {post.title}
          </h3>
        )}
        {post.text && (
          <p
            className={`mt-2 text-sm whitespace-pre-line text-stone-600 dark:text-stone-400 ${post.title ? "line-clamp-3" : "line-clamp-6"}`}
          >
            {post.text}
          </p>
        )}
      </div>

      {post.image && (
        <div className="overflow-hidden bg-stone-100 dark:bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt=""
            loading="lazy"
            onError={(e) => (e.currentTarget.parentElement!.style.display = "none")}
            className="max-h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      {(post.likes != null || post.comments != null || post.shares != null) && (
        <div className="flex items-center gap-4 border-t border-stone-100 px-4 py-2.5 text-xs text-stone-500 dark:border-white/5 dark:text-stone-400">
          {post.likes != null && (
            <span className="inline-flex items-center gap-1">
              <LikeIcon className="h-3.5 w-3.5" strokeWidth={2} />
              {compact(post.likes)}
            </span>
          )}
          {post.comments != null && (
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
              {compact(post.comments)}
            </span>
          )}
          {post.shares != null && (
            <span className="inline-flex items-center gap-1">
              <Repeat2 className="h-3.5 w-3.5" strokeWidth={2} />
              {compact(post.shares)}
            </span>
          )}
        </div>
      )}
    </motion.a>
  );
}
