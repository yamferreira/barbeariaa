/**
 * Helpers para a coluna `BlockedDate.date`, que é `@db.Date` (dia sem hora).
 *
 * O Prisma grava e lê esse tipo pela porção UTC do `Date`, então um valor vindo
 * do banco chega como meia-noite UTC. Formatar ou comparar isso no fuso local
 * desloca o dia (em UTC-3, `2026-08-01T00:00:00Z` vira 31/07 às 21h). Estas
 * funções fazem a ponte entre "dia do calendário local" e o `Date` que o Prisma
 * espera, e por serem baseadas em UTC funcionam em qualquer fuso de servidor.
 */

/** Dia do calendário local -> `Date` que o Prisma grava como esse mesmo dia. */
export const toDateOnly = (date: Date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

/** `Date` vindo do banco (meia-noite UTC) -> mesmo dia no fuso local. */
export const fromDateOnly = (date: Date) =>
  new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
