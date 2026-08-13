import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../lib/auth";
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
      where: { id: params.id }
    });

    if (!purchase) {
      return NextResponse.json(
        { message: "Compra não encontrada." },
        { status: 404 }
      );
    }

    if (purchase.status !== PurchaseStatus.AGUARDANDO) {
      return NextResponse.json(
        { message: "Somente compras aguardando podem ser recusadas." },
        { status: 400 }
      );
    }

    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        status: PurchaseStatus.RECUSADO
      }
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "REJECT",
        referenciaId: purchase.id
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro em /api/admin/purchases/[id]/reject", error);
    return NextResponse.json(
      { message: "Erro interno ao recusar compra." },
      { status: 500 }
    );
  }
}

