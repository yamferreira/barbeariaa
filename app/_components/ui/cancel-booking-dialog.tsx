"use client"

import { useState } from "react"
import { toast } from "sonner"
import { deleteBooking } from "../../_actions/delete-booking"
import { Button } from "./button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"

interface CancelBookingDialogProps {
  bookingId: string
}

const CancelBookingDialog = ({ bookingId }: CancelBookingDialogProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCancelClick = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteBooking(bookingId)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success("Agendamento cancelado com sucesso!")
      setIsDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao cancelar agendamento. Tente novamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive mt-1 w-full max-w-40"
        >
          Cancelar
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[90%] rounded-lg">
        <DialogHeader>
          <DialogTitle>Cancelar reserva</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja cancelar esse agendamento? Essa ação não pode
            ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-3">
          <DialogClose asChild>
            <Button variant="secondary" className="w-full">
              Voltar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleCancelClick}
            disabled={isDeleting}
          >
            {isDeleting ? "Cancelando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CancelBookingDialog
