# CRM Imobiliário

Pipeline de vendas imobiliário (estilo Kanban) — React 18 + TypeScript strict + Tailwind + SQLite (better-sqlite3 + Drizzle ORM), conforme `../SPEC.md`.

## Como rodar (Windows)

```powershell
cd C:\Users\dados\OpenBot\Shared\crm-imob\app
npm install
npm run db:migrate   # cria data/crm.sqlite e aplica src/db/migrations/0001_init.sql
npm run db:seed      # seed idempotente (3 users, 5 persons, 2 developments, 6 properties, 8 deals, 10 activities, 2 proposals)
npm run dev          # UI em http://localhost:5173 + API em http://localhost:3001 (proxy /api)
npm test             # vitest (transições e validações)
npm run build        # tsc --noEmit + vite build
```

> **Nota sobre `npm install` (Windows):** o npm bloqueou `install-scripts` de `better-sqlite3` e `esbuild` (recursos exibidos durante o install). Já foram **aprovados** com `npm install-scripts approve better-sqlite3 esbuild` e o módulo nativo foi compensado com `npm rebuild better-sqlite3` — teste real: `node -e "require('better-sqlite3')"` retornou `better-sqlite3 OK`. Se numa nova máquina o `npm run dev` falhar com "Could not locate the bindings file", rode `npm rebuild better-sqlite3` (requer Visual Studio Build Tools); pré-built binaries são baixados automaticamente na maioria dos ambientes.

## Scripts

| Script | O que faz |
|---|---|
| `dev` | API (tsx watch, porta 3001) + front (vite, 5173) com `concurrently` |
| `build` | `tsc --noEmit` (tipo estrito) + `vite build` |
| `test` | vitest (≈30 casos, incl. transições e validações) |
| `db:migrate` | aplica `src/db/migrations/0001_init.sql` (idempotente via tabela `_migrations`) |
| `db:seed` | seed idempotente |
| `db:generate` | migração única escrita à mão (fonte: `src/db/migrations/0001_init.sql`) |

## Decisões de arquitetura

1. **Kanban com drag-and-drop nativo**: HTML5 Drag & Drop (`draggable` + `onDragOver/onDrop`) em `KanbanBoard`/`StageColumn` — sem dependência externa (SPEC: sem lib de UI pesa). A transição é confirmada em diálogo que valida `canTransition` **antes** de chamar a API (`StageChangeDialog`); bloqueios mostram mensagem clara (e o servidor também valida: "Transição bloqueada…").
2. **Máquina de estados centralizada** em `src/domain/pipeline.ts` (`ALLOWED_TRANSITIONS`): avanço de 1 etapa, retorno de 1 etapa, `ganho` só de `reserva`/`contrato`, `perdido` de qualquer etapa aberta. `deal_stage_history` é append-only.
3. **API Express** (`src/server`) com rotas CRUD camelCase: `/api/persons`, `/api/properties`, `/api/sites`… entre eles `/api/deals`, `/api/activities?dealId=`, `/api/proposals` + extras: GET `/api/users`, GET `/api/deals/:id/history`, PUT `/api/deals/:id/stage` (transição transacional: atualiza deal, grava histórico e marca imóvel `vendido` ao ganhar) e GET `/api/dashboard` (VGV total/por etapa, win rate, ticket médio, aging por etapa e estagnados >15 dias).
4. **Drizzle schema + SQL cru**: `src/db/schema.ts` (Drizzle) para tipagem; a migração real é SQL puro versionado, executado por `src/db/migrate.ts`. `lastActivityAt` do deal é mantido por **trigger** no INSERT de activities (regra 5 do SPEC), além dos cálculos na aplicação.
5. **Validação com zod** (`src/domain/validators.ts`), mensagens em PT-BR, mais `validateDealRules` para as regras condicionais (closedAt sse ganho/perdido, lostReason obrigatório em perdido, valueCents > 0 a partir de proposta).
6. **Dinheiro em centavos**: exibição em BRL via `Int.NumberFormat("pt-BR")` (`lib/money.ts`); formulários aceitam "1.234,56" e convertem.
7. **Seed idempotente**: `src/db/seed.ts` sai sem re-inserir quando `users` já tem registros.
8. **Types**: `src/domain/enums.ts` espelha `schemas/enums.json` em `const` + type unions, com labels PT-BR no mesmo arquivo (STAGE_LABELS, LOST_REASON_LABELS etc.). Os JSON Schemas originais foram copiados para `app/schemas/`.

## Deviations do SPEC

- `db:generate` (drizzle-kit) não está acoplado ao fluxo: a migração única é escrita à mão em `src/db/migrations/0001_init.sql`, aplicada por script próprio idempotente. Mesma intenção, sem dependência extra.
- `POST /api/deals` não exige `leadId` (opcional no schema); seed cria deals sem leads.
- Formulários cobrem os campos essenciais para o fluxo aceito; lista/drawer mostram os dados restantes do schema (endereços, comissões etc. via API).
