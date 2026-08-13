import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../lib/auth";
import { validateCsrfOrigin } from "../../../../../../lib/security";

type Params = {
  params: { id: string };
};

export async function GET(request: NextRequest, { params }: Params) {
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

    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id }
    });

    if (!purchase) {
      return NextResponse.json(
        { message: "Compra não encontrada." },
        { status: 404 }
      );
    }

    if (!purchase.comprovanteUrl) {
      return NextResponse.json(
        { message: "Compra não possui comprovante associado." },
        { status: 404 }
      );
    }

    if (
      process.env.NODE_ENV === "development" &&
      purchase.comprovanteUrl.startsWith("dev-blob://")
    ) {
      return NextResponse.json(
        {
          message:
            "Comprovante não disponível em ambiente de desenvolvimento local."
        },
        { status: 404 }
      );
    }

    // Verifica se o blob existe e pega o tipo de conteúdo
    const blobInfo = await head(purchase.comprovanteUrl);

    // Busca o conteúdo do blob diretamente
    const response = await fetch(purchase.comprovanteUrl);
    const blobData = await response.arrayBuffer();

    return new NextResponse(blobData, {
      headers: {
        "Content-Type": blobInfo.contentType ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `inline; filename="comprovante-${purchase.id}"`
      }
    });
  } catch (error) {
    console.error("Erro em /api/admin/purchases/[id]/receipt", error);
    return NextResponse.json(
      { message: "Erro interno ao buscar comprovante." },
      { status: 500 }
    );
  }
}

