"use client";

import type React from "react";
import { memo } from "react";
import type { ChatMessage } from "@/types/chat";

interface MessageItemProps {
  message: ChatMessage;
  isSent: boolean;
}

const MessageItem = memo(function MessageItem({
  message,
  isSent,
}: MessageItemProps) {
  return (
    <div className={`flex flex-col ${isSent ? "items-end" : "items-start"}`}>
      <span className="text-[11px] font-medium text-white/60 px-1 mb-1 select-none">
        {isSent ? "You" : message.sender}
      </span>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm break-words text-sm font-medium leading-relaxed ${
          isSent
            ? "bg-white/25 text-white border border-white/25 rounded-tr-xs"
            : "bg-white/15 text-white border border-white/15 rounded-tl-xs"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
});

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessageList = memo(function MessageList({
  messages,
  currentUser,
  messagesEndRef,
}: MessageListProps) {
  return (
    <div className="flex-grow overflow-y-auto mb-6 bg-white/10 rounded-2xl shadow-xl backdrop-blur-md border border-white/15 scroll-smooth will-change-scroll">
      <div className="p-4 space-y-3">
        {messages.map((m) => (
          <MessageItem
            key={m.id}
            message={m}
            isSent={m.sender === currentUser}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});
