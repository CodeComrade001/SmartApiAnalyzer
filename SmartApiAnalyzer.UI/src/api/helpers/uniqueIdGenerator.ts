const DEFAULT_MAX_LENGTH = 4096;

/**
 * Generates a deterministic hash from any payload.
 * - Stable for identical payloads.
 * - Limits memory usage.
 * - Produces a short hexadecimal string.
 */
export async function HashGenerator(
  payload: unknown,
  maxLength: number = DEFAULT_MAX_LENGTH
): Promise<string> {
  let json = JSON.stringify(payload);

  // Prevent hashing extremely large payloads.
  if (json.length > maxLength) {
    json = json.slice(0, maxLength);
  }

  const bytes = new TextEncoder().encode(json);

  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);

  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}