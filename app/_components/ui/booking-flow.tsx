"use client"

import type {
  Barbershop,
  BarbershopService,
  BlockedDate,
  Booking,
} from "../../generated/prisma"
import Image from "next/image"
import { CheckIcon } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent } from "./card"
import BookingCalendar from "./booking-calendar"
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
import {
  formatDuration,
  getBookingEnd,
  getClosingTime,
  intervalsOverlap,
} from "@/app/_lib/schedule"
import { cn } from "@/app/_lib/utils"
import { toast } from "sonner"

type ServiceWithNumberPrice = Omit<BarbershopService, "price"> & {
  price: number
}

type BookingWithDuration = Booking & {
  service: Pick<BarbershopService, "durationMinutes">
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
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(),
  )
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [dayBookings, setDayBookings] = useState<BookingWithDuration[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [guestName, setGuestName] = useState("")
  const [guestPhone, setGuestPhone] = useState("")

  const isGuest = !data?.user

  const selectedServices = services.filter((service) =>
    selectedServiceIds.has(service.id),
  )
  // A criação do agendamento ainda é por um único serviço (Booking.serviceId);
  // até isso mudar, o primeiro serviço selecionado é o usado pra reservar.
  const selectedService = selectedServices[0]
  const totalDurationMinutes = selectedServices.reduce(
    (sum, service) => sum + service.durationMinutes,
    0,
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

  // Um horário só entra na lista se o intervalo inteiro do novo agendamento
  // (início até início + duração total dos serviços marcados) couber antes do
  // fechamento e não colidir com nenhum agendamento ativo do dia — e cada um
  // deles também ocupa um intervalo, não só o instante em que começa.
  //
  // Isso é só conveniência de UX: a validação que vale é a do servidor, em
  // createBooking.
  const timeList = useMemo(() => {
    if (!selectedDay || totalDurationMinutes === 0) return []
    const closingTime = getClosingTime(selectedDay)

    return TIME_LIST.filter((time) => {
      const hour = Number(time.split(":")[0])
      const minutes = Number(time.split(":")[1])
      const start = set(selectedDay, {
        hours: hour,
        minutes,
        seconds: 0,
        milliseconds: 0,
      })
      const end = getBookingEnd(start, totalDurationMinutes)

      if (end > closingTime) return false

      return !dayBookings.some((booking) =>
        intervalsOverlap(
          start,
          end,
          booking.date,
          getBookingEnd(booking.date, booking.service.durationMinutes),
        ),
      )
    })
  }, [selectedDay, dayBookings, totalDurationMinutes])

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev)
      if (next.has(serviceId)) {
        next.delete(serviceId)
      } else {
        next.add(serviceId)
      }
      return next
    })
    setShowBookingDetails(false)
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
      <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
        {services.map((service) => {
          const isSelected = selectedServiceIds.has(service.id)
          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleServiceToggle(service.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "bg-secondary hover:border-border border-transparent",
              )}
            >
              {isSelected && (
                <span className="bg-primary text-primary-foreground absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full">
                  <CheckIcon className="h-3 w-3" />
                </span>
              )}
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
          )
        })}
      </div>

      {selectedServices.length > 0 && (
        <p className="text-sm text-gray-400">
          {selectedServices.map((service) => service.name).join(" + ")} ={" "}
          {formatDuration(totalDurationMinutes)}
        </p>
      )}

      {!showBookingDetails && (
        <Button
          className="w-full"
          disabled={selectedServices.length === 0}
          onClick={() => setShowBookingDetails(true)}
        >
          Continuar
        </Button>
      )}

      {selectedService && showBookingDetails && (
        <Card>
          <CardContent className="space-y-5 p-5">
            <div>
              <h3 className="font-semibold">{selectedService.name}</h3>
              <p className="text-sm text-gray-400">
                {selectedService.description}
              </p>
            </div>

            <BookingCalendar
              selected={selectedDay}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
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
