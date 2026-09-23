"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function FloatingAskButton() {
  return (
    <motion.button
      onClick={() => document.dispatchEvent(new CustomEvent("outside:open-ask"))}
      aria-label="Ask Outside"
      initial={{ scale: 0, rotate: -180 }}
      animate={{
        scale: 1,
        rotate: 0,
        transition: { type: "spring", stiffness: 260, damping: 14, delay: 0.4 },
      }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="group fixed right-5 bottom-20 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#fbd509] text-black shadow-lg shadow-[#fbd509]/30 sm:bottom-6"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#fbd509]/40 [animation-duration:2.5s]" />
      <Sparkles
        className="relative h-5 w-5 transition-transform duration-500 group-hover:rotate-[72deg] group-hover:scale-110"
        strokeWidth={2.25}
      />
    </motion.button>
  );
}
