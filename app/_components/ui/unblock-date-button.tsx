"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { unblockDate } from "@/app/admin/bloqueios/actions"
import { Button } from "./button"

interface UnblockDateButtonProps {
  blockedDateId: string
}

const UnblockDateButton = ({ blockedDateId }: UnblockDateButtonProps) => {
  const [isPending, startTransition] = useTransition()

  const handleUnblock = () => {
    startTransition(async () => {
      const result = await unblockDate(blockedDateId)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Dia desbloqueado!")
    })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={handleUnblock}
    >
      Desbloquear
    </Button>
  )
}

export default UnblockDateButton
