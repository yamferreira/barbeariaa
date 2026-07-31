"use server"

import { revalidatePath } from "next/cache"
import { endOfDay, format, startOfDay } from "date-fns"
import { Prisma } from "@/app/generated/prisma"
import { requireBarbeiro } from "@/app/_lib/auth"
import { toDateOnly } from "@/app/_lib/date-only"
import { db } from "@/app/_lib/prisma"

export interface ConflictingBooking {
  id: string
  clientName: string
  serviceName: string
  time: string
}

type BlockDateResult =
  | { success: true }
  | { success: false; needsConfirmation: true; bookings: ConflictingBooking[] }
  | { success: false; needsConfirmation: false; message: string }

export const getBookingsOnDate = async (
  date: Date,
): Promise<ConflictingBooking[]> => {
  const bookings = await db.booking.findMany({
    where: {
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      status: { not: "CANCELADO" },
    },
    include: {
      service: true,
      user: true,
    },
    orderBy: {
      date: "asc",
    },
  })

  return bookings.map((booking) => ({
    id: booking.id,
    clientName: booking.user.name ?? "Cliente sem nome",
    serviceName: booking.service.name,
    time: format(booking.date, "HH:mm"),
  }))
}

export const blockDate = async (
  date: Date,
  reason?: string,
  confirmed?: boolean,
): Promise<BlockDateResult> => {
  await requireBarbeiro()

  const blockedDay = toDateOnly(date)

  const existingBlock = await db.blockedDate.findUnique({
    where: { date: blockedDay },
  })

  if (existingBlock) {
    return {
      success: false,
      needsConfirmation: false,
      message: "Esse dia já está bloqueado.",
    }
  }

  // Bloquear um dia com agendamentos ativos apenas avisa o barbeiro; nenhum
  // agendamento é cancelado ou alterado automaticamente. Avisar o cliente é
  // responsabilidade manual, fora do sistema.
  if (!confirmed) {
    // `Booking.date` é um DateTime comum, então a busca por conflito usa o dia
    // do calendário local escolhido pelo barbeiro, não o Date normalizado em UTC.
    const bookings = await getBookingsOnDate(date)
    if (bookings.length > 0) {
      return { success: false, needsConfirmation: true, bookings }
    }
  }

  try {
    await db.blockedDate.create({
      data: {
        date: blockedDay,
        reason: reason?.trim() || null,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        needsConfirmation: false,
        message: "Esse dia já está bloqueado.",
      }
    }
    throw error
  }

  revalidatePath("/admin/bloqueios")

  return { success: true }
}

export const unblockDate = async (id: string) => {
  await requireBarbeiro()

  const blockedDate = await db.blockedDate.findUnique({
    where: { id },
  })

  if (!blockedDate) {
    return {
      success: false as const,
      message: "Bloqueio não encontrado.",
    }
  }

  await db.blockedDate.delete({
    where: { id },
  })

  revalidatePath("/admin/bloqueios")

  return { success: true as const }
}
