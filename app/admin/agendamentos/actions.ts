"use server"

import { revalidatePath } from "next/cache"
import { set } from "date-fns"
import { Prisma } from "@/app/generated/prisma"
import { requireBarbeiro } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"

export const updateBookingStatus = async (
  bookingId: string,
  status: "CONCLUIDO" | "CANCELADO",
) => {
  await requireBarbeiro()

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) {
    return {
      success: false as const,
      message: "Agendamento não encontrado.",
    }
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/agendamentos")

  return { success: true as const }
}

export const rescheduleBooking = async (
  bookingId: string,
  novaData: Date,
  novoHorario: string,
) => {
  await requireBarbeiro()

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) {
    return {
      success: false as const,
      message: "Agendamento não encontrado.",
    }
  }

  const [hours, minutes] = novoHorario.split(":").map(Number)
  const newDate = set(novaData, {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  })

  const conflictingBooking = await db.booking.findFirst({
    where: {
      serviceId: booking.serviceId,
      date: newDate,
      id: { not: bookingId },
    },
  })

  if (conflictingBooking) {
    return {
      success: false as const,
      message: "Já existe um agendamento nesse horário.",
    }
  }

  try {
    await db.booking.update({
      where: { id: bookingId },
      data: { date: newDate },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false as const,
        message: "Já existe um agendamento nesse horário.",
      }
    }
    throw error
  }

  revalidatePath("/admin")
  revalidatePath("/admin/agendamentos")

  return { success: true as const }
}
