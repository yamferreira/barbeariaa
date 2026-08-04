"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { syncHolidays } from "@/app/admin/bloqueios/sync-holidays"
import { Button } from "./button"

const SyncHolidaysButton = () => {
  const [isPending, startTransition] = useTransition()

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncHolidays()

      if (!result.success) {
        toast.error(result.message)
        return
      }

      if (result.created === 0) {
        toast.success("Os feriados já estavam bloqueados.")
        return
      }

      toast.success(
        result.created === 1
          ? "1 feriado bloqueado automaticamente"
          : `${result.created} feriados bloqueados automaticamente`,
      )
    })
  }

  return (
    <Button
      className="w-full"
      variant="secondary"
      disabled={isPending}
      onClick={handleSync}
    >
      {isPending ? "Sincronizando..." : "Sincronizar feriados"}
    </Button>
  )
}

export default SyncHolidaysButton
