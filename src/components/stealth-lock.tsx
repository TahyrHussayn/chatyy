"use client";

import { useEffect, useRef, useState } from "react";
import { soundManager } from "@/lib/sounds";

interface StealthLockProps {
  children: React.ReactNode;
  password?: string;
}

export function StealthLock({
  children,
  password = process.env.NEXT_PUBLIC_CHAT_PASSWORD,
}: StealthLockProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [keyPulse, setKeyPulse] = useState(false);
  const bufferRef = useRef<string>("");
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check session persistence (if previously unlocked in this browser session)
    const sessionUnlocked = sessionStorage.getItem("chatyy_unlocked");
    if (sessionUnlocked === "true") {
      setIsLocked(false);
      // Focus chat input on refresh
      const input = document.querySelector(
        'input[type="text"]',
      ) as HTMLInputElement | null;
      input?.focus();
    }
  }, []);

  useEffect(() => {
    // If already unlocked, do not attach locked keyboard listeners or blur inputs
    if (!isLocked) return;
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("chatyy_unlocked") === "true"
    ) {
      return;
    }

    // Defensively blur any focused input while locked
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow browser system shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Prevent keystrokes from reaching background form fields
      e.preventDefault();
      e.stopPropagation();

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Handle Escape to reset buffer
      if (e.key === "Escape") {
        bufferRef.current = "";
        return;
      }

      // Handle Backspace
      if (e.key === "Backspace") {
        bufferRef.current = bufferRef.current.slice(0, -1);
        return;
      }

      // Capture single characters
      if (e.key.length === 1) {
        // Trigger springy keypress bounce
        setKeyPulse(true);
        if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = setTimeout(() => setKeyPulse(false), 140);

        // Append to rolling buffer
        const maxBufferLen = password ? Math.max(password.length * 2, 20) : 20;
        bufferRef.current = (bufferRef.current + e.key).slice(-maxBufferLen);

        // Only attempt match if a password has been explicitly configured
        if (password && password.trim().length > 0) {
          const target = password.trim().toLowerCase();
          const currentBuffer = bufferRef.current.toLowerCase();

          if (currentBuffer.endsWith(target)) {
            // Play satisfying mechanical unlock chime
            soundManager.playUnlock();

            // Trigger smooth simultaneous unlock transition
            setIsUnlocking(true);
            bufferRef.current = "";

            // Transition completes after 700ms
            setTimeout(() => {
              setIsLocked(false);
              setIsUnlocking(false);
              sessionStorage.setItem("chatyy_unlocked", "true");
              document.documentElement.classList.add("is-unlocked");

              // Focus chat input after unlock
              const input = document.querySelector(
                'input[type="text"]',
              ) as HTMLInputElement | null;
              if (input) {
                input.value = "";
                input.focus();
              }
            }, 700);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    };
  }, [isLocked, password]);

  const handleLock = () => {
    sessionStorage.removeItem("chatyy_unlocked");
    document.documentElement.classList.remove("is-unlocked");
    bufferRef.current = "";
    setIsUnlocking(false);
    setIsLocked(true);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-gradient-to-b from-purple-500 to-indigo-600">
      {/* Underlying Chat UI (completely static, no scale bouncing) */}
      <div
        className={`stealth-lock-content w-full h-full min-h-screen ${
          isUnlocking ? "transition-all duration-700 ease-out" : ""
        } ${
          isLocked && !isUnlocking
            ? "filter blur-lg pointer-events-none select-none opacity-50"
            : "filter-none opacity-100"
        }`}
      >
        {children}
      </div>

      {/* Floating Re-lock button (top center) */}
      <button
        type="button"
        onClick={handleLock}
        title="Lock screen (Stealth)"
        className="stealth-relock-btn fixed top-4 left-1/2 -translate-x-1/2 z-40 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white backdrop-blur-md border border-white/15 transition-colors duration-150 cursor-pointer shadow-lg active:scale-95 items-center justify-center"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          role="img"
        >
          <title>Lock Screen</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Stealth Lock Screen Overlay */}
      {isLocked && (
        <div
          className={`stealth-lock-overlay fixed inset-0 z-50 flex flex-col items-center justify-center select-none transition-all duration-700 ease-out ${
            isUnlocking
              ? "opacity-0 scale-105 backdrop-blur-none bg-transparent pointer-events-none"
              : "opacity-100 scale-100 backdrop-blur-xl bg-purple-950/10"
          }`}
        >
          {/* Frosted Glass Lock Badge */}
          <div
            className={`relative flex items-center justify-center p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl transition-all duration-300 ease-out ${
              isUnlocking
                ? "border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_30px_rgba(52,211,153,0.4)] scale-110 opacity-90"
                : keyPulse
                  ? "border-white/30 bg-white/20 shadow-2xl scale-110 -translate-y-1"
                  : "scale-100 translate-y-0"
            }`}
          >
            <svg
              className={`w-8 h-8 transition-colors duration-300 ${
                isUnlocking
                  ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.7)]"
                  : keyPulse
                    ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                    : "text-white/80"
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              role="img"
            >
              <title>Stealth Padlock</title>
              {/* Shackle */}
              <path
                className={`transition-all duration-500 origin-bottom-left ${
                  isUnlocking
                    ? "-translate-y-1.5 -rotate-12 stroke-emerald-400"
                    : "translate-y-0 stroke-current"
                }`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 10V7a5 5 0 0110 0v3"
              />
              {/* Lock Body */}
              <rect
                x="4"
                y="10"
                width="16"
                height="11"
                rx="2"
                strokeWidth="2"
                className="fill-white/10"
              />
              {/* Keyhole */}
              <circle cx="12" cy="15" r="1.2" fill="currentColor" />
              <path d="M12 16.2V17.5" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
