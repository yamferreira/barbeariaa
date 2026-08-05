-- Unicidade de agendamento ativo passa de (serviceId, date) para apenas (date).
--
-- A granularidade antiga vinha do modelo multi-barbearia, em que cada barbearia
-- tinha suas próprias linhas de serviço. Com um barbeiro só, o recurso escasso é
-- o horário dele: um Corte às 10:00 e uma Barba às 10:00 são dois clientes ao
-- mesmo tempo, e o índice antigo permitia os dois.
--
-- O predicado parcial continua o mesmo: agendamentos CANCELADO ficam de fora,
-- então o horário volta a ficar livre depois de um cancelamento.

-- DropIndex
DROP INDEX "Booking_serviceId_date_active_key";

-- CreateIndex
CREATE UNIQUE INDEX "Booking_date_active_key" ON "Booking"("date") WHERE "status" <> 'CANCELADO';
