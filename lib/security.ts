import { NextResponse } from "next/server";
import { getAllowedOrigins } from "./env";

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

export function validateCsrfOrigin(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return true;
  }

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  const requestOrigin = normalizeOrigin(request.url);
  const origin = normalizeOrigin(originHeader);
  const referer = normalizeOrigin(refererHeader);

  const allowedOrigins = getAllowedOrigins().map((value) => value.trim());

  if (allowedOrigins.length > 0) {
    const matchesAllowed = (value: string | null) =>
      !!value && allowedOrigins.includes(value);

    if (matchesAllowed(origin) || matchesAllowed(referer)) {
      return true;
    }
  }

  if (origin && origin === requestOrigin) {
    return true;
  }
  if (referer && referer === requestOrigin) {
    return true;
  }

  // Em desenvolvimento, permitir chamadas diretas sem Origin para facilitar testes locais.
  if (process.env.NODE_ENV !== "production" && !origin && !referer) {
    return true;
  }

  return false;
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // CSP básica. Em desenvolvimento, habilita 'unsafe-eval' para funcionar com o dev server do Next.
  const scriptSrc =
    process.env.NODE_ENV === "development"
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
      : "script-src 'self';";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self';",
      scriptSrc,
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' blob: data: https:;",
      "connect-src 'self' https:;",
      "font-src 'self' data: https:;",
      "object-src 'none';",
      "frame-ancestors 'none';",
      "base-uri 'self';",
      "form-action 'self';"
    ].join(" ")
  );

  return response;
}

