"use client"

import type {
  Barbershop,
  BarbershopService,
  BlockedDate,
  Booking,
} from "../../generated/prisma"
import Image from "next/image"
import { Button } from "./button"
import { Card, CardContent } from "./card"
import { Calendar } from "./calendar"
import { Input } from "./input"
import { Label } from "./label"
import { ptBR } from "date-fns/locale"
import { useEffect, useMemo, useState } from "react"
import { format, isSameDay, set, startOfToday } from "date-fns"
import { useSession } from "next-auth/react"
import { createBooking } from "@/app/_actions/create-booking"
import { fromDateOnly } from "@/app/_lib/date-only"
import { getBlockedDates } from "@/app/_actions/get-blocked-dates"
import { getBookings } from "@/app/_actions/get-bookings"
import { cn } from "@/app/_lib/utils"
import { toast } from "sonner"

type ServiceWithNumberPrice = Omit<BarbershopService, "price"> & {
  price: number
}

interface BookingFlowProps {
  services: ServiceWithNumberPrice[]
  barbershop: Pick<Barbershop, "name">
}

const TIME_LIST = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
]

const formatPrice = (price: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    price,
  )

const BookingFlow = ({ services, barbershop }: BookingFlowProps) => {
  const { data } = useSession()
  const [selectedServiceId, setSelectedServiceId] = useState<
    string | undefined
  >(services[0]?.id)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [dayBookings, setDayBookings] = useState<Booking[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [guestName, setGuestName] = useState("")
  const [guestPhone, setGuestPhone] = useState("")

  const isGuest = !data?.user

  const selectedService = services.find(
    (service) => service.id === selectedServiceId,
  )

  useEffect(() => {
    getBlockedDates().then(setBlockedDates)
  }, [])

  useEffect(() => {
    if (!selectedDay) return
    getBookings({ date: selectedDay }).then(setDayBookings)
  }, [selectedDay])

  const isDateDisabled = (date: Date) => {
    if (date < startOfToday()) return true
    if (date.getDay() === 0) return true
    return blockedDates.some((blocked) =>
      isSameDay(fromDateOnly(blocked.date), date),
    )
  }

  const timeList = useMemo(() => {
    if (!selectedDay) return []
    return TIME_LIST.filter((time) => {
      const hour = Number(time.split(":")[0])
      const minutes = Number(time.split(":")[1])
      return !dayBookings.some(
        (booking) =>
          booking.date.getHours() === hour &&
          booking.date.getMinutes() === minutes,
      )
    })
  }, [selectedDay, dayBookings])

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setSelectedDay(undefined)
    setSelectedTime(undefined)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDay(date)
    setSelectedTime(undefined)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleConfirmClick = async () => {
    if (!selectedDay || !selectedTime || !selectedService) return
    if (isGuest && !guestName.trim()) {
      toast.error("Informe seu nome para agendar.")
      return
    }

    try {
      const hour = Number(selectedTime.split(":")[0])
      const minutes = Number(selectedTime.split(":")[1])
      const newDate = set(selectedDay, {
        minutes: minutes,
        hours: hour,
      })
      const result = await createBooking({
        serviceId: selectedService.id,
        date: newDate,
        ...(isGuest && {
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim() || undefined,
        }),
      })

      if (!result.success) {
        toast.error(result.message)
        setSelectedTime(undefined)
        getBookings({ date: selectedDay }).then(setDayBookings)
        return
      }

      setSelectedDay(undefined)
      setSelectedTime(undefined)
      toast.success("Reserva criada com sucesso!")
    } catch (error) {
      console.log(error)
      toast.error("Erro ao criar reserva!")
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => handleServiceSelect(service.id)}
            className={cn(
              "flex min-w-[100px] flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors",
              selectedServiceId === service.id
                ? "border-primary bg-primary/10"
                : "bg-secondary border-transparent",
            )}
          >
            <div className="relative h-14 w-14">
              <Image
                src={service.imageUrl}
                alt={service.name}
                fill
                className="rounded-lg object-cover"
              />
            </div>
            <p className="text-xs font-semibold">{service.name}</p>
            <p className="text-primary text-xs font-bold">
              {formatPrice(service.price)}
            </p>
          </button>
        ))}
      </div>

      {selectedService && (
        <Card>
          <CardContent className="space-y-5 p-5">
            <div>
              <h3 className="font-semibold">{selectedService.name}</h3>
              <p className="text-sm text-gray-400">
                {selectedService.description}
              </p>
            </div>

            <Calendar
              mode="single"
              locale={ptBR}
              selected={selectedDay}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              styles={{
                head_cell: {
                  width: "100%",
                  textTransform: "capitalize",
                },
                cell: {
                  width: "100%",
                },
                button: {
                  width: "100%",
                },
                nav_button_previous: {
                  width: "32px",
                  height: "32px",
                },
                nav_button_next: {
                  width: "32px",
                  height: "32px",
                },
                caption: {
                  textTransform: "capitalize",
                },
              }}
            />

            {selectedDay && timeList.length > 0 && (
              <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {timeList.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            )}

            {selectedDay && timeList.length === 0 && (
              <p className="text-sm text-gray-400">
                Nenhum horário disponível para essa data.
              </p>
            )}

            {selectedTime && selectedDay && (
              <Card>
                <CardContent className="space-y-3 p-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold">{selectedService.name}</h2>
                    <p className="text-sm font-bold">
                      {formatPrice(selectedService.price)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-gray-400">Data</h2>
                    <p className="text-sm">
                      {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-gray-400">Horário</h2>
                    <p className="text-sm">{selectedTime}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <h2 className="text-sm text-gray-400">Barbearia</h2>
                    <p className="text-sm">{barbershop.name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedTime && selectedDay && isGuest && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="guest-name">Nome</Label>
                  <Input
                    id="guest-name"
                    placeholder="Seu nome"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="guest-phone">Telefone (opcional)</Label>
                  <Input
                    id="guest-phone"
                    placeholder="(11) 99999-9999"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleConfirmClick}
              disabled={
                !selectedTime || !selectedDay || (isGuest && !guestName.trim())
              }
            >
              Confirmar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BookingFlow
