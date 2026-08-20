import { kv } from "@vercel/kv";

export interface SecretData {
  id: string;
  text: string;
  createdAt: number;
  expiresAt: number;
  burnAfterReading: boolean;
}

// In-memory fallback for local dev when KV envs are not set
interface GlobalWithSecrets {
  __chatyy_secrets_map__?: Map<string, SecretData>;
}

const globalStore = globalThis as unknown as GlobalWithSecrets;
if (!globalStore.__chatyy_secrets_map__) {
  globalStore.__chatyy_secrets_map__ = new Map();
}

function isKvConfigured(): boolean {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return Boolean(url && token && url.trim() !== "" && token.trim() !== "");
}

const SECRET_PREFIX = "chatyy:secret:";

export async function createSecret(
  text: string,
  ttlSeconds: number,
  burnAfterReading = false,
): Promise<{ id: string; expiresAt: number }> {
  const id = `${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  const secret: SecretData = {
    id,
    text: text.trim(),
    createdAt: now,
    expiresAt,
    burnAfterReading,
  };

  if (isKvConfigured()) {
    try {
      await kv.set(`${SECRET_PREFIX}${id}`, JSON.stringify(secret), {
        ex: Math.max(ttlSeconds, 1),
      });
      return { id, expiresAt };
    } catch (error) {
      console.warn("KV write failed, using in-memory store:", error);
    }
  }

  // Fallback in-memory store with auto-cleanup
  globalStore.__chatyy_secrets_map__?.set(id, secret);
  setTimeout(() => {
    globalStore.__chatyy_secrets_map__?.delete(id);
  }, ttlSeconds * 1000);

  return { id, expiresAt };
}

export async function getSecret(id: string): Promise<SecretData | null> {
  if (!id) return null;

  let secret: SecretData | null = null;

  if (isKvConfigured()) {
    try {
      const data = await kv.get<string | SecretData>(`${SECRET_PREFIX}${id}`);
      if (data) {
        secret = typeof data === "string" ? JSON.parse(data) : data;
      }
    } catch (error) {
      console.warn("KV get failed, checking in-memory store:", error);
    }
  }

  if (!secret) {
    secret = globalStore.__chatyy_secrets_map__?.get(id) || null;
  }

  if (!secret) return null;

  // Check if expired
  if (Date.now() > secret.expiresAt) {
    await deleteSecret(id);
    return null;
  }

  // If view-once / burn after reading, delete immediately upon read
  if (secret.burnAfterReading) {
    await deleteSecret(id);
  }

  return secret;
}

export async function deleteSecret(id: string): Promise<void> {
  if (isKvConfigured()) {
    try {
      await kv.del(`${SECRET_PREFIX}${id}`);
    } catch (error) {
      console.warn("KV delete failed:", error);
    }
  }
  globalStore.__chatyy_secrets_map__?.delete(id);
}
