import { Chat } from "@/components/chat";
import { StealthLock } from "@/components/stealth-lock";

export default function Home() {
  return (
    <StealthLock>
      <Chat />
    </StealthLock>
  );
}
