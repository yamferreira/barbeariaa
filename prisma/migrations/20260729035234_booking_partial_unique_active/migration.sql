-- DropIndex
DROP INDEX "Booking_serviceId_date_key";

-- CreateIndex
CREATE INDEX "Booking_serviceId_date_idx" ON "Booking"("serviceId", "date");

-- CreateIndex (partial unique): garante no máximo um agendamento ativo por
-- (serviceId, date). Agendamentos CANCELADO ficam de fora, liberando o
-- horário para novo agendamento/reagendamento. Índice parcial não é
-- expressável no schema Prisma, por isso é criado via SQL cru aqui.
CREATE UNIQUE INDEX "Booking_serviceId_date_active_key" ON "Booking"("serviceId", "date") WHERE "status" <> 'CANCELADO';
