/*
  Warnings:

  - You are about to drop the column `acao` on the `admin_logs` table. All the data in the column will be lost.
  - Added the required column `action` to the `admin_logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AdminAction" AS ENUM ('APPROVE', 'REJECT', 'REVOKE', 'MARK_USED');

-- AlterTable
ALTER TABLE "admin_logs" DROP COLUMN "acao",
ADD COLUMN     "action" "AdminAction" NOT NULL;
