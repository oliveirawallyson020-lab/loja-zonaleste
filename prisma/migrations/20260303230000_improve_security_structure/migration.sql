-- CreateEnum
CREATE TYPE "VipPlan" AS ENUM ('MENSAL', 'SEMESTRAL', 'ANUAL');

-- AlterTable: plano TEXT -> VipPlan
ALTER TABLE "purchases" ALTER COLUMN "plano" TYPE "VipPlan" USING "plano"::"VipPlan";

-- AlterTable: novas colunas em purchases
ALTER TABLE "purchases" ADD COLUMN "token_gerado_em" TIMESTAMP(3),
ADD COLUMN "token_expira_em" TIMESTAMP(3),
ADD COLUMN "ip_compra" TEXT,
ADD COLUMN "aprovado_por_id" TEXT,
ADD COLUMN "aprovado_em" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "purchases_user_id_idx" ON "purchases"("user_id");

-- CreateIndex
CREATE INDEX "purchases_aprovado_por_id_idx" ON "purchases"("aprovado_por_id");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "users_username_gta_key" ON "users"("username_gta");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_aprovado_por_id_fkey" FOREIGN KEY ("aprovado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
