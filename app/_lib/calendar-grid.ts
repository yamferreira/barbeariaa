import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"

export const getMonthGridRange = (month: Date) => ({
  start: startOfWeek(startOfMonth(month), { locale: ptBR }),
  end: endOfWeek(endOfMonth(month), { locale: ptBR }),
})
