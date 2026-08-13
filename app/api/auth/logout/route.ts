import { NextResponse } from "next/server";
import { clearAuthCookie } from "../../../../lib/auth";

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro em /api/auth/logout", error);
    return NextResponse.json(
      { message: "Erro interno ao sair da conta." },
      { status: 500 }
    );
  }
}

