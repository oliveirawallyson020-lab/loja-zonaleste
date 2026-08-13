export function getAuthSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET || "fallback-secret-for-build-phase-min-32-chars-long";
  return new TextEncoder().encode(secret);
}

export function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

