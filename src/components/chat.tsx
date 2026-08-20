"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { sendMessageAction } from "@/app/actions";
import { soundManager } from "@/lib/sounds";
import type { ChatMessage } from "@/types/chat";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<string>("Anonymous");
  const [isMuted, setIsMuted] = useState(false);
  const currentUserRef = useRef<string>("Anonymous");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMuted(soundManager.getIsMuted());
    const savedName = localStorage.getItem("chatyy_username");
    if (savedName) {
      setCurrentUser(savedName);
      currentUserRef.current = savedName;
    } else {
      const randomName = `User_${Math.floor(1000 + Math.random() * 9000)}`;
      setCurrentUser(randomName);
      currentUserRef.current = randomName;
      localStorage.setItem("chatyy_username", randomName);
    }
  }, []);

  useEffect(() => {
    // Open a persistent Server-Sent Events stream (Zero polling spam!)
    const eventSource = new EventSource("/api/messages/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "init") {
          setMessages(data.messages || []);
        } else if (data.type === "message" && data.message) {
          setMessages((prev) => {
            let replaced = false;
            const filtered = prev.filter((m) => {
              if (
                !replaced &&
                m.id.startsWith("temp-") &&
                m.text === data.message.text &&
                m.sender === data.message.sender
              ) {
                replaced = true;
                return false;
              }
              return true;
            });
            if (filtered.some((m) => m.id === data.message.id)) {
              return filtered;
            }

            // Play incoming message sound if from someone else
            if (data.message.sender !== currentUserRef.current) {
              soundManager.playReceive();
            }

            return [...filtered, data.message];
          });
        }
      } catch (err) {
        console.error("Error parsing message stream:", err);
      }
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects on error
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSend = useCallback(async (text: string) => {
    const user = currentUserRef.current;
    soundManager.playSend();

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      text,
      sender: user,
      createdAt: Date.now(),
    };

    // Instant local UI feedback
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await sendMessageAction(text, user);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  return (
    <main className="flex flex-col h-screen bg-gradient-to-b from-purple-500 to-indigo-600 p-2 sm:p-4 md:p-6">
      <div className="flex justify-between items-center px-1 mb-2">
        <span className="text-white/80 font-bold text-sm tracking-wide select-none">
          Chatyy
        </span>
        <div className="flex items-center gap-2">
          {/* Sound Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          >
            {isMuted ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
              >
                <title>Muted Audio</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
              >
                <title>Active Audio</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            )}
          </button>

          <Link
            href="/secret"
            className="text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/15 transition-all shadow-sm active:scale-95"
          >
            Vault
          </Link>
        </div>
      </div>
      <MessageList
        messages={messages}
        currentUser={currentUser}
        messagesEndRef={messagesEndRef}
      />
      <MessageInput onSendMessage={handleSend} />
    </main>
  );
}
