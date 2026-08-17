# LuizBarber

Sistema de agendamento online para uma barbearia com **um único barbeiro**. O cliente agenda sozinho, sem precisar ligar, mandar mensagem ou criar conta — e o barbeiro gerencia toda a operação por um painel administrativo.

> O projeto nasceu como um marketplace multi-barbearia (inspirado em um curso) e foi convertido para atender a um cliente real: um barbeiro único, com fluxo de agendamento simplificado e direto na home.

---

## Sumário

- [Visão geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Modelo de dados](#modelo-de-dados)
- [Funcionalidades](#funcionalidades)
  - [Para o cliente](#para-o-cliente)
  - [Para o barbeiro (admin)](#para-o-barbeiro-admin)
- [Regras de negócio](#regras-de-negócio)
- [Limitações conhecidas](#limitações-conhecidas)
- [Como rodar localmente](#como-rodar-localmente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Roadmap](#roadmap)

---

## Visão geral

O app resolve um problema simples e caro para barbearias pequenas: **a agenda não pode viver na cabeça de uma pessoa só**. Antes, cada agendamento era uma troca de mensagens manual — o cliente pergunta, o barbeiro confere, responde, anota. O LuizBarber transforma isso em um fluxo autoatendido: o cliente abre a home, escolhe o(s) serviço(s), vê os horários realmente disponíveis e confirma — sem depender de ida e volta.

Como existe apenas um barbeiro, a agenda é tratada como um **recurso único e serializado**: não é possível ter dois atendimentos simultâneos, mesmo que sejam serviços diferentes. Essa premissa está refletida na arquitetura, no banco de dados e nas regras de validação de horário.

---

## Tecnologias

**Framework e linguagem**
- [Next.js 15.5](https://nextjs.org/) (App Router) — Server Components por padrão, Server Actions para toda escrita
- React 19
- TypeScript (modo strict)

**Dados**
- [Prisma 5.15](https://www.prisma.io/) + PostgreSQL ([Neon](https://neon.tech/))
- Conexão dupla (`url` via pooler / `directUrl` direto) — necessária porque o Prisma Migrate usa advisory locks de sessão, incompatíveis com connection pooling em modo transaction
- Migrações versionadas, incluindo SQL cru para um índice único parcial que o Prisma não expressa de forma declarativa

**Autenticação**
- [Auth.js / NextAuth v5](https://authjs.dev/) (beta), provider Google, `PrismaAdapter`
- Sessão com estratégia `database`, `maxAge` de 90 dias
- Controle de acesso por `role` (`CLIENTE` / `BARBEIRO`)

**Interface**
- Tailwind CSS v4
- [shadcn/ui](https://ui.shadcn.com/) sobre primitivos Radix (dialog, sheet, avatar, label, slot)
- lucide-react, sonner (toasts), next-themes
- date-fns v4 (locale `pt-BR`)
- Calendário de agendamento construído do zero (`booking-calendar.tsx`), para suportar regras de negócio de dias desabilitados

**Qualidade e automação**
- ESLint + Prettier (com `prettier-plugin-tailwindcss`)
- Husky + lint-staged (roda lint/format em cada commit)
- [BrasilAPI](https://brasilapi.com.br/) como fonte de feriados nacionais
- Rota de cron protegida por Bearer token, comparado em tempo constante (`timingSafeEqual` sobre digest SHA-256), com falha fechada se o segredo não estiver configurado

---

## Modelo de dados

```
User (role: CLIENTE | BARBEIRO)
Account / Session / VerificationToken   (Auth.js)

Barbershop ──< BarbershopService (price, durationMinutes)
                     │
                     ├──< BookingService (tabela de junção)
                     │            │
                     └──────< Booking (date, status, durationMinutes, guestName, guestPhone)

BlockedDate (date @unique, reason)
```

Decisões de modelagem relevantes:

- **`Booking.durationMinutes` é um snapshot.** A duração é congelada no momento da reserva, e não recalculada a partir do catálogo de serviços — editar a duração de um serviço no futuro não pode reescrever agendamentos já feitos.
- **Índice único parcial** (`Booking_date_active_key`, em `date WHERE status <> 'CANCELADO'`) garante, no nível do banco, que não existam dois agendamentos ativos exatamente no mesmo instante — e libera o slot automaticamente quando um agendamento é cancelado.
- **Agendamentos suportam múltiplos serviços** via tabela de junção `BookingService` (relação N:N com `BarbershopService`).

---

## Funcionalidades

### Para o cliente

| Recurso | Descrição |
|---|---|
| Home única | Saudação, data por extenso, agendamentos confirmados e fluxo de marcação — tudo em uma tela |
| Múltiplos serviços | Seleção em grid; duração e preço total somados em tempo real |
| Calendário inteligente | Domingos, datas passadas e dias bloqueados já aparecem desabilitados |
| Horários reais | Só aparecem os horários que cabem sem colidir com outro agendamento nem ultrapassar o fechamento |
| Agendamento sem login | Basta informar o nome (telefone opcional) — login com Google é só uma opção |
| Histórico | Agendamentos confirmados e finalizados, separados, com faixa de horário |
| Cancelamento | Pelo próprio cliente, com confirmação |
| Página informativa | Endereço, telefones, descrição e catálogo de serviços com preço e duração |

### Para o barbeiro (`/admin`)

| Recurso | Descrição |
|---|---|
| Dashboard | Agendamentos do dia, ordenados por horário |
| Agenda mensal | Calendário com contagem de agendamentos ativos por dia |
| Ordenação inteligente | Lista do dia agrupada por status: Confirmado → Concluído → Cancelado |
| Ações por agendamento | Concluir, cancelar, reagendar |
| Reagendamento validado | Bloqueia domingo, dia indisponível, fechamento e sobreposição de horário |
| Bloqueio de dias | Com motivo opcional; avisa (sem cancelar automaticamente) se já houver agendamentos no dia |
| Feriados automáticos | Sincronização manual ou via cron dos feriados nacionais (BrasilAPI), excluindo dezembro |

---

## Regras de negócio

- **Conflito é de intervalo, não de instante.** Um agendamento ocupa `[início, início + duração)`. Um serviço de 1h às 11:00 conflita com outro às 12:00, mesmo sem repetir o horário exato.
- **Encostar não é conflito.** Um agendamento que termina às 13:00 não colide com outro que começa às 13:00.
- **Defesa em três camadas.** O filtro de horários no cliente é conveniência de UX; a validação real acontece na Server Action; e o índice único parcial do banco é a última barreira contra condição de corrida.
- **Bloquear um dia avisa, não cancela.** Se houver agendamentos no dia, o barbeiro é avisado e precisa confirmar — nada é alterado automaticamente. Avisar o cliente é responsabilidade manual.
- **Feriados de dezembro não entram na sincronização automática** — ficam sob decisão do barbeiro.
- **A sincronização de feriados nunca sobrescreve um bloqueio manual** já existente, e é idempotente (rodar de novo não duplica).

---

## Limitações conhecidas

- Não há envio de notificações (e-mail, SMS ou WhatsApp) — nem confirmação, nem lembrete, nem aviso de cancelamento.
- Catálogo de serviços (preço, duração) não é editável pela interface — mudanças exigem acesso direto ao banco.
- Horário de funcionamento é fixo no código (hoje: 08:00–20:00, fechado aos domingos) — não é configurável pelo barbeiro.
- Não há relatório de faturamento.
- Não é possível registrar um atendimento "walk-in" (sem passar pela agenda) direto pelo painel.
- Cliente que agenda sem login não consegue ver nem cancelar a própria reserva depois — não existe vínculo entre pessoa e agendamento sem conta.
- O cancelamento feito pelo cliente remove o registro, em vez de marcá-lo como cancelado (o admin, ao cancelar, atualiza o status). Na prática, o barbeiro não é notificado quando um cliente desmarca.

---

## Como rodar localmente

### Pré-requisitos
- Node.js 20+
- Um banco PostgreSQL (recomendado: [Neon](https://neon.tech/))
- Credenciais OAuth do Google

### Passo a passo

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd luizbarber

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
```

Preencha o `.env` com:

```env
DATABASE_URL="postgresql://.../neondb?sslmode=require"     # endpoint com pooler
DIRECT_URL="postgresql://.../neondb?sslmode=require"        # endpoint direto, sem "-pooler"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

CRON_SECRET="..."   # protege a rota de sincronização de feriados
```

```bash
# 4. Aplicar as migrações e gerar o client do Prisma
npx prisma migrate deploy
npx prisma generate

# 5. Rodar o servidor de desenvolvimento
npm run dev
```

A aplicação sobe em `http://localhost:3000`.

---

## Estrutura do projeto

```
app/
├── admin/                  # área protegida do barbeiro
│   ├── agendamentos/       # listagem e reagendamento
│   └── bloqueios/          # bloqueio de dias e feriados
├── api/
│   ├── auth/                # NextAuth
│   └── cron/sync-holidays/  # sincronização automática de feriados
├── barbershop/[id]/        # página informativa (somente leitura)
├── bookings/                # histórico do cliente
├── _actions/                # Server Actions
├── _components/ui/          # componentes de interface
└── _lib/                    # helpers (auth, agenda, datas)

prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

---

## Roadmap

- [ ] Remover a coluna legada `Booking.serviceId` (migração de finalização, após período de estabilização em produção)
- [ ] Notificações de confirmação/cancelamento
- [ ] Cancelamento do cliente atualizar status em vez de remover o registro
- [ ] Horário de funcionamento configurável pelo barbeiro
- [ ] Edição de catálogo de serviços pela interface
- [ ] Relatório de faturamento
- [ ] Suporte a walk-in pelo painel administrativo
