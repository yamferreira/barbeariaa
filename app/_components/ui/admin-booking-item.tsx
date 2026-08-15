import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type {
  Booking,
  BarbershopService,
  User,
  BookingStatus,
} from "@/app/generated/prisma"
import {
  formatBookingEnd,
  formatServiceNames,
} from "@/app/_lib/booking-display"
import { Card, CardContent } from "./card"
import { Badge } from "./badge"
import AdminBookingActions from "./admin-booking-actions"
import RescheduleBookingDialog from "./reschedule-booking-dialog"

interface AdminBookingItemProps {
  booking: Booking & {
    services: { service: BarbershopService }[]
    user: User | null
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
          <p className="font-semibold">
            {booking.user?.name ?? booking.guestName ?? "Cliente sem nome"}
          </p>
          <p className="text-sm text-gray-400">
            {formatServiceNames(booking.services)}
          </p>
          {booking.status === "CONFIRMADO" && (
            <div className="flex flex-wrap items-center gap-2">
              <AdminBookingActions bookingId={booking.id} />
              <RescheduleBookingDialog
                bookingId={booking.id}
                currentDate={booking.date}
              />
            </div>
          )}
        </div>

        {/* O barbeiro precisa da faixa, não do início: é ela que diz quando a
            cadeira volta a ficar livre. */}
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold">
            {format(booking.date, "HH:mm", { locale: ptBR })}
          </p>
          <p className="text-xs text-gray-400">
            até {formatBookingEnd(booking.date, booking.durationMinutes)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdminBookingItem
