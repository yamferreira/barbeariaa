"use server"

import { Prisma } from "../generated/prisma"
import { toDateOnly } from "../_lib/date-only"
import { db } from "../_lib/prisma"
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
