"use server"

import { revalidatePath } from "next/cache"
import { auth } from "../api/auth/[...nextauth]/route"
import { db } from "../_lib/prisma"

export const deleteBooking = async (bookingId: string) => {
  const session = await auth()

  if (!session?.user) {
    return {
      success: false as const,
      message: "Você precisa estar logado para cancelar um agendamento.",
    }
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking || booking.userId !== session.user.id) {
    return {
      success: false as const,
      message: "Agendamento não encontrado.",
    }
  }

  await db.booking.delete({
    where: { id: bookingId },
  })

  revalidatePath("/")
  revalidatePath("/bookings")

  return { success: true as const }
}
