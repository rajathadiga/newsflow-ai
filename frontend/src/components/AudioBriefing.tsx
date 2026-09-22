"use client";

import { useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";

export default function AudioBriefing({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#fbd509]/30 bg-[#fbd509]/10 px-3 py-1.5 text-xs font-semibold text-[#fbd509] transition-colors hover:bg-[#fbd509]/20"
    >
      {speaking ? (
        <Square className="h-3.5 w-3.5" strokeWidth={2} />
      ) : (
        <Volume2 className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      {speaking ? "Stop" : "Listen"}
    </button>
  );
}
