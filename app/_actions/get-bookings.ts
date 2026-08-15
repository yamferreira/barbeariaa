"use server"

import { endOfDay, startOfDay } from "date-fns"
import { serviceDisplayOrder } from "../_lib/booking-display"
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
 *
 * `durationMinutes` vem junto porque um agendamento ocupa um intervalo, não um
 * ponto: quem monta a lista de horários precisa saber onde cada um termina. É
 * a coluna do próprio Booking, e não a do serviço, porque um agendamento com
 * vários serviços ocupa a soma das durações deles.
 *
 * O retorno é enxuto de propósito: isso atravessa para o client, e a lista de
 * horários não precisa saber quem reservou o quê.
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
    select: { date: true, durationMinutes: true },
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
      services: {
        include: {
          service: {
            include: {
              barbershop: true,
            },
          },
        },
        ...serviceDisplayOrder,
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
      services: {
        include: {
          service: {
            include: {
              barbershop: true,
            },
          },
        },
        ...serviceDisplayOrder,
      },
    },
    orderBy: {
      date: "desc",
    },
  })
}
