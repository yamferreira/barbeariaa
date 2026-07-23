import { endOfDay, format, isFuture, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { db } from "@/app/_lib/prisma"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Badge } from "@/app/_components/ui/badge"

const AdminPage = async () => {
  const today = new Date()

  const bookings = await db.booking.findMany({
    where: {
      date: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
    include: {
      service: true,
      user: true,
    },
    orderBy: {
      date: "asc",
    },
  })

  return (
    <div className="space-y-6 p-5">
      <h1 className="text-xl font-bold">Agendamentos de hoje</h1>

      {bookings.length === 0 && (
        <p className="text-sm text-gray-400">Nenhum agendamento pra hoje.</p>
      )}

      {bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const isConfirmed = isFuture(booking.date)

            return (
              <Card key={booking.id}>
                <CardContent className="flex items-center justify-between gap-3 p-5">
                  <div className="space-y-1">
                    <Badge variant={isConfirmed ? "default" : "secondary"}>
                      {isConfirmed ? "Confirmado" : "Finalizado"}
                    </Badge>
                    <p className="font-semibold">{booking.user.name}</p>
                    <p className="text-sm text-gray-400">
                      {booking.service.name}
                    </p>
                  </div>

                  <p className="text-lg font-bold">
                    {format(booking.date, "HH:mm", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminPage
