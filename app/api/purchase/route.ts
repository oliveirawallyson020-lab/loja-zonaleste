import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { z } from "zod";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { getPlanFinancials } from "../../../lib/vip";
import { PurchaseStatus, VipPlan } from "@prisma/client";
import { validateCsrfOrigin } from "../../../lib/security";
import { isRateLimited } from "../../../lib/rateLimit";
import { validateAndPrepareComprovante } from "../../../lib/upload";

export const runtime = "nodejs";

const purchaseSchema = z
  .object({
    plano: z.enum(["VIP_SEMANAL", "VIP_MENSAL", "CARRO_BLINDADO_SEMANAL", "CARRO_BLINDADO_MENSAL", "MOTO_SEMANAL", "MOTO_MENSAL"])
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
        "purchase_create_rate"
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Muitas tentativas de registro de compra. Tente novamente em instantes."
        },
        { status: 429 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Autenticação necessária para registrar compra." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const planoParam = String(formData.get("plano") || "").toUpperCase();
    const comprovante = formData.get("comprovante");

    const parsed = purchaseSchema.safeParse({ plano: planoParam });
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Plano informado é inválido." },
        { status: 400 }
      );
    }

    if (!(comprovante instanceof File)) {
      return NextResponse.json(
        { message: "Comprovante do PIX é obrigatório." },
        { status: 400 }
      );
    }

    let validated;
    try {
      validated = await validateAndPrepareComprovante(comprovante, user.id);
    } catch (validationError: any) {
      return NextResponse.json(
        {
          message:
            validationError?.message ||
            "Comprovante inválido. Envie um arquivo de imagem PNG, JPEG ou WEBP de até 5MB."
        },
        { status: 400 }
      );
    }

    let comprovanteUrl: string;

    if (process.env.NODE_ENV === "development") {
      comprovanteUrl = `dev-blob://${validated.blobPath}`;
    } else {
      const blob = await put(validated.blobPath, validated.buffer, {
        access: "private",
        contentType: validated.mime
      });
      comprovanteUrl = blob.url;
    }

    const plano = parsed.data.plano as VipPlan;
    const { valorPago } = getPlanFinancials(plano);

    const ipCompra =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;

    await prisma.purchase.create({
      data: {
        userId: user.id,
        plano,
        valorPago,
        comprovanteUrl,
        status: PurchaseStatus.AGUARDANDO,
        ipCompra: ipCompra || undefined
      }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Erro em /api/purchase", {
      error,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL
    });
    return NextResponse.json(
      { message: "Erro interno ao registrar compra." },
      { status: 500 }
    );
  }
}

