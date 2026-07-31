import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { db } from "@/app/_lib/prisma"
import { fromDateOnly } from "@/app/_lib/date-only"
import BlockDateForm from "@/app/_components/ui/block-date-form"
import UnblockDateButton from "@/app/_components/ui/unblock-date-button"

const AdminBloqueiosPage = async () => {
  const blockedDates = await db.blockedDate.findMany({
    orderBy: {
      date: "asc",
    },
  })

  return (
    <div className="space-y-6 p-5">
      <h1 className="text-xl font-bold">Bloquear dias</h1>

      <BlockDateForm />

      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase">
          Dias bloqueados
        </h2>

        {blockedDates.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum dia bloqueado.</p>
        )}

        {blockedDates.map((blockedDate) => (
          <div
            key={blockedDate.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-solid p-3"
          >
            <div>
              <p className="text-sm font-semibold capitalize">
                {format(
                  fromDateOnly(blockedDate.date),
                  "dd 'de' MMMM 'de' yyyy",
                  {
                    locale: ptBR,
                  },
                )}
              </p>
              <p className="text-sm text-gray-400">
                {blockedDate.reason ?? "Sem motivo informado"}
              </p>
            </div>

            <UnblockDateButton blockedDateId={blockedDate.id} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminBloqueiosPage
