import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getAuthSecretKey } from "./lib/env";
import { applySecurityHeaders } from "./lib/security";

const AUTH_COOKIE_NAME = "auth_token";

type Payload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
};

async function verifyToken(token: string): Promise<Payload | null> {
  try {
    const { payload } = await jwtVerify<Payload>(token, getAuthSecretKey());
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedUser = pathname.startsWith("/minha-conta");
  const protectedAdmin = pathname.startsWith("/admin");

  const buildResponse = (res: NextResponse) => applySecurityHeaders(res);

  if (!protectedUser && !protectedAdmin) {
    return buildResponse(NextResponse.next());
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return buildResponse(NextResponse.redirect(loginUrl));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return buildResponse(NextResponse.redirect(loginUrl));
  }

  if (protectedAdmin && payload.role !== "ADMIN") {
    return buildResponse(NextResponse.redirect(new URL("/", request.url)));
  }

  return buildResponse(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

