"use client";

export default function LiveIndicator({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-stone-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#fbd509] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#fbd509]" />
      </span>
      LIVE · {count} stories tracked
    </div>
  );
}
