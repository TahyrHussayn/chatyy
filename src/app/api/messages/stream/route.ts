import { subscribeToMessages } from "@/lib/kv";
import type { ChatMessage } from "@/types/chat";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let cleanupSubscriber: (() => void) | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial ready event (ephemeral - 0 past history)
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "init", messages: [] })}\n\n`,
        ),
      );

      // Listen for real-time live messages
      cleanupSubscriber = subscribeToMessages((msg: ChatMessage) => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "message", message: msg })}\n\n`,
            ),
          );
        } catch {
          // Stream closed
        }
      });

      // 25s lightweight SSE keep-alive comment to prevent socket timeouts
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, 25000);
    },
    cancel() {
      if (cleanupSubscriber) cleanupSubscriber();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
