"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

// The Web Speech API has no official TS lib types yet, hence the `any`s.
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
};

export default function MicButton({
  onResult,
  className = "",
}: {
  onResult: (text: string) => void;
  className?: string;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const Ctor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Ctor) return;

    setSupported(true);
    const recognition: SpeechRecognitionInstance = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      onResult(e.results[0][0].transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      recognitionRef.current?.start();
      setListening(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Stop voice search" : "Search by voice"}
      title={listening ? "Listening…" : "Search by voice"}
      className={`flex shrink-0 items-center justify-center transition-colors ${
        listening
          ? "text-rose-500"
          : "text-stone-400 hover:text-amber-700 dark:hover:text-[#fbd509]"
      } ${className}`}
    >
      <Mic
        className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`}
        strokeWidth={2}
      />
    </button>
  );
}
