-- Passo 1 de 2: Booking passa a ter vários serviços.
--
-- Esta migração é ADITIVA de propósito. Ela cria a tabela de junção, copia os
-- agendamentos existentes para ela e preenche a duração congelada, mas NÃO
-- remove `Booking.serviceId`. Com ela aplicada o app antigo continua rodando,
-- o que dá espaço pra conferir os dados copiados antes de qualquer perda.
-- A remoção de `serviceId` fica na migração seguinte.

-- CreateTable
CREATE TABLE "BookingService" (
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "BookingService_pkey" PRIMARY KEY ("bookingId","serviceId")
);

-- CreateIndex
CREATE INDEX "BookingService_serviceId_idx" ON "BookingService"("serviceId");

-- AddForeignKey
-- ON DELETE CASCADE porque `deleteBooking` apaga a linha de Booking direto;
-- sem isso a junção ficaria com referência órfã.
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "BarbershopService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
-- Entra nullable para que as linhas existentes sejam preenchidas pelo backfill
-- abaixo antes do NOT NULL.
ALTER TABLE "Booking" ADD COLUMN "durationMinutes" INTEGER;

-- Backfill: cada agendamento antigo tinha exatamente um serviço, então vira
-- exatamente uma linha na junção. A contagem das duas tabelas tem que bater.
INSERT INTO "BookingService" ("bookingId", "serviceId")
SELECT "id", "serviceId" FROM "Booking";

-- Backfill: duração congelada = duração atual do serviço que foi reservado.
-- Para os registros históricos essa é a melhor informação disponível.
UPDATE "Booking" b
SET "durationMinutes" = s."durationMinutes"
FROM "BarbershopService" s
WHERE s."id" = b."serviceId";

-- Só agora o NOT NULL: se algum agendamento tivesse ficado sem duração, esta
-- linha falha e a migração inteira reverte, em vez de gravar dado pela metade.
ALTER TABLE "Booking" ALTER COLUMN "durationMinutes" SET NOT NULL;
