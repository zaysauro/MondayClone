# Especificação — CRM Imobiliário (pipeline de vendas)

Versão: 1.1 · Autor: Arquiteto · Stack alvo: React + TypeScript + Tailwind + SQLite (better-sqlite3 + Drizzle ORM)

> **Documento principal: `ARQUITETURA.md` (v2.0).** Este arquivo é o contrato de dados resumido: pipeline, entidades e campos. Em caso de divergência, vale `ARQUITETURA.md`. DDL executável: `schema.sql`. Schemas: `schemas/*.schema.json` (14 arquivos, inclui `document.schema.json`).

Objetivo: contrato de dados estável para o pipeline de vendas, de lead até venda fechada e comissão.
Todos os IDs são UUID v4 em string. Datas em ISO-8601 UTC (`2026-11-06T14:30:00.000Z`). Dinheiro em centavos (integer), moeda em `BRL`.
Campos `createdAt`/`updatedAt` em toda entidade; `deletedAt` (soft delete) em `person`, `property`, `lead`, `deal`.

## 1. Pipeline (funil)

| Ordem | stage | Label | Probabilidade | Win/Loss |
|---|---|---|---|---|
| 1 | `novo_lead` | Novo lead | 5 | open |
| 2 | `contato_feito` | Contato feito | 10 | open |
| 3 | `qualificado` | Qualificado | 20 | open |
| 4 | `visita_agendada` | Visita agendada | 35 | open |
| 5 | `proposta` | Proposta enviada | 50 | open |
| 6 | `negociacao` | Em negociação | 70 | open |
| 7 | `reserva` | Reserva assinada | 85 | open |
| 8 | `contrato` | Contrato em assinatura | 95 | open |
| 9 | `ganho` | Venda fechada | 100 | won |
| 10 | `perdido` | Perdido | 0 | lost |

Regras:
- Transição só avança/recua via `deal_stage_history` (append-only, nunca update).
- `ganho` exige: `valueCents > 0`, `closedAt`, ao menos 1 `proposal` com status `aceita`, e `person` + `property` vinculados.
- `perdido` exige `lostReason` do enum. `lostReason` obrigatório apenas em `perdido`.
- `staleDays`: se `now - lastActivityAt > 15 dias` e stage é open → flag `estagnado` (calculado, não persistido).
- Máquina de estados validada em `src/domain/pipeline.ts` (`ALLOWED_TRANSITIONS`).

## 2. Entidades e relações

```
person 1─n lead           (lead.personId)
person 1─n deal           (deal.buyerPersonId, deal.ownerPersonId opcional)
person 1─n property       (property.ownerPersonId — proprietário do imóvel)
development 1─n property  (property.developmentId)
property 1─n deal         (deal.propertyId)
lead 1─0..1 deal          (deal.leadId)
deal 1─n proposal
deal 1─n activity
deal 1─n deal_stage_history
deal 1─0..1 commission
user 1─n lead / deal / activity (responsável)
```

## 3. Schemas (fonte da verdade em `schemas/*.schema.json`)

### person
```json
{
  "id": "uuid",
  "type": "comprador | proprietario | inquilino | fiador | corretor_parceiro",
  "name": "string (2..160)",
  "document": "string | null  // CPF/CNPJ só dígitos",
  "email": "string(email) | null",
  "phone": "string E.164 | null",
  "whatsapp": "string E.164 | null",
  "birthDate": "date | null",
  "maritalStatus": "solteiro | casado | divorciado | viuvo | uniao_estavel | null",
  "profession": "string | null",
  "incomeCents": "integer >= 0 | null",
  "creditScore": "integer 0..1000 | null",
  "preferences": {
    "budgetMinCents": "integer | null",
    "budgetMaxCents": "integer | null",
    "bedroomsMin": "integer | null",
    "neighborhoods": ["string"],
    "propertyTypes": ["apartamento | casa | terreno | comercial | rural"],
    "financing": "financiamento | fgts | subsidio | a_vista | permuta | null"
  },
  "address": { "street": "string", "number": "string", "complement": "string | null", "district": "string", "city": "string", "state": "string(2)", "zip": "string(8)" },
  "source": "indicacao | site | portal | whatsapp | instagram | facebook | placa | plantao | telefone | outro",
  "tags": ["string"],
  "notes": "string | null",
  "consent": { "lgpdAcceptedAt": "datetime", "marketingOptIn": "boolean", "source": "string" },
  "createdAt": "datetime", "updatedAt": "datetime", "deletedAt": "datetime | null"
}
```

