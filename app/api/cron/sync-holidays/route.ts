import { createHash, timingSafeEqual } from "crypto"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { syncNationalHolidays } from "@/app/_lib/holidays"

/**
 * Sincronização automática dos feriados, para ser chamada por um agendador
 * externo (cron da plataforma de hosting, crontab do servidor, etc.):
 *
 *     curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/sync-holidays
 *
 * Ver `DEPLOY.md` para o passo a passo por plataforma. Rodar mais de uma vez é
 * inofensivo: a sincronização só cria o que ainda não existe.
 */

// A rota lê env e banco a cada chamada; nunca deve ser pré-renderizada.
export const dynamic = "force-dynamic"

/** Compara em tempo constante, via digest, para aceitar tamanhos diferentes. */
const secretMatches = (received: string, expected: string) =>
  timingSafeEqual(
    createHash("sha256").update(received).digest(),
    createHash("sha256").update(expected).digest(),
  )

export const GET = async (request: Request) => {
  const expected = process.env.CRON_SECRET

  // Sem segredo configurado a rota fica fechada, em vez de virar um gatilho
  // público. Um deploy que esqueceu a variável falha alto, e não em silêncio.
  if (!expected) {
    console.error(
      "CRON_SECRET não configurado; /api/cron/sync-holidays negado.",
    )
    return NextResponse.json(
      { error: "Cron não configurado." },
      { status: 500 },
    )
  }

  const header = request.headers.get("authorization") ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""

  if (!token || !secretMatches(token, expected)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const result = await syncNationalHolidays()

  if (!result.success) {
    // A falha aqui é da BrasilAPI, não da requisição do agendador.
    return NextResponse.json({ error: result.message }, { status: 502 })
  }

  if (result.created > 0) {
    revalidatePath("/admin/bloqueios")
  }

  console.log(
    `Sincronização de feriados: ${result.created} dia(s) bloqueado(s).`,
  )

  return NextResponse.json({ created: result.created })
}
