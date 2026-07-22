import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarImage } from "./avatar"
import { Badge } from "./badge"
import { Card, CardContent } from "./card"
import type {
  Barbershop,
  Booking,
  BarbershopService,
} from "../../generated/prisma"

interface BookingItemProps {
  booking: Booking & {
    service: BarbershopService & {
      barbershop: Barbershop
    }
  }
}

const BookingItem = ({ booking }: BookingItemProps) => {
  const isConfirmed = isFuture(booking.date)

  return (
    <Card>
      <CardContent className="flex justify-between p-0">
        {/* div left */}
        <div className="flex flex-col gap-2 py-5 pl-5">
          <Badge
            className="w-fit"
            variant={isConfirmed ? "default" : "secondary"}
          >
            {isConfirmed ? "Confirmado" : "Finalizado"}
          </Badge>
          <h3 className="font-semibold">{booking.service.name}</h3>

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={booking.service.barbershop.imageUrl} />
            </Avatar>
            <p className="text-sm">{booking.service.barbershop.name}</p>
          </div>
        </div>
        {/* div right */}
        <div className="flex flex-col items-center justify-center border-l px-5 py-5">
          <p className="text-sm capitalize">
            {format(booking.date, "MMMM", { locale: ptBR })}
          </p>
          <p className="text-2xl">{format(booking.date, "dd")}</p>
          <p className="text-sm">{format(booking.date, "HH:mm")}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default BookingItem
