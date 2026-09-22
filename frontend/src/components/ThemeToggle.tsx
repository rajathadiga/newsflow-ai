"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable (e.g. private browsing) — theme just won't persist
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light/dark theme"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-amber-500/10 hover:text-amber-700 dark:text-stone-400 dark:hover:text-[#fbd509]"
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300" strokeWidth={2} />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300" strokeWidth={2} />
      )}
    </button>
  );
}
