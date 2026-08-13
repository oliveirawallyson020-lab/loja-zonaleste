import { prisma } from "./prisma";
import { expireOldPurchasesIfNeeded } from "./vip";

export async function getAccountPurchases(userId: string) {
  await expireOldPurchasesIfNeeded();

  const purchases = await prisma.purchase.findMany({
    where: { userId },
    orderBy: { dataCompra: "desc" }
  });

  const active = purchases.find(
    (p) => p.status === "APROVADO" || p.status === "AGUARDANDO"
  );

  return { purchases, active };
}

