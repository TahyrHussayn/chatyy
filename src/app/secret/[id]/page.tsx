"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { getSecretAction } from "../actions";

interface SecretViewerProps {
  params: Promise<{ id: string }>;
}

export default function SecretViewer({ params }: SecretViewerProps) {
  const { id } = use(params);
  const [secretText, setSecretText] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function loadSecret() {
      try {
        const res = await getSecretAction(id);
        if (res.success && res.secret) {
          setSecretText(res.secret.text);
          setExpiresAt(res.secret.expiresAt);
          setBurnAfterReading(Boolean(res.secret.burnAfterReading));
        } else {
          setError(res.error || "This secret has expired or does not exist.");
        }
      } catch {
        setError("Failed to load secret.");
      } finally {
        setIsLoading(false);
      }
    }

    loadSecret();
  }, [id]);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000),
      );
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setSecretText(null);
        setError("This secret has self-destructed and no longer exists.");
        clearInterval(interval);
      }
    }, 1000);

    // Initial calculation
    setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopy = async () => {
    if (!secretText) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(secretText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = secretText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write denial
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
      return `${hours}h ${mins % 60}m ${secs.toString().padStart(2, "0")}s`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-b from-purple-500 to-indigo-600 p-4 sm:p-6 md:p-8 items-center justify-center">
      {/* Top Header / Back link */}
      <div className="w-full max-w-xl flex justify-between items-center mb-6">
        <Link
          href="/"
          className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            role="img"
          >
            <title>Back Arrow</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Chat
        </Link>
        <Link
          href="/secret"
          className="text-white/80 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          + Create Secret
        </Link>
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl p-6 sm:p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/70 text-sm animate-pulse">
            Decrypting secret...
          </div>
        ) : error || !secretText ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-300 text-2xl">
              💥
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">
                Secret Unavailable
              </h1>
              <p className="text-white/70 text-sm max-w-md">
                {error ||
                  "This secret has self-destructed and has been wiped from memory."}
              </p>
            </div>
            <Link
              href="/secret"
              className="mt-2 py-2.5 px-5 bg-white text-purple-900 font-semibold text-xs rounded-xl transition-all hover:bg-white/90 shadow-md"
            >
              Create a New Secret
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-white">
                  Decrypted Secret Message
                </h1>
                <p className="text-white/70 text-xs mt-0.5">
                  {burnAfterReading
                    ? "View-Once: This message has now been permanently deleted from storage."
                    : "This message will automatically expire when the timer hits zero."}
                </p>
              </div>

              {/* Countdown badge */}
              {timeLeft !== null && timeLeft > 0 && !burnAfterReading && (
                <div className="px-3 py-1 bg-white/15 border border-white/20 rounded-full text-white font-mono text-xs font-semibold shadow-inner shrink-0">
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>

            {/* Secret Content Box */}
            <div className="relative group">
              <div className="w-full bg-black/25 text-white/95 rounded-xl p-4 border border-white/15 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap select-all max-h-80 overflow-y-auto">
                {secretText}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-4 bg-white text-purple-900 font-semibold text-xs rounded-xl transition-all hover:bg-white/90 cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                >
                  <title>Copy Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {copied ? "Copied to Clipboard!" : "Copy Message"}
              </button>

              <Link
                href="/secret"
                className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/15 transition-all text-center"
              >
                Create Your Own Secret
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
