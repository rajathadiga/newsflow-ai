"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Newspaper, ShieldAlert, Flame } from "lucide-react";

const NAV = [
  { href: "/", label: "Today", icon: Newspaper },
  { href: "/fomo", label: "FOMO", icon: ShieldAlert },
  { href: "/pulse", label: "Pulse", icon: Flame },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-stone-200/80 bg-white/90 px-2 py-1.5 backdrop-blur-lg sm:hidden dark:border-white/10 dark:bg-[#0e1312]/90">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 text-[11px] font-medium"
          >
            {active && (
              <motion.span
                layoutId="mobile-nav-active"
                className="absolute -top-1.5 h-1 w-6 rounded-full bg-[#fbd509]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <Icon
              className={`h-5 w-5 ${active ? "text-amber-700 dark:text-[#fbd509]" : "text-stone-400"}`}
              strokeWidth={2}
            />
            <span
              className={
                active
                  ? "text-amber-700 dark:text-[#fbd509]"
                  : "text-stone-400"
              }
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