### development (empreendimento)
```json
{
  "id": "uuid",
  "name": "string",
  "builder": "string | null",
  "status": "lancamento | em_obras | pronto | entregue",
  "deliveryDate": "date | null",
  "address": { "...": "mesmo shape de person.address" },
  "priceFromCents": "integer | null",
  "priceToCents": "integer | null",
  "bedroomsOptions": ["integer"],
  "areaOptionsM2": ["number"],
  "amenities": ["string"],
  "brochureUrl": "string(url) | null",
  "createdAt": "datetime", "updatedAt": "datetime"
}
```

### property
```json
{
  "id": "uuid",
  "code": "string unique  // ex: AP-1042",
  "type": "apartamento | casa | terreno | comercial | rural",
  "purpose": "venda | aluguel | venda_aluguel",
  "status": "captacao | disponivel | reservado | vendido | alugado | inativo",
  "developmentId": "uuid | null",
  "ownerPersonId": "uuid | null",
  "address": { "...": "person.address" },
  "priceCents": "integer > 0",
  "condoFeeCents": "integer | null",
  "iptuAnnualCents": "integer | null",
  "bedrooms": "integer", "suites": "integer", "bathrooms": "integer", "parkingSpots": "integer",
  "areaM2": "number", "landAreaM2": "number | null",
  "floor": "integer | null", "ageYears": "integer | null",
  "features": ["piscina", "churrasqueira", "elevador", "mobiliado", "pet_friendly"],
  "description": "string | null",
  "photos": [{ "url": "string(url)", "caption": "string | null", "order": "integer" }],
  "exclusive": "boolean",
  "createdAt": "datetime", "updatedAt": "datetime", "deletedAt": "datetime | null"
}
```

### lead
```json
{
  "id": "uuid",
  "personId": "uuid",
  "ownerUserId": "uuid",
  "source": "mesmo enum de person.source",
  "stage": "aplicado ao deal; lead guarda o interesse",
  "interest": {
    "propertyId": "uuid | null",
    "developmentId": "uuid | null",
    "propertyTypes": ["string"],
    "budgetMaxCents": "integer | null",
    "neighborhoods": ["string"],
    "urgency": "imediata | 30_dias | 90_dias | sem_pressa"
  },
  "temperature": "quente | morno | frio",
  "score": "integer 0..100",
  "qualified": "boolean",
  "disqualifiedReason": "string | null",
  "createdAt": "datetime", "updatedAt": "datetime", "deletedAt": "datetime | null"
}
```

### deal (negócio = card do kanban)
```json
{
  "id": "uuid",
  "code": "string unique  // NEG-2026-0001",
  "title": "string",
  "leadId": "uuid | null",
  "buyerPersonId": "uuid",
  "propertyId": "uuid",
  "ownerUserId": "uuid",
  "stage": "novo_lead | contato_feito | qualificado | visita_agendada | proposta | negociacao | reserva | contrato | ganho | perdido",
  "valueCents": "integer >= 0",
  "expectedCloseAt": "date | null",
  "closedAt": "datetime | null",
  "lostReason": "preco | financiamento_recusado | desistiu | comprou_concorrente | imovel_indisponivel | sem_resposta | outro | null",
  "lostNotes": "string | null",
  "paymentMethod": "financiamento | fgts | subsidio | a_vista | permuta | null",
  "commissionPct": "number 0..20 | null",
  "lastActivityAt": "datetime",
  "stageEnteredAt": "datetime",
  "createdAt": "datetime", "updatedAt": "datetime", "deletedAt": "datetime | null"
}
```

