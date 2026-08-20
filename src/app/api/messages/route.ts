import { type NextRequest, NextResponse } from "next/server";
import { addStoredMessage, getStoredMessages, isKvConfigured } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const messages = await getStoredMessages();
    return NextResponse.json({
      messages,
      isKvConfigured,
    });
  } catch (error) {
    console.error("Error in GET /api/messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sender } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 },
      );
    }

    const trimmedText = text.trim();
    const senderName =
      sender && typeof sender === "string" ? sender.trim() : "Anonymous";

    const message = await addStoredMessage(trimmedText, senderName);

    return NextResponse.json({
      message,
      success: true,
    });
  } catch (error) {
    console.error("Error in POST /api/messages:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
