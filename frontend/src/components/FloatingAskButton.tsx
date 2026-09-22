"use client";

import { Sparkles } from "lucide-react";

export default function FloatingAskButton() {
  return (
    <button
      onClick={() => document.dispatchEvent(new CustomEvent("outside:open-ask"))}
      aria-label="Ask Outside"
      className="fixed right-5 bottom-20 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#fbd509] text-black shadow-lg shadow-[#fbd509]/30 transition-transform hover:scale-110 active:scale-95 sm:bottom-6"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#fbd509]/40 [animation-duration:2.5s]" />
      <Sparkles className="relative h-5 w-5" strokeWidth={2.25} />
    </button>
  );
}