### deal_stage_history (append-only)
```json
{
  "id": "uuid",
  "dealId": "uuid",
  "fromStage": "string | null",
  "toStage": "string",
  "changedByUserId": "uuid",
  "note": "string | null",
  "createdAt": "datetime"
}
```

### proposal
```json
{
  "id": "uuid",
  "dealId": "uuid",
  "version": "integer >= 1",
  "amountCents": "integer > 0",
  "paymentMethod": "mesmo enum do deal",
  "downPaymentCents": "integer | null",
  "financingMonths": "integer | null",
  "conditions": "string | null",
  "status": "rascunho | enviada | contraproposta | aceita | recusada | expirada",
  "sentAt": "datetime | null",
  "expiresAt": "datetime | null",
  "decidedAt": "datetime | null",
  "documentUrl": "string(url) | null",
  "createdAt": "datetime", "updatedAt": "datetime"
}
```

### activity (visita, ligação, whatsapp, tarefa, nota)
```json
{
  "id": "uuid",
  "type": "ligacao | whatsapp | email | visita | reuniao | tarefa | nota | sistema",
  "dealId": "uuid | null",
  "leadId": "uuid | null",
  "personId": "uuid | null",
  "propertyId": "uuid | null",
  "userId": "uuid",
  "title": "string",
  "body": "string | null",
  "dueAt": "datetime | null",
  "doneAt": "datetime | null",
  "outcome": "string | null",
  "createdAt": "datetime", "updatedAt": "datetime"
}
```

### document (documentação — `status_documentacao`)
```json
{
  "id": "uuid",
  "dealId": "uuid | null", "personId": "uuid | null", "propertyId": "uuid | null",
  "type": "rg | cpf | cnh | comprovante_renda | comprovante_residencia | certidao_estado_civil | matricula_imovel | iptu | condominio | contrato | proposta_assinada | distrato | outro",
  "title": "string",
  "status": "pendente | solicitado | recebido | em_analise | aprovado | reprovado | vencido",
  "fileUrl": "string | null", "fileName": "string | null", "mimeType": "string | null", "sizeBytes": "integer | null",
  "issuedAt": "date | null", "expiresAt": "date | null",
  "requestedAt": "datetime | null", "receivedAt": "datetime | null",
  "reviewedAt": "datetime | null", "reviewedByUserId": "uuid | null",
  "rejectionReason": "string | null", "notes": "string | null",
  "createdAt": "datetime", "updatedAt": "datetime"
}
```
Regras: `aprovado` exige `fileUrl`; `reprovado` exige `rejectionReason`; pelo menos um vínculo (deal/person/property); checklist por forma de pagamento em `src/domain/documents.ts`.

### commission
```json
{
  "id": "uuid",
  "dealId": "uuid unique",
  "grossValueCents": "integer",
  "pct": "number",
  "totalCents": "integer",
  "split": [{ "userId": "uuid", "pct": "number", "amountCents": "integer" }],
  "status": "prevista | faturada | recebida | cancelada",
  "expectedAt": "date | null",
  "receivedAt": "date | null",
  "createdAt": "datetime", "updatedAt": "datetime"
}
```

