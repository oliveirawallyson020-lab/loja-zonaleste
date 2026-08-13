import { randomBytes } from "crypto";
import { prisma } from "./prisma";

const ALPHANUM =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateRandomToken(length = 20) {
  const bytes = randomBytes(length);
  let token = "";
  for (let i = 0; i < length; i++) {
    token += ALPHANUM[bytes[i] % ALPHANUM.length];
  }
  return token;
}

export async function generateUniqueVipToken() {
  // Garante unicidade consultando o banco.
  // Em casos extremos, tenta algumas vezes antes de falhar.
  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generateRandomToken(20);
    const existing = await prisma.purchase.findFirst({
      where: { token }
    });
    if (!existing) return token;
  }

  throw new Error(
    "Não foi possível gerar um token VIP único. Tente novamente em instantes."
  );
}

