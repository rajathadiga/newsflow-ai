"use client";

import { motion } from "framer-motion";

// Next.js re-mounts template.tsx on every navigation, so this animation
// plays each time you switch between Today / FOMO Shield / Social Pulse.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      {children}
    </motion.div>
  );
}
