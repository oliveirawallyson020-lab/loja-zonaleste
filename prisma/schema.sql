-- Script SQL alternativo para criação das tabelas principais
-- Compatível com Postgres / Neon

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

CREATE TYPE "PurchaseStatus" AS ENUM ('AGUARDANDO', 'APROVADO', 'RECUSADO', 'EXPIRADO');

CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "username_gta" TEXT NOT NULL,
  "senha_hash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "purchases" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "plano" TEXT NOT NULL,
  "valor_pago" DECIMAL(10,2) NOT NULL,
  "comprovante_url" TEXT,
  "token" TEXT UNIQUE,
  "token_usado" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" "PurchaseStatus" NOT NULL DEFAULT 'AGUARDANDO',
  "data_compra" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "data_inicio" TIMESTAMPTZ,
  "data_expiracao" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "purchases_status_idx" ON "purchases"("status");
CREATE INDEX "purchases_plano_idx" ON "purchases"("plano");
CREATE INDEX "purchases_data_expiracao_idx" ON "purchases"("data_expiracao");

CREATE TABLE "admin_logs" (
  "id" TEXT PRIMARY KEY,
  "admin_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "acao" TEXT NOT NULL,
  "referencia_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "admin_logs_admin_id_idx" ON "admin_logs"("admin_id");
CREATE INDEX "admin_logs_created_at_idx" ON "admin_logs"("created_at");

