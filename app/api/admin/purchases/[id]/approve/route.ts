import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../lib/auth";
import { calculateVipPeriod } from "../../../../../../lib/vip";
import { generateUniqueVipToken } from "../../../../../../lib/token";
import { sendVipApprovedEmail } from "../../../../../../lib/email";
import { PurchaseStatus } from "@prisma/client";
import { validateCsrfOrigin } from "../../../../../../lib/security";

type Params = {
  params: { id: string };
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json(
        { message: "Requisição inválida (CSRF)." },
        { status: 403 }
      );
    }

    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ message: "Não autorizado." }, { status: 403 });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!purchase) {
      return NextResponse.json(
        { message: "Compra não encontrada." },
        { status: 404 }
      );
    }

    if (purchase.status !== PurchaseStatus.AGUARDANDO) {
      return NextResponse.json(
        { message: "Somente compras aguardando podem ser aprovadas." },
        { status: 400 }
      );
    }

    const token = await generateUniqueVipToken();
    const { dataInicio, dataExpiracao } = calculateVipPeriod(purchase.plano);
    const now = new Date();

    const updated = await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        status: PurchaseStatus.APROVADO,
        token,
        dataInicio,
        dataExpiracao,
        tokenGeradoEm: now,
        tokenExpiraEm: dataExpiracao,
        aprovadoPorId: admin.id,
        aprovadoEm: now
      },
      include: { user: true }
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "APPROVE",
        referenciaId: updated.id
      }
    });

    await sendVipApprovedEmail({
      to: updated.user.email,
      nome: updated.user.nome,
      plano: `VIP ${updated.plano}`,
      token
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro em /api/admin/purchases/[id]/approve", error);
    return NextResponse.json(
      { message: "Erro interno ao aprovar compra." },
      { status: 500 }
    );
  }
}

