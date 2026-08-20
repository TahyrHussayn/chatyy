import type { ChatMessage } from "@/types/chat";

// In-memory live subscribers for real-time ephemeral broadcast
interface GlobalWithChatyy {
  __chatyy_listeners__?: Set<(msg: ChatMessage) => void>;
}

const globalStore = globalThis as unknown as GlobalWithChatyy;
if (!globalStore.__chatyy_listeners__) {
  globalStore.__chatyy_listeners__ = new Set();
}

export function subscribeToMessages(
  listener: (msg: ChatMessage) => void,
): () => void {
  globalStore.__chatyy_listeners__?.add(listener);
  return () => {
    globalStore.__chatyy_listeners__?.delete(listener);
  };
}

function notifySubscribers(message: ChatMessage) {
  if (globalStore.__chatyy_listeners__) {
    for (const listener of globalStore.__chatyy_listeners__) {
      try {
        listener(message);
      } catch (err) {
        console.error("Error notifying subscriber:", err);
      }
    }
  }
}

export const isKvConfigured = false;

export async function getStoredMessages(): Promise<ChatMessage[]> {
  // Ephemeral: fresh connections start with 0 message history
  return [];
}

export async function addStoredMessage(
  text: string,
  sender: string,
): Promise<ChatMessage> {
  const sanitizedText = text.trim().slice(0, 2000);
  const sanitizedSender = (sender?.trim() || "Anonymous").slice(0, 30);

  const message: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    text: sanitizedText,
    sender: sanitizedSender,
    createdAt: Date.now(),
  };

  // Broadcast in real-time only to active live tabs/users
  notifySubscribers(message);

  return message;
}

export async function clearStoredMessages(): Promise<void> {
  // No-op in ephemeral mode
}
