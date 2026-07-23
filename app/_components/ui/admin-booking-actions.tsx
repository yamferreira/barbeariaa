"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { updateBookingStatus } from "@/app/admin/agendamentos/actions"
import { Button } from "./button"

interface AdminBookingActionsProps {
  bookingId: string
}

const AdminBookingActions = ({ bookingId }: AdminBookingActionsProps) => {
  const [isPending, startTransition] = useTransition()

  const handleUpdateStatus = (status: "CONCLUIDO" | "CANCELADO") => {
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, status)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success(
        status === "CONCLUIDO"
          ? "Agendamento concluído!"
          : "Agendamento cancelado!",
      )
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => handleUpdateStatus("CONCLUIDO")}
      >
        Concluir
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        disabled={isPending}
        onClick={() => handleUpdateStatus("CANCELADO")}
      >
        Cancelar
      </Button>
    </div>
  )
}

export default AdminBookingActions
