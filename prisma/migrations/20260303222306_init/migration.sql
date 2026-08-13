-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('AGUARDANDO', 'APROVADO', 'RECUSADO', 'EXPIRADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username_gta" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "valor_pago" DECIMAL(10,2) NOT NULL,
    "comprovante_url" TEXT,
    "token" TEXT,
    "token_usado" BOOLEAN NOT NULL DEFAULT false,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "data_compra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_inicio" TIMESTAMP(3),
    "data_expiracao" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "referencia_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_token_key" ON "purchases"("token");

-- CreateIndex
CREATE INDEX "purchases_status_idx" ON "purchases"("status");

-- CreateIndex
CREATE INDEX "purchases_plano_idx" ON "purchases"("plano");

-- CreateIndex
CREATE INDEX "purchases_data_expiracao_idx" ON "purchases"("data_expiracao");

-- CreateIndex
CREATE INDEX "admin_logs_admin_id_idx" ON "admin_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_logs_created_at_idx" ON "admin_logs"("created_at");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
