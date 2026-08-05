"use server"

import { revalidatePath } from "next/cache"
import { set } from "date-fns"
import { Prisma } from "@/app/generated/prisma"
import { requireBarbeiro } from "@/app/_lib/auth"
import { toDateOnly } from "@/app/_lib/date-only"
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

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(novoHorario)) {
    return {
      success: false as const,
      message: "Horário inválido. Use o formato HH:mm.",
    }
  }

  const [hours, minutes] = novoHorario.split(":").map(Number)
  const newDate = set(novaData, {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  })

  if (newDate.getDay() === 0) {
    return {
      success: false as const,
      message: "Barbearia fechada aos domingos.",
    }
  }

  const blockedDate = await db.blockedDate.findUnique({
    where: { date: toDateOnly(newDate) },
  })
  if (blockedDate) {
    return {
      success: false as const,
      message: `Indisponível: ${blockedDate.reason ?? "Data bloqueada"}`,
    }
  }

  // Sem filtro por serviço: com um barbeiro só, qualquer agendamento ativo
  // naquele horário conflita, independente do serviço. Espelha o índice
  // `Booking_date_active_key`.
  const conflictingBooking = await db.booking.findFirst({
    where: {
      date: newDate,
      id: { not: bookingId },
      status: { not: "CANCELADO" },
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
