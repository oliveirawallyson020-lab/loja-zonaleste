import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { expireOldPurchases } from "../../../../../lib/vip";
import { getCurrentUser } from "../../../../../lib/auth";
import { PurchaseStatus } from "@prisma/client";
import { validateCsrfOrigin } from "../../../../../lib/security";

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

export const dynamic = "force-dynamic";

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
      include: { user: true },
      take: 1000
    });

    const header = [
      "id",
      "nome",
      "email",
      "username_gta",
      "plano",
      "valor_pago",
      "status",
      "data_compra",
      "data_inicio",
      "data_expiracao",
      "token",
      "token_usado",
      "comprovante_url"
    ];

    const rows = purchases.map((p) => [
      p.id,
      p.user.nome,
      p.user.email,
      p.user.usernameGta,
      p.plano,
      p.valorPago.toNumber().toFixed(2).replace(".", ","),
      p.status,
      p.dataCompra.toISOString(),
      p.dataInicio ? p.dataInicio.toISOString() : "",
      p.dataExpiracao ? p.dataExpiracao.toISOString() : "",
      p.token ?? "",
      p.tokenUsado ? "1" : "0",
      p.comprovanteUrl ?? ""
    ]);

    const csvLines = [header.join(";"), ...rows.map((r) => r.join(";"))];
    const csv = csvLines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="vendas_zona_leste_vip.csv"'
      }
    });
  } catch (error) {
    console.error("Erro em /api/admin/purchases/export", error);
    return NextResponse.json(
      { message: "Erro interno ao exportar CSV." },
      { status: 500 }
    );
  }
}

