import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { expireOldPurchases } from "../../../../lib/vip";
import { getCurrentUser } from "../../../../lib/auth";
import { PurchaseStatus } from "@prisma/client";
import { validateCsrfOrigin } from "../../../../lib/security";

const statusFilterSchema = z
  .enum(["AGUARDANDO", "APROVADO", "RECUSADO", "EXPIRADO", "TODOS"])
  .optional()
  .default("TODOS");

const planoFilterSchema = z
  .enum(["VIP_SEMANAL", "VIP_MENSAL", "CARRO_BLINDADO_SEMANAL", "CARRO_BLINDADO_MENSAL", "MOTO_SEMANAL", "MOTO_MENSAL", "TODOS"])
  .optional()
  .default("TODOS");

const periodoSchema = z
  .enum(["7", "30", "365", "all"])
  .optional()
  .default("30");

export async function GET(request: NextRequest) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json(
        { message: "Requisição inválida (CSRF)." },
        { status: 403 }
      );
    }
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
    }

    await expireOldPurchases();

    const { searchParams } = new URL(request.url);
    const statusParam = statusFilterSchema.parse(searchParams.get("status"));
    const planoParam = planoFilterSchema.parse(searchParams.get("plano"));
    const periodo = periodoSchema.parse(searchParams.get("periodo"));

    const where: any = {};

    if (statusParam !== "TODOS") {
      where.status = statusParam as PurchaseStatus;
    }
    if (planoParam !== "TODOS") {
      where.plano = planoParam;
    }

    if (periodo !== "all") {
      const days = parseInt(periodo, 10) || 30;
      const from = new Date();
      from.setDate(from.getDate() - days);
      where.dataCompra = { gte: from };
    }

    const purchases = await prisma.purchase.findMany({
      where,
      orderBy: { dataCompra: "desc" },
      include: {
        user: true
      },
      take: 300
    });

    const mapped = purchases.map((p) => ({
      id: p.id,
      usuario: p.user.nome,
      email: p.user.email,
      usernameGta: p.user.usernameGta,
      plano: p.plano,
      valorPago: p.valorPago.toNumber(),
      status: p.status,
      dataCompra: p.dataCompra,
      dataExpiracao: p.dataExpiracao,
      comprovanteUrl: p.comprovanteUrl,
      token: p.token,
      tokenUsado: p.tokenUsado
    }));

    return NextResponse.json({ purchases: mapped });
  } catch (error) {
    console.error("Erro em /api/admin/purchases", error);
    return NextResponse.json(
      { message: "Erro interno ao listar compras." },
      { status: 500 }
    );
  }
}

