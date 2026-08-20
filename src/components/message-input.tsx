"use client";

import type React from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const MessageInput = memo(function MessageInput({
  onSendMessage,
  disabled = false,
}: MessageInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      const isUnlocked =
        typeof window !== "undefined" &&
        (sessionStorage.getItem("chatyy_unlocked") === "true" ||
          document.documentElement.classList.contains("is-unlocked"));
      if (isUnlocked) {
        inputRef.current?.focus();
      }
    }
  }, [disabled]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !disabled) {
        onSendMessage(trimmed);
        setInputValue("");
      }
    },
    [inputValue, disabled, onSendMessage],
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full py-2 px-1">
      <input
        ref={inputRef}
        type="text"
        disabled={disabled}
        className="w-full bg-transparent text-white placeholder-white/50 border-none outline-none focus:outline-none focus:ring-0 text-base sm:text-lg font-medium caret-white"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type a message..."
      />
    </form>
  );
});
