"use server";

import {
  createSecret,
  deleteSecret,
  getSecret,
  type SecretData,
} from "@/lib/secret-kv";

export async function createSecretAction(
  text: string,
  ttlSeconds: number,
  burnAfterReading = false,
): Promise<{
  success: boolean;
  id?: string;
  expiresAt?: number;
  error?: string;
}> {
  if (!text || !text.trim()) {
    return { success: false, error: "Secret text cannot be empty." };
  }

  const validTtl = Math.min(Math.max(ttlSeconds || 300, 10), 604800); // 10s to 7 days
  const result = await createSecret(text.trim(), validTtl, burnAfterReading);

  return { success: true, id: result.id, expiresAt: result.expiresAt };
}

export async function getSecretAction(
  id: string,
): Promise<{ success: boolean; secret?: SecretData; error?: string }> {
  if (!id || !id.trim()) {
    return { success: false, error: "Invalid secret ID." };
  }

  const secret = await getSecret(id.trim());
  if (!secret) {
    return {
      success: false,
      error: "This secret has expired or self-destructed.",
    };
  }

  return { success: true, secret };
}

export async function deleteSecretAction(
  id: string,
): Promise<{ success: boolean }> {
  await deleteSecret(id);
  return { success: true };
}