### user (corretor/gestor)
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string unique",
  "role": "admin | gestor | corretor | assistente",
  "creci": "string | null",
  "phone": "string | null",
  "active": "boolean",
  "createdAt": "datetime", "updatedAt": "datetime"
}
```

## 4. Enums compartilhados (`schemas/enums.json`)
`Stage`, `PersonType`, `PropertyType`, `PropertyPurpose`, `PropertyStatus`, `DevelopmentStatus`, `LeadSource`, `LeadTemperature`, `Urgency`, `PaymentMethod`, `ProposalStatus`, `ActivityType`, `LostReason`, `CommissionStatus`, `UserRole`.
Todos os enums exportados como `const` + type union; nomes em `snake_case` minúsculo; labels PT-BR em `enums.labels.ts`.

## 5. Regras de validação transversais
1. `budgetMaxCents >= budgetMinCents` quando ambos presentes.
2. `priceToCents >= priceFromCents` em development.
3. `deal.valueCents` deve ser `> 0` a partir de `proposta`.
4. `closedAt` obrigatório sse stage ∈ {ganho, perdido}; proibido caso contrário.
5. `lastActivityAt` atualizado por trigger/aplicação em qualquer activity do deal.
6. `property.status = vendido` quando deal → `ganho` (transação atômica).
7. Soft delete em cascata lógica: não apagar deal com commission `recebida`.
8. Índices: `deal(stage, ownerUserId)`, `deal(propertyId)`, `activity(dueAt, doneAt)`, `lead(ownerUserId, temperature)`, `person(document)`, `property(code)` unique.

## 6. Lista de arquivos a gerar (Dev)

Raiz: `C:\Users\dados\OpenBot\Shared\crm-imob\app` (novo projeto Vite + React + TS + Tailwind).

```
app/
  package.json
  tsconfig.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  index.html
  .env.example
  schemas/                        # copiados de ../schemas
  src/
    main.tsx
    App.tsx
    index.css
    lib/
      db.ts                       # better-sqlite3 + drizzle client
      uuid.ts
      money.ts                    # centavos <-> BRL
      dates.ts
    db/
      schema.ts                   # tabelas Drizzle espelhando os JSON Schemas
      migrations/0001_init.sql    # DDL + índices + triggers lastActivityAt
      seed.ts                     # 3 users, 5 persons, 6 properties, 8 deals, 10 activities
    domain/
      enums.ts
      pipeline.ts                 # ALLOWED_TRANSITIONS + guards
      validators.ts               # zod schemas derivados de schemas/*.schema.json
      money.ts
    server/                       # API local (Express ou Hono)
      index.ts
      routes/persons.ts
      routes/properties.ts
      routes/leads.ts
      routes/deals.ts
      routes/activities.ts
      routes/proposals.ts
      routes/dashboard.ts         # KPIs: VGV, win rate, ticket médio, aging por stage
    hooks/
      useDeals.ts
      usePipeline.ts
      useActivities.ts
    components/
      layout/AppShell.tsx
      layout/Sidebar.tsx
      pipeline/KanbanBoard.tsx
      pipeline/DealCard.tsx
      pipeline/StageColumn.tsx
      pipeline/DealDrawer.tsx
      pipeline/StageChangeDialog.tsx
      deals/DealForm.tsx
      deals/DealTimeline.tsx
      properties/PropertyList.tsx
      properties/PropertyForm.tsx
      persons/PersonList.tsx
      persons/PersonForm.tsx
      activities/ActivityList.tsx
      activities/ActivityForm.tsx
      dashboard/KpiCards.tsx
      dashboard/FunnelChart.tsx
      ui/Button.tsx  ui/Input.tsx  ui/Select.tsx  ui/Modal.tsx  ui/Badge.tsx  ui/Table.tsx
    pages/
      DashboardPage.tsx
      PipelinePage.tsx
      DealsPage.tsx
      PropertiesPage.tsx
      PersonsPage.tsx
      ActivitiesPage.tsx
    tests/
      pipeline.test.ts            # transições válidas/inválidas
      validators.test.ts
      seed.test.ts
  README.md                       # como rodar, scripts, decisões
```

Scripts `package.json`: `dev`, `build`, `preview`, `db:generate`, `db:migrate`, `db:seed`, `test`.

## 7. Critérios de aceite (QA — Windows)
1. `npm install && npm run db:migrate && npm run db:seed && npm run build` sem erro.
2. `npm test` verde (mín. 12 testes: 10 transições + 2 validações).
3. `npm run dev` sobe em `http://localhost:5173`; kanban renderiza as 10 colunas com os 8 deals do seed.
4. Arrastar card de `qualificado` → `visita_agendada` grava linha em `deal_stage_history`.
5. Tentar `qualificado` → `ganho` é bloqueado com mensagem clara.
6. Dashboard mostra VGV, win rate, ticket médio sem `NaN`/`undefined`.
7. `data/crm.sqlite` criado no primeiro boot; reexecutar seed é idempotente.
8. Sem erros no console do navegador e sem warning de key do React.
