"use server"

import { startOfDay } from "date-fns"
import { Prisma } from "../generated/prisma"
import { db } from "../_lib/prisma"
import { auth } from "../api/auth/[...nextauth]/route"

interface CreateBookingParams {
  serviceId: string
  date: Date
}

export const createBooking = async (params: CreateBookingParams) => {
  const session = await auth()
  if (!session?.user) {
    return {
      success: false as const,
      message: "Você precisa estar logado para agendar.",
    }
  }

  if (params.date.getDay() === 0) {
    return {
      success: false as const,
      message: "Barbearia fechada aos domingos.",
    }
  }

  const blockedDate = await db.blockedDate.findUnique({
    where: { date: startOfDay(params.date) },
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
        ...params,
        userId: session.user.id as string,
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
