"use server"

import { endOfDay, startOfDay } from "date-fns"
import { db } from "../_lib/prisma"

interface GetBookingsParams {
  date: Date
}

/**
 * Agendamentos que ocupam a agenda no dia, para montar a lista de horários.
 *
 * Não filtra por serviço de propósito: é um barbeiro só, então qualquer
 * agendamento ativo às 10:00 ocupa as 10:00, seja Corte ou Barba. Os dois
 * filtros espelham o índice `Booking_date_active_key`, que é unique em `date`
 * com `WHERE status <> 'CANCELADO'` — horário cancelado volta a ficar livre.
 */
export const getBookings = async ({ date }: GetBookingsParams) => {
  return db.booking.findMany({
    where: {
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      status: { not: "CANCELADO" },
    },
  })
}

export const getConfirmedBookings = async (userId: string) => {
  return db.booking.findMany({
    where: {
      userId,
      date: {
        gte: new Date(),
      },
    },
    include: {
      service: {
        include: {
          barbershop: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  })
}

export const getFinishedBookings = async (userId: string) => {
  return db.booking.findMany({
    where: {
      userId,
      date: {
        lt: new Date(),
      },
    },
    include: {
      service: {
        include: {
          barbershop: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  })
}
