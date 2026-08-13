import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { expireOldPurchases } from "../../../../lib/vip";
import { getCurrentUser } from "../../../../lib/auth";
import { PurchaseStatus, VipPlan } from "@prisma/client";
import { validateCsrfOrigin } from "../../../../lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

    const totalVendas = await prisma.purchase.count();
    const totalAprovadas = await prisma.purchase.count({
      where: { status: PurchaseStatus.APROVADO }
    });
    const aprovadas = await prisma.purchase.findMany({
      where: { status: PurchaseStatus.APROVADO },
      select: { valorPago: true, plano: true }
    });

    const valorTotalAprovado = aprovadas.reduce(
      (sum, p) => sum + p.valorPago.toNumber(),
      0
    );

    const porPlano: Record<VipPlan, number> = {
      VIP_SEMANAL: 0,
      VIP_MENSAL: 0,
      CARRO_BLINDADO_SEMANAL: 0,
      CARRO_BLINDADO_MENSAL: 0,
      MOTO_SEMANAL: 0,
      MOTO_MENSAL: 0
    };

    for (const p of aprovadas) {
      if (p.plano in porPlano) {
        porPlano[p.plano]++;
      }
    }

    return NextResponse.json({
      totalVendas,
      totalAprovadas,
      valorTotalAprovado,
      porPlano
    });
  } catch (error) {
    console.error("Erro em /api/admin/stats", error);
    return NextResponse.json(
      { message: "Erro interno ao obter estatísticas." },
      { status: 500 }
    );
  }
}

