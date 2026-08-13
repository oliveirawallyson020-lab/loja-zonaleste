const AUTH_SECRET_ENV = process.env.AUTH_SECRET;

if (!AUTH_SECRET_ENV) {
  throw new Error(
    "Variável de ambiente AUTH_SECRET não definida. Defina um segredo forte em produção."
  );
}

export function getAuthSecretKey(): Uint8Array {
  return new TextEncoder().encode(AUTH_SECRET_ENV as string);
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

