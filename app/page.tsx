import Header from "./_components/ui/header"
import { db } from "./_lib/prisma"
import BookingItem from "./_components/ui/booking-item"
import BookingFlow from "./_components/ui/booking-flow"
import { auth } from "./_lib/auth-config"
import { getConfirmedBookings } from "./_actions/get-bookings"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const Home = async () => {
  const session = await auth()
  const barbershop = await db.barbershop.findFirst({
    include: { services: true },
  })
  const confirmedBookings = session?.user
    ? await getConfirmedBookings(session.user.id as string)
    : []
  const firstName = session?.user?.name?.split(" ")[0]
  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })
  const capitalizedToday = today.charAt(0).toUpperCase() + today.slice(1)

  const services = barbershop
    ? barbershop.services.map((service) => ({
        ...service,
        price: Number(service.price),
      }))
    : []

  return (
    <div>
      <Header />
      <div className="space-y-6 p-5">
        <div>
          <h2 className="text-xl font-bold">
            Olá{firstName ? `, ${firstName}` : ""}!
          </h2>
          <p className="text-sm text-gray-400">
            {barbershop ? `${barbershop.name} · ` : ""}
            {capitalizedToday}.
          </p>
        </div>

        {confirmedBookings.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-bold text-gray-400 uppercase">
              Agendamentos
            </h2>
            <div className="space-y-3">
              {confirmedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={booking} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-3 text-xs font-bold text-gray-400 uppercase">
            Novo agendamento
          </h2>
          {barbershop ? (
            <BookingFlow
              services={services}
              barbershop={{ name: barbershop.name }}
            />
          ) : (
            <p className="text-sm text-gray-400">
              Nenhuma barbearia cadastrada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
