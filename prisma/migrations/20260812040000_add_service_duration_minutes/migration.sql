-- Duração de cada serviço, usada futuramente para calcular a agenda.
-- Adicionada nullable, populada por nome pros registros reais já existentes,
-- e só então marcada NOT NULL, pra não quebrar as linhas atuais de
-- BarbershopService antes do backfill.

-- AlterTable
ALTER TABLE "BarbershopService" ADD COLUMN "durationMinutes" INTEGER;

-- Backfill dos serviços existentes
UPDATE "BarbershopService" SET "durationMinutes" = 30 WHERE "name" = 'Corte de Cabelo';
UPDATE "BarbershopService" SET "durationMinutes" = 30 WHERE "name" = 'Barba';
UPDATE "BarbershopService" SET "durationMinutes" = 20 WHERE "name" = 'Sobrancelha';
UPDATE "BarbershopService" SET "durationMinutes" = 10 WHERE "name" = 'Pézinho';
UPDATE "BarbershopService" SET "durationMinutes" = 30 WHERE "name" = 'Hidratação';
UPDATE "BarbershopService" SET "durationMinutes" = 20 WHERE "name" = 'Massagem';

-- AlterTable
ALTER TABLE "BarbershopService" ALTER COLUMN "durationMinutes" SET NOT NULL;
