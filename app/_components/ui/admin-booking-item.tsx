import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Booking, BarbershopService, User } from "@/app/generated/prisma"
import { Card, CardContent } from "./card"
import { Badge } from "./badge"

interface AdminBookingItemProps {
  booking: Booking & {
    service: BarbershopService
    user: User
  }
}

const AdminBookingItem = ({ booking }: AdminBookingItemProps) => {
  const isConfirmed = isFuture(booking.date)

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="space-y-1">
          <Badge variant={isConfirmed ? "default" : "secondary"}>
            {isConfirmed ? "Confirmado" : "Finalizado"}
          </Badge>
          <p className="font-semibold">{booking.user.name}</p>
          <p className="text-sm text-gray-400">{booking.service.name}</p>
        </div>

        <p className="text-lg font-bold">
          {format(booking.date, "HH:mm", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  )
}

export default AdminBookingItem
