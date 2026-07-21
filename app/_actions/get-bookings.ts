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
