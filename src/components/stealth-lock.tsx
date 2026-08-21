"use client";

import { useEffect, useRef, useState } from "react";
import {
  checkStealthStatusAction,
  verifyStealthPasswordAction,
} from "@/app/actions";
import { soundManager } from "@/lib/sounds";

interface StealthLockProps {
  children: React.ReactNode;
  password?: string;
  requiresPassword?: boolean;
  passwordHash?: string;
  salt?: string;
  passwordLength?: number;
}

async function sha256Hex(text: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return "";
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function StealthLock({
  children,
  password,
  requiresPassword,
  passwordHash,
  salt,
  passwordLength,
}: StealthLockProps) {
  // If explicitly told requiresPassword is false, start unlocked with zero delay
  const [isLocked, setIsLocked] = useState(() => {
    if (requiresPassword === false) return false;
    if (password !== undefined && (!password || password.trim().length === 0)) {
      return false;
    }
    return true;
  });
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isError, setIsError] = useState(false);
  const [keyPulse, setKeyPulse] = useState(false);
  const [cachedHash, setCachedHash] = useState<string | undefined>(
    passwordHash,
  );
  const [cachedSalt, setCachedSalt] = useState<string | undefined>(salt);
  const [cachedLength, setCachedLength] = useState<number | undefined>(
    passwordLength,
  );
  const bufferRef = useRef<string>("");
  const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Full-screen transparent input ensures direct tap opens virtual keyboard on iOS/Android
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (passwordHash) setCachedHash(passwordHash);
    if (salt) setCachedSalt(salt);
    if (passwordLength) setCachedLength(passwordLength);
  }, [passwordHash, salt, passwordLength]);

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
      return;
    }

    if (password !== undefined) {
      if (!password || password.trim().length === 0) {
        setIsLocked(false);
      }
      return;
    }

    if (requiresPassword !== undefined) {
      if (!requiresPassword) {
        setIsLocked(false);
      }
      return;
    }

    // Fallback if requiresPassword was not provided via props
    checkStealthStatusAction().then((status) => {
      if (!status.requiresPassword) {
        setIsLocked(false);
      } else {
        if (status.passwordHash) setCachedHash(status.passwordHash);
        if (status.salt) setCachedSalt(status.salt);
        if (status.passwordLength) setCachedLength(status.passwordLength);
      }
    });
  }, [password, requiresPassword]);

  useEffect(() => {
    // If already unlocked, do not attach locked keyboard listeners or blur inputs
    if (!isLocked) return;
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("chatyy_unlocked") === "true"
    ) {
      return;
    }

    // Auto-focus on desktop / supported devices
    const focusTimer = setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 50);

    const triggerErrorAndClear = () => {
      if (isUnlocking) return;
      setIsError(true);
      soundManager.playError();
      bufferRef.current = "";
      if (hiddenInputRef.current) hiddenInputRef.current.value = "";

      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setIsError(false);
      }, 400);
    };

    const unlockSuccess = () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (idleResetTimeoutRef.current)
        clearTimeout(idleResetTimeoutRef.current);
      setIsError(false);

      // Play satisfying mechanical unlock chime
      soundManager.playUnlock();

      // Trigger snappy unlock transition
      setIsUnlocking(true);
      bufferRef.current = "";
      if (hiddenInputRef.current) hiddenInputRef.current.value = "";

      // Focus input early during transition so user can type immediately
      setTimeout(() => {
        const input = document.querySelector(
          'input[type="text"]',
        ) as HTMLInputElement | null;
        if (input) {
          input.value = "";
          input.focus();
        }
      }, 100);

      // Transition completes snappily in 200ms
      setTimeout(() => {
        setIsLocked(false);
        setIsUnlocking(false);
        sessionStorage.setItem("chatyy_unlocked", "true");
        document.documentElement.classList.add("is-unlocked");

        const input = document.querySelector(
          'input[type="text"]',
        ) as HTMLInputElement | null;
        if (input) {
          input.focus();
        }
      }, 200);
    };

    // Shared check logic — works for physical keyboard typing, virtual typing, and Enter key
    const checkBuffer = (currentBuffer: string, forceErrorOnFail = false) => {
      if (!currentBuffer || currentBuffer.length === 0) return;

      const targetLength =
        password?.trim().length || cachedLength || passwordLength || 0;

      // 1. Direct explicit password match (0ms)
      if (password && password.trim().length > 0) {
        const target = password.trim().toLowerCase();
        if (currentBuffer.toLowerCase().endsWith(target)) {
          unlockSuccess();
          return;
        }
        if (
          forceErrorOnFail ||
          (targetLength > 0 && currentBuffer.length >= targetLength)
        ) {
          if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
          errorTimeoutRef.current = setTimeout(triggerErrorAndClear, 300);
        }
        return;
      }

      // 2. Instant client-side cryptographic hash verification (0ms network latency)
      if (cachedHash && cachedSalt) {
        const bufferLower = currentBuffer.toLowerCase();
        const candidates: string[] = [];
        for (let len = 1; len <= bufferLower.length; len++) {
          candidates.push(bufferLower.slice(-len));
        }

        Promise.all(
          candidates.map((cand) => sha256Hex(cachedSalt + cand)),
        ).then((hashes) => {
          if (hashes.includes(cachedHash) && !isUnlocking) {
            unlockSuccess();
          } else if (
            forceErrorOnFail ||
            (targetLength > 0 &&
              currentBuffer.length >= targetLength &&
              !isUnlocking)
          ) {
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(triggerErrorAndClear, 300);
          }
        });
        return;
      }

      // 3. Fallback server action verification
      if (password === undefined) {
        verifyStealthPasswordAction(currentBuffer).then((res) => {
          if (res.success && !isUnlocking) {
            unlockSuccess();
          } else if (
            forceErrorOnFail ||
            (targetLength > 0 &&
              currentBuffer.length >= targetLength &&
              !isUnlocking)
          ) {
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(triggerErrorAndClear, 300);
          }
        });
      }
    };

    // ── Desktop physical keyboard listener ─────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isUnlocking) return;

      // Handle Enter key on either physical or virtual keyboard
      if (e.key === "Enter") {
        e.preventDefault();
        checkBuffer(bufferRef.current, true);
        return;
      }

      // If hidden input itself handled the character, let its input listener sync
      if (e.target === hiddenInputRef.current) return;

      // Prevent keystrokes from leaking
      e.preventDefault();
      e.stopPropagation();

      // Handle Escape to reset buffer
      if (e.key === "Escape") {
        bufferRef.current = "";
        if (hiddenInputRef.current) hiddenInputRef.current.value = "";
        setIsError(false);
        return;
      }

      // Handle Backspace
      if (e.key === "Backspace") {
        bufferRef.current = bufferRef.current.slice(0, -1);
        if (hiddenInputRef.current) hiddenInputRef.current.value = bufferRef.current;
        return;
      }

      // Capture single characters
      if (e.key.length === 1) {
        setKeyPulse(true);
        if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = setTimeout(() => setKeyPulse(false), 140);

        if (idleResetTimeoutRef.current)
          clearTimeout(idleResetTimeoutRef.current);
        idleResetTimeoutRef.current = setTimeout(() => {
          bufferRef.current = "";
          if (hiddenInputRef.current) hiddenInputRef.current.value = "";
        }, 1500);

        bufferRef.current = (bufferRef.current + e.key).slice(-40);
        if (hiddenInputRef.current) hiddenInputRef.current.value = bufferRef.current;
        checkBuffer(bufferRef.current);
      }
    };

    // ── Mobile & touch virtual keyboard input event ───────────────────────
    const handleHiddenInput = () => {
      const el = hiddenInputRef.current;
      if (!el || isUnlocking) return;

      const val = el.value;

      setKeyPulse(true);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = setTimeout(() => setKeyPulse(false), 140);

      if (idleResetTimeoutRef.current)
        clearTimeout(idleResetTimeoutRef.current);
      idleResetTimeoutRef.current = setTimeout(() => {
        bufferRef.current = "";
        if (el) el.value = "";
      }, 1500);

      bufferRef.current = val.slice(-40);
      checkBuffer(bufferRef.current);
    };

    const hiddenEl = hiddenInputRef.current;
    hiddenEl?.addEventListener("input", handleHiddenInput);
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      hiddenEl?.removeEventListener("input", handleHiddenInput);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (idleResetTimeoutRef.current)
        clearTimeout(idleResetTimeoutRef.current);
    };
  }, [
    isLocked,
    password,
    isUnlocking,
    cachedHash,
    cachedSalt,
    cachedLength,
    passwordLength,
  ]);

  const handleLock = () => {
    sessionStorage.removeItem("chatyy_unlocked");
    document.documentElement.classList.remove("is-unlocked");
    bufferRef.current = "";
    if (hiddenInputRef.current) hiddenInputRef.current.value = "";
    setIsUnlocking(false);
    setIsError(false);
    setIsLocked(true);
    setTimeout(() => hiddenInputRef.current?.focus(), 50);
  };

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-gradient-to-b from-purple-500 to-indigo-600">
      {/* Underlying Chat UI (completely static, no scale bouncing) */}
      <div
        className={`stealth-lock-content w-full h-full min-h-screen ${
          isUnlocking ? "transition-all duration-200 ease-out" : ""
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
          className={`stealth-lock-overlay fixed inset-0 z-50 flex flex-col items-center justify-center select-none transition-all duration-200 ease-out ${
            isUnlocking
              ? "opacity-0 scale-105 backdrop-blur-none bg-transparent pointer-events-none"
              : "opacity-100 scale-100 backdrop-blur-xl bg-purple-950/10"
          }`}
        >
          {/* Full-screen invisible input — direct tap anywhere on screen opens native keyboard on mobile */}
          <input
            ref={hiddenInputRef}
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-label="Stealth Lock Password"
            className="fixed inset-0 w-full h-full opacity-0 z-10 cursor-pointer caret-transparent"
            style={{
              fontSize: "16px",
            }}
          />

          {/* Frosted Glass Lock Badge */}
          <div
            className={`relative z-20 flex flex-col items-center justify-center p-5 rounded-2xl backdrop-blur-md border shadow-xl transition-all duration-200 ease-out pointer-events-none ${
              isUnlocking
                ? "border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_30px_rgba(52,211,153,0.4)] scale-110 opacity-90"
                : isError
                  ? "border-rose-400/50 bg-rose-500/15 shadow-[0_0_25px_rgba(244,63,94,0.35)] animate-stealth-shake scale-105"
                  : keyPulse
                    ? "border-white/30 bg-white/20 shadow-2xl scale-110 -translate-y-1"
                    : "border-white/15 bg-white/10 scale-100 translate-y-0"
            }`}
          >
            <svg
              className={`w-8 h-8 transition-colors duration-200 ${
                isUnlocking
                  ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.7)]"
                  : isError
                    ? "text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]"
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
                className={`transition-all duration-200 origin-bottom-left ${
                  isUnlocking
                    ? "-translate-y-1.5 -rotate-12 stroke-emerald-400"
                    : isError
                      ? "translate-y-0 stroke-rose-400"
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

            {/* Subtle helper text on lock badge */}
            <span className="mt-2 text-[10px] uppercase tracking-widest text-white/50 font-medium">
              Tap to unlock
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
