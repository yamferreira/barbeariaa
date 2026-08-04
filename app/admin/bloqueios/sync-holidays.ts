"use server"

import { revalidatePath } from "next/cache"
import { requireBarbeiro } from "@/app/_lib/auth"
import {
  syncNationalHolidays,
  type SyncHolidaysResult,
} from "@/app/_lib/holidays"

/** Sincronização disparada à mão pelo barbeiro em /admin/bloqueios. */
export const syncHolidays = async (): Promise<SyncHolidaysResult> => {
  await requireBarbeiro()

  const result = await syncNationalHolidays()

  if (result.success && result.created > 0) {
    revalidatePath("/admin/bloqueios")
  }

  return result
}
