import crypto from "node:crypto";
import { Chat } from "@/components/chat";
import { StealthLock } from "@/components/stealth-lock";

export const dynamic = "force-dynamic";

const STEALTH_SALT = "chatyy_stealth_v1";

export default function Home() {
  const secret =
    process.env.CHAT_PASSWORD || process.env.NEXT_PUBLIC_CHAT_PASSWORD;
  const cleanSecret = secret?.trim().toLowerCase();
  const requiresPassword = Boolean(cleanSecret && cleanSecret.length > 0);
  const passwordHash =
    requiresPassword && cleanSecret
      ? crypto
          .createHash("sha256")
          .update(STEALTH_SALT + cleanSecret)
          .digest("hex")
      : undefined;
  const passwordLength = cleanSecret ? cleanSecret.length : undefined;

  return (
    <StealthLock
      requiresPassword={requiresPassword}
      passwordHash={passwordHash}
      salt={STEALTH_SALT}
      passwordLength={passwordLength}
    >
      <Chat />
    </StealthLock>
  );
}
