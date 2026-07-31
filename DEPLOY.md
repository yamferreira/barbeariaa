# Deploy

Checklist para levar mudanças de banco (migrações Prisma) para produção.
Stack: Next.js + Prisma + PostgreSQL (Neon).

## Conceito em uma linha

No **desenvolvimento** você usa `prisma migrate dev` (cria e aplica migração
no banco de dev). Na **produção** você usa `prisma migrate deploy`, que apenas
aplica as migrações já commitadas, em ordem, sem gerar nada novo.

Você pode acumular várias migrações no dev e aplicá-las todas de uma vez no
deploy — não precisa aplicar uma por uma.

## Passo a passo do deploy

1. Garanta que tudo está commitado e no remoto:

   ```bash
   git status          # working tree limpo
   git push origin master
   ```

2. No ambiente que tem acesso ao banco de produção, com a `DATABASE_URL` de
   **produção** carregada:

   ```bash
   git pull                    # traz todas as migrações commitadas
   npx prisma migrate deploy   # aplica as pendentes, em ordem
   npx prisma generate         # regenera o client (se o deploy não fizer isso)
   ```

3. Build e deploy da app normalmente (`npm run build` / plataforma de hosting).

`migrate deploy` é idempotente: só aplica o que ainda não rodou. Rodar de novo
sem migrações novas não faz nada.

## Cuidados

- **Nunca edite uma migração já aplicada em produção.** Ela é imutável. Para
  corrigir algo, crie uma migração **nova** por cima.
- **Não altere o schema de produção por fora do Prisma** (SQL manual, alteração
  no painel do Neon). Isso gera _drift_ e o `migrate deploy` pode falhar. Se
  precisar, faça via migração.
- **Dev e produção devem compartilhar o mesmo histórico de migrações.** É o que
  garante que `migrate deploy` aplique a sequência limpa.
- **Migrações que apagam ou transformam dados** (remover coluna, tornar campo
  obrigatório, mudar tipo) pedem revisão do SQL gerado antes de ir pra prod,
  por risco de perda de dado. As de índice/coluna nova são de baixo risco.
- **Migrações com SQL cru** (ex.: índices parciais — ver abaixo) não são
  validadas pelo Prisma sozinho. Vale testar num branch do banco antes.

## Testar antes com um branch do Neon (recomendado)

O Neon permite criar um branch do banco (cópia com os dados) para ensaiar o
deploy sem risco:

1. Crie um branch do banco no painel do Neon.
2. Aponte `DATABASE_URL` para o branch e rode `npx prisma migrate deploy`.
3. Confirme que aplicou sem erro; depois descarte o branch.

## Notas específicas deste projeto

- A migração `20260729035234_booking_partial_unique_active` usa **SQL cru** para
  criar um índice único **parcial**:

  ```sql
  CREATE UNIQUE INDEX "Booking_serviceId_date_active_key"
    ON "Booking"("serviceId", "date")
    WHERE "status" <> 'CANCELADO';
  ```

  Ele garante no máximo um agendamento **ativo** por `(serviceId, date)`,
  deixando horários `CANCELADO` livres para novo agendamento. O Prisma não
  expressa índice parcial no schema declarativo, por isso ele existe só na
  migração (o schema tem um `@@index` comum no lugar).

- **Advisory lock no Neon:** ao rodar migrações pela conexão _pooled_
  (host com `-pooler`), o Prisma pode falhar com timeout de advisory lock
  (`P1002`) — o PgBouncer não suporta advisory lock de sessão. Costuma resolver
  ao tentar de novo, ou usando a conexão **direta** (host sem `-pooler`) para
  as migrações.

- **`prisma generate` no Windows:** se o dev server estiver rodando, ele trava a
  DLL do query engine e o `generate` falha com `EPERM`. Pare o servidor antes de
  regenerar o client.
