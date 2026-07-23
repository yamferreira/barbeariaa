import { endOfDay, format, isValid, parse, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { db } from "@/app/_lib/prisma"
import DateFilter from "@/app/_components/ui/date-filter"
import AdminBookingItem from "@/app/_components/ui/admin-booking-item"

interface AdminAgendamentosPageProps {
  searchParams: Promise<{ data?: string }>
}

const AdminAgendamentosPage = async ({
  searchParams,
}: AdminAgendamentosPageProps) => {
  const { data } = await searchParams
  const parsedDate = data ? parse(data, "yyyy-MM-dd", new Date()) : new Date()
  const selectedDate = isValid(parsedDate) ? parsedDate : new Date()

  const bookings = await db.booking.findMany({
    where: {
      date: {
        gte: startOfDay(selectedDate),
        lte: endOfDay(selectedDate),
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Agendamentos</h1>
        <DateFilter defaultValue={format(selectedDate, "yyyy-MM-dd")} />
      </div>

      {bookings.length === 0 && (
        <p className="text-sm text-gray-400">
          Nenhum agendamento em{" "}
          {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}.
        </p>
      )}

      {bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <AdminBookingItem key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminAgendamentosPage
