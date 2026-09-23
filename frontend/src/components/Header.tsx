"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, Newspaper, ShieldAlert, Flame, History } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import GlobalSearch from "./GlobalSearch";
import ScrollProgress from "./ScrollProgress";

const NAV = [
  { href: "/", label: "Today", icon: Newspaper },
  { href: "/fomo", label: "FOMO Shield", icon: ShieldAlert },
  { href: "/pulse", label: "Social Pulse", icon: Flame },
  { href: "/history", label: "History", icon: History },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-white/70 backdrop-blur-lg dark:border-white/10 dark:bg-[#0e1312]/80">
      <div className="mx-auto flex max-w-[1680px] items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <motion.span
            whileHover={{ rotate: 360, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fbd509] text-black"
          >
            <Compass className="h-4.5 w-4.5" strokeWidth={2.5} />
          </motion.span>
          <span className="hidden items-baseline gap-2 lg:flex">
            <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-[#ededec]">
              Outside
            </span>
          </span>
        </Link>

        <GlobalSearch />

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-full border border-stone-200 bg-stone-100/80 p-1 text-sm dark:border-white/10 dark:bg-white/5">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 font-medium transition-colors sm:px-3 ${
                    active
                      ? "text-black"
                      : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-[#fbd509]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <motion.span
                    className="relative z-10"
                    whileHover={{ rotate: [0, -14, 12, -6, 0], scale: 1.15 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                  </motion.span>
                  <span className="relative z-10 hidden sm:inline">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
      <ScrollProgress />
    </header>
  );
}
