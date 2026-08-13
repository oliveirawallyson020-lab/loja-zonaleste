import { PurchaseStatus, VipPlan } from "@prisma/client";
import { prisma } from "./prisma";

let lastExpirationRun: number | null = null;
const EXPIRATION_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

export function getPlanPrice(plano: VipPlan): number {
  return getPlanFinancials(plano).valorPago;
}

export function getPlanFinancials(plano: VipPlan): {
  valorOriginal: number;
  descontoPercentual: number;
  valorPago: number;
} {
  switch (plano) {
    case "VIP_SEMANAL":
      return { valorOriginal: 15, descontoPercentual: 0, valorPago: 15 };
    case "VIP_MENSAL":
      return { valorOriginal: 35, descontoPercentual: 0, valorPago: 35 };
    case "CARRO_BLINDADO_SEMANAL":
      return { valorOriginal: 20, descontoPercentual: 0, valorPago: 20 };
    case "CARRO_BLINDADO_MENSAL":
      return { valorOriginal: 50, descontoPercentual: 0, valorPago: 50 };
    case "MOTO_SEMANAL":
      return { valorOriginal: 15, descontoPercentual: 0, valorPago: 15 };
    case "MOTO_MENSAL":
      return { valorOriginal: 35, descontoPercentual: 0, valorPago: 35 };
    default:
      throw new Error("Plano inválido");
  }
}

export function calculateVipPeriod(plano: VipPlan) {
  const start = new Date();
  const end = new Date(start);

  if (plano.endsWith("_SEMANAL")) {
    end.setDate(end.getDate() + 7);
  } else if (plano.endsWith("_MENSAL")) {
    end.setMonth(end.getMonth() + 1);
  }

  return { dataInicio: start, dataExpiracao: end };
}

async function runExpiration() {
  const now = new Date();
  await prisma.purchase.updateMany({
    where: {
      status: PurchaseStatus.APROVADO,
      dataExpiracao: {
        lt: now
      }
    },
    data: {
      status: PurchaseStatus.EXPIRADO
    }
  });
}

export async function expireOldPurchases() {
  await runExpiration();
}

export async function expireOldPurchasesIfNeeded() {
  const nowTs = Date.now();
  if (
    lastExpirationRun &&
    nowTs - lastExpirationRun < EXPIRATION_MIN_INTERVAL_MS
  ) {
    return;
  }

  lastExpirationRun = nowTs;
  await runExpiration();
}

