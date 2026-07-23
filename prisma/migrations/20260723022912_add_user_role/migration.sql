-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENTE', 'BARBEIRO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CLIENTE';
