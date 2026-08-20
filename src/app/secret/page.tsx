"use client";

import Link from "next/link";
import { useState } from "react";
import { createSecretAction } from "./actions";

const TTL_OPTIONS = [
  { label: "30 Seconds", value: 30 },
  { label: "5 Minutes", value: 300 },
  { label: "1 Hour", value: 3600 },
  { label: "24 Hours", value: 86400 },
  { label: "View Once", value: 86400, burn: true },
];

export default function SecretPage() {
  const [text, setText] = useState("");
  const [selectedOption, setSelectedOption] = useState(TTL_OPTIONS[1]);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createSecretAction(
        text,
        selectedOption.value,
        Boolean(selectedOption.burn),
      );

      if (res.success && res.id) {
        const origin = window.location.origin;
        setCreatedLink(`${origin}/secret/${res.id}`);
        setText("");
      } else {
        setError(res.error || "Failed to create secret.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!createdLink) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(createdLink);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = createdLink;
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

  const handleReset = () => {
    setCreatedLink(null);
    setText("");
    setCopied(false);
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
        <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
          KV Secret Vault
        </span>
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl p-6 sm:p-8">
        {!createdLink ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Self-Destructing Secret
              </h1>
              <p className="text-white/70 text-sm">
                Write a message that automatically disappears after a time limit
                or on first view.
              </p>
            </div>

            {/* Secret Textarea */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="secret-text"
                className="text-xs font-semibold text-white/80 uppercase tracking-wide"
              >
                Secret Message
              </label>
              <textarea
                id="secret-text"
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste sensitive text, passwords, API keys, or private notes..."
                required
                className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl p-3.5 border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm resize-none"
              />
            </div>

            {/* Expiration Selector */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                Time to Live (TTL)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TTL_OPTIONS.map((opt) => {
                  const isSelected =
                    selectedOption.label === opt.label &&
                    selectedOption.value === opt.value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer border text-center ${
                        isSelected
                          ? "bg-white text-purple-900 border-white font-semibold shadow-md scale-[1.02]"
                          : "bg-white/5 hover:bg-white/15 text-white/80 border-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="text-red-200 bg-red-500/20 border border-red-500/30 text-xs rounded-lg p-2.5">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-white hover:bg-white/90 text-purple-900 font-semibold text-sm transition-all duration-150 cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating Secret..." : "Generate Secret Link"}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-5 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                >
                  <title>Success Check</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">
                Secret Created Successfully!
              </h2>
              <p className="text-white/70 text-sm mt-1">
                {selectedOption.burn
                  ? "This secret will self-destruct immediately upon first read."
                  : `This secret will self-destruct in ${selectedOption.label}.`}
              </p>
            </div>

            {/* Secret Link Input */}
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/10">
              <input
                type="text"
                readOnly
                value={createdLink}
                className="w-full bg-transparent text-white/90 text-xs px-2 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 px-3 py-1.5 bg-white text-purple-900 font-semibold text-xs rounded-lg transition-all hover:bg-white/90 cursor-pointer active:scale-95 shadow-sm"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/15 transition-all cursor-pointer"
              >
                Create Another Secret
              </button>
              <Link
                href={createdLink}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-white/90 text-purple-900 font-semibold text-xs transition-all text-center flex items-center justify-center"
              >
                View Secret Page
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
