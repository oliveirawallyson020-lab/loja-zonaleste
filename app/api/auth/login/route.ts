import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import {
  createAuthToken,
  setAuthCookie,
  verifyPassword
} from "../../../../lib/auth";
import { validateCsrfOrigin } from "../../../../lib/security";
import { isRateLimited } from "../../../../lib/rateLimit";

const loginSchema = z
  .object({
    email: z.string().email().max(120),
    senha: z.string().min(6).max(72)
  })
  .strict();

export async function POST(request: Request) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json(
        { message: "Requisição inválida (CSRF)." },
        { status: 403 }
      );
    }

    if (
      await isRateLimited(
        request,
        { windowMs: 60_000, max: 10 },
        "auth_login_rate"
      )
    ) {
      return NextResponse.json(
        { message: "Muitas tentativas de login. Tente novamente em instantes." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 400 }
      );
    }

    const { email, senha } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(senha, user.senhaHash);

    if (!valid) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const token = await createAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });
    await setAuthCookie(token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro em /api/auth/login", error);
    return NextResponse.json(
      { message: "Erro interno ao efetuar login." },
      { status: 500 }
    );
  }
}

