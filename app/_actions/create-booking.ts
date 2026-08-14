"use server"

import { endOfDay, startOfDay } from "date-fns"
import { Prisma } from "../generated/prisma"
import { toDateOnly } from "../_lib/date-only"
import { db } from "../_lib/prisma"
import {
  CLOSING_HOUR,
  getBookingEnd,
  getClosingTime,
  intervalsOverlap,
} from "../_lib/schedule"
import { auth } from "../_lib/auth-config"

interface CreateBookingParams {
  serviceId: string
  date: Date
  guestName?: string
  guestPhone?: string
}

export const createBooking = async (params: CreateBookingParams) => {
  const session = await auth()

  let guestName: string | undefined
  let guestPhone: string | undefined

  if (!session?.user) {
    guestName = params.guestName?.trim()
    if (!guestName) {
      return {
        success: false as const,
        message: "Informe seu nome para agendar sem login.",
      }
    }
    guestPhone = params.guestPhone?.trim() || undefined
  }

  if (params.date.getDay() === 0) {
    return {
      success: false as const,
      message: "Barbearia fechada aos domingos.",
    }
  }

  const blockedDate = await db.blockedDate.findUnique({
    where: { date: toDateOnly(params.date) },
  })
  if (blockedDate) {
    return {
      success: false as const,
      message: `Indisponível: ${blockedDate.reason ?? "Data bloqueada"}`,
    }
  }

  // Validação real de conflito. O índice único parcial só protege contra
  // `date` idêntica, e um agendamento ocupa um intervalo: às 11:00 com 70min
  // atropela o das 12:00 sem repetir a data. A lista de horários do client
  // filtra isso por conveniência, mas pode estar desatualizada.
  const service = await db.barbershopService.findUnique({
    where: { id: params.serviceId },
    select: { durationMinutes: true },
  })
  if (!service) {
    return {
      success: false as const,
      message: "Serviço não encontrado.",
    }
  }

  const newStart = params.date
  const newEnd = getBookingEnd(newStart, service.durationMinutes)

  if (newEnd > getClosingTime(newStart)) {
    return {
      success: false as const,
      message: `Esse horário ultrapassa o fechamento (${CLOSING_HOUR}h). Escolha outro.`,
    }
  }

  const dayBookings = await db.booking.findMany({
    where: {
      date: {
        gte: startOfDay(params.date),
        lte: endOfDay(params.date),
      },
      status: { not: "CANCELADO" },
    },
    include: {
      service: { select: { durationMinutes: true } },
    },
  })

  const hasConflict = dayBookings.some((booking) =>
    intervalsOverlap(
      newStart,
      newEnd,
      booking.date,
      getBookingEnd(booking.date, booking.service.durationMinutes),
    ),
  )

  if (hasConflict) {
    return {
      success: false as const,
      message: "Esse horário conflita com outro agendamento. Escolha outro.",
    }
  }

  try {
    await db.booking.create({
      data: {
        serviceId: params.serviceId,
        date: params.date,
        userId: session?.user?.id as string | undefined,
        guestName,
        guestPhone,
      },
    })
    return { success: true as const }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false as const,
        message: "Esse horário acabou de ser reservado. Escolha outro horário.",
      }
    }
    throw error
  }
}
