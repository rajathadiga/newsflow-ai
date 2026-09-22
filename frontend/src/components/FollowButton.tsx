"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { isFollowed, toggleFollow } from "@/lib/followedStories";

export default function FollowButton({ storyId }: { storyId: number }) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setFollowing(isFollowed(storyId));
  }, [storyId]);

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setFollowing(toggleFollow(storyId));
      }}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
        following
          ? "border-[#fbd509]/40 bg-[#fbd509]/15 text-amber-700 dark:text-[#fbd509]"
          : "border-stone-200 text-stone-500 hover:border-stone-300 dark:border-white/10 dark:text-stone-400"
      }`}
    >
      {following ? (
        <Check className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <Plus className="h-3 w-3" strokeWidth={2.5} />
      )}
      {following ? "Following" : "Follow"}
    </motion.button>
  );
}
