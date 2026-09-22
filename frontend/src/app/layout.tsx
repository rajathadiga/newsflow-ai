import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import CommandSearch from "@/components/CommandSearch";
import MobileBottomNav from "@/components/MobileBottomNav";
import FloatingAskButton from "@/components/FloatingAskButton";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outside — Stay informed. Stay offline.",
  description:
    "The important things people are talking about, without the doomscrolling.",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-stone-50 pb-16 sm:pb-0 dark:bg-[#0e1312]">
        <Header />
        {children}
        <MobileBottomNav />
        <FloatingAskButton />
        <CommandSearch />
      </body>
    </html>
  );
}
