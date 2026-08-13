import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/auth";
import { validateCsrfOrigin } from "../../../../lib/security";
import { isRateLimited } from "../../../../lib/rateLimit";

const registerSchema = z
  .object({
    nome: z.string().min(3).max(80).trim(),
    email: z.string().email().max(120),
    usernameGta: z.string().min(3).max(60).trim(),
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
        { windowMs: 60_000, max: 5 },
        "auth_register_rate"
      )
    ) {
      return NextResponse.json(
        { message: "Muitas tentativas de cadastro. Tente novamente em instantes." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados de cadastro inválidos." },
        { status: 400 }
      );
    }

    const { nome, email, usernameGta, senha } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json(
        { message: "Já existe um usuário cadastrado com este e-mail." },
        { status: 409 }
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { usernameGta }
    });

    if (existingUsername) {
      return NextResponse.json(
        { message: "Este username GTA já está em uso por outra conta." },
        { status: 409 }
      );
    }

    const senhaHash = await hashPassword(senha);

    await prisma.user.create({
      data: {
        nome,
        email,
        usernameGta,
        senhaHash
      }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Erro em /api/auth/register", error);
    return NextResponse.json(
      { message: "Erro interno ao criar usuário." },
      { status: 500 }
    );
  }
}

