import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@zonalesterp.com";
  const adminPassword =
    process.env.INIT_ADMIN_PASSWORD || "troque-esta-senha-antes-de-produzir";

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existing) {
    console.log("Admin já existe, nada a fazer.");
    return;
  }

  const senhaHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      nome: "Administrador",
      email: adminEmail,
      usernameGta: "ADM_ZONA_LESTE",
      senhaHash,
      role: Role.ADMIN
    }
  });

  console.log("Admin criado com sucesso:");
  console.log(`Email: ${admin.email}`);
  console.log(`Senha: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



