import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type {
  Booking,
  BarbershopService,
  User,
  BookingStatus,
} from "@/app/generated/prisma"
import { Card, CardContent } from "./card"
import { Badge } from "./badge"
import AdminBookingActions from "./admin-booking-actions"

interface AdminBookingItemProps {
  booking: Booking & {
    service: BarbershopService
    user: User
  }
}

const statusLabel: Record<BookingStatus, string> = {
  CONFIRMADO: "Confirmado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}

const statusVariant: Record<
  BookingStatus,
  "default" | "secondary" | "destructive"
> = {
  CONFIRMADO: "default",
  CONCLUIDO: "secondary",
  CANCELADO: "destructive",
}

const AdminBookingItem = ({ booking }: AdminBookingItemProps) => {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="space-y-1">
          <Badge variant={statusVariant[booking.status]}>
            {statusLabel[booking.status]}
          </Badge>
          <p className="font-semibold">{booking.user.name}</p>
          <p className="text-sm text-gray-400">{booking.service.name}</p>
          {booking.status === "CONFIRMADO" && (
            <AdminBookingActions bookingId={booking.id} />
          )}
        </div>

        <p className="text-lg font-bold">
          {format(booking.date, "HH:mm", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  )
}

export default AdminBookingItem
