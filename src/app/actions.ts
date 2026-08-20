"use server";

import {
  addStoredMessage,
  clearStoredMessages,
  getStoredMessages,
} from "@/lib/kv";
import type { ChatMessage } from "@/types/chat";

export async function sendMessageAction(
  text: string,
  sender: string,
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  if (!text || !text.trim()) {
    return { success: false, error: "Message cannot be empty." };
  }

  const senderName = sender?.trim() || "Anonymous";
  const message = await addStoredMessage(text.trim(), senderName);

  return { success: true, message };
}

export async function getMessagesAction(): Promise<ChatMessage[]> {
  return await getStoredMessages();
}

export async function clearMessagesAction(): Promise<{ success: boolean }> {
  await clearStoredMessages();
  return { success: true };
}
