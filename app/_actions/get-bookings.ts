"use server"

import { endOfDay, startOfDay } from "date-fns"
import { db } from "../_lib/prisma"

interface GetBookingsParams {
  serviceId: string
  date: Date
}

export const getBookings = async ({ serviceId, date }: GetBookingsParams) => {
  return db.booking.findMany({
    where: {
      serviceId,
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
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
