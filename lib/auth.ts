import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
import { getAuthSecretKey } from "./env";

const AUTH_COOKIE_NAME = "auth_token";
const TOKEN_EXPIRES_IN = "7d";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
};

export async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createAuthToken(payload: AuthTokenPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setExpirationTime(TOKEN_EXPIRES_IN)
    .sign(getAuthSecretKey());

  return token;
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify<AuthTokenPayload>(
    token,
    getAuthSecretKey()
  );
  return payload;
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // 7 dias
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = await verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });
    return user;
  } catch {
    return null;
  }
}

