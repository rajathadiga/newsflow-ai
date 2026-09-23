"use client";

import { motion } from "framer-motion";
import LiveIndicator from "./LiveIndicator";
import AnimatedNumber from "./AnimatedNumber";
import { springs } from "./motion";

type Chip = { category: string; label: string; chip: string; count: number };

export default function HomeHero({
  dateLabel,
  greeting,
  storyCount,
  topicCount,
  chips,
}: {
  dateLabel: string;
  greeting: string;
  storyCount: number;
  topicCount: number;
  chips: Chip[];
}) {
  const words = `${greeting}.`.split(" ");

  return (
    <div className="relative mb-10 overflow-hidden rounded-3xl">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 animate-float rounded-full bg-[#fbd509]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 animate-float-delayed rounded-full bg-[#fbd509]/10 blur-3xl" />

      <div className="relative px-1 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springs.soft}
          className="flex items-center justify-between"
        >
          <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-[#fbd509]">
            {dateLabel}
          </p>
          <LiveIndicator count={storyCount} />
        </motion.div>

        <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="mr-[0.25em] inline-block"
              initial={{ opacity: 0, y: 30, rotateX: -80 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ ...springs.bouncy, delay: 0.1 + i * 0.09 }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-2 text-sm text-stone-600 dark:text-stone-400"
        >
          Here&apos;s what&apos;s happening —{" "}
          <span className="font-medium text-stone-800 tabular-nums dark:text-stone-200">
            <AnimatedNumber value={storyCount} /> stories
          </span>{" "}
          across {topicCount} topics.
        </motion.p>

        {chips.length > 0 && (
          <motion.div
            className="mt-5 flex flex-wrap gap-2"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.07, delayChildren: 0.45 } },
            }}
          >
            {chips.map((c) => (
              <motion.a
                key={c.category}
                href={`#${c.category}`}
                variants={{
                  hidden: { opacity: 0, scale: 0.5, y: 10 },
                  show: { opacity: 1, scale: 1, y: 0, transition: springs.bouncy },
                }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.92 }}
                className={`rounded-full px-3 py-1 text-xs font-medium ${c.chip}`}
              >
                {c.label} · {c.count}
              </motion.a>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
