# CRM Imobiliário — Arquitetura e Especificação Técnica

Versão 2.0 · Arquiteto de Software / PM · 06/11/2026
Status: **aprovada para implementação** — substitui a v1 de `SPEC.md` (mantida como contrato de dados resumido).

Projeto: `C:\Users\dados\OpenBot\Shared\crm-imob`
Stack: **React 18 + TypeScript strict + Vite + Tailwind CSS v3 + Node.js 20 (Express) + SQLite (better-sqlite3 + Drizzle ORM)**.

---

## 0. Dicionário de negócio → nome técnico

O solicitante citou termos de negócio; o código usa nomes técnicos canônicos. Este mapa elimina a ambiguidade:

| Termo de negócio | Tabela.campo (SQL) | Tipo TS | Observação |
|---|---|---|---|
| `valor_imovel` | `property.price_cents` | `number` (int) | centavos, `> 0` |
| `valor_negociado` | `deal.value_cents` | `number` (int) | pode divergir do anúncio |
| `comissao` (percentual) | `commission.pct` | `number` | 0–20 (%) |
| `comissao` (valor) | `commission.total_cents` | `number` (int) | `gross_value_cents * pct / 100` |
| `estagios_pipeline` | `deal.stage` + `deal_stage_history` | `Stage` | enum de 10 valores, trilha append-only |
| `dados_lead` | `lead.*` + `person.*` | `Lead`, `Person` | interesse, temperatura, score, consentimento LGPD |
| `status_documentacao` | `document.status` | `DocumentStatus` | 7 estados, ver §5 |

Regra de ouro: **dinheiro nunca em float**. Todo valor monetário é `integer` de centavos; conversão só na borda de UI (`formatBRL`).

---

## 1. Requisitos funcionais

### 1.1 Personas e permissões

| Persona | Papel (`user.role`) | Pode |
|---|---|---|
| Corretor | `corretor` | ver/editar seus leads, negócios, atividades, documentos; não vê comissão de terceiros |
| Gestor | `gestor` | ver tudo da equipe, mover qualquer card, aprovar/reprovar documentos, ver comissões |
| Assistente | `assistente` | criar lead, agendar visita, anexar documento; não fecha negócio |
| Admin | `admin` | tudo + usuários e configuração de estágios |

Autorização aplicada no servidor por middleware `requireRole(...)`; a UI apenas esconde ações.

### 1.2 Módulos e requisitos numerados

**RF-01 — Quadro Kanban (pipeline)**
- RF-01.1 Board com as 10 colunas fixas do funil; cada coluna exibe label, contagem e soma em BRL.
- RF-01.2 Card mostra: código (`NEG-2026-0001`), título, comprador, código do imóvel, valor, avatar do responsável, dias no estágio, badge "estagnado" (>15 dias) e ícone de pendência documental.
- RF-01.3 Drag-and-drop entre colunas com validação server-side; transição inválida → card volta e toast com o motivo.
- RF-01.4 Toda mudança de estágio grava `deal_stage_history` (quem, de, para, quando, nota opcional).
- RF-01.5 Filtros: responsável, etapa, temperatura, faixa de valor, período de fechamento previsto, apenas estagnados. Busca por nome/código/telefone.
- RF-01.6 Totais do funil (VGV por coluna, win rate, ticket médio) no topo do board.
- RF-01.7 Ao mover para `ganho`: modal exige valor final, forma de pagamento e confirmação; ao mover para `perdido`: motivo obrigatório.
- RF-01.8 Reordenar cards dentro da coluna (campo `position` opcional, ordenação padrão por `last_activity_at DESC`).

**RF-02 — Gestão de Leads**
- RF-02.1 Cadastro de lead com pessoa (nome, documento, contato), origem, interesse (tipo, bairro, orçamento, urgência) e consentimento LGPD obrigatório.
- RF-02.2 Score 0–100 calculado por regra determinística (`scoreLead`): orçamento compatível (+30), urgência imediata (+25), financiamento pré-aprovado (+20), contato válido (+15), origem qualificada (+10).
- RF-02.3 Temperatura (`quente`/`morno`/`frio`) derivada do score: ≥70 quente, 40–69 morno, <40 frio; editável manualmente com override registrado.
- RF-02.4 Qualificação: `qualified=true` gera negócio (`convertLeadToDeal`) em transação, reaproveitando imóvel de interesse se houver; `false` exige `disqualifiedReason`.
- RF-02.5 Lista de leads com filtros de temperatura, urgência, responsável e origem; ação em massa de redistribuição (gestor).
- RF-02.6 Duplicidade: bloqueia novo lead para o mesmo `document` ou `phone` já existente, oferecendo vincular ao lead aberto.

**RF-03 — Ficha do Imóvel**
- RF-03.1 CRUD de imóvel com código único (`AP-1042`), tipo, finalidade, status, endereço, preço, condomínio, IPTU, dormitórios/suítes/banheiros/vagas, áreas, idade, características e descrição.
- RF-03.2 Galeria de fotos ordenável (upload local em `public/uploads`, limite 8 MB, jpg/png/webp).
- RF-03.3 Vínculo com empreendimento (`development`) e com proprietário (`person.type = proprietario`).
- RF-03.4 Status derivado do negócio: ao entrar em `reserva` → `reservado`; em `ganho` → `vendido` (transação atômica); ao perder → volta a `disponivel`.
- RF-03.5 Histórico do imóvel: negócios vinculados e propostas, somente leitura.
- RF-03.6 Bloqueio de exclusão física: apenas soft delete; imóvel com negócio aberto fica `inativo` e não pode ser excluído.

**RF-04 — Documentação**
- RF-04.1 Checklist por negócio, derivado do tipo de pagamento (`TEMPLATE_DOCUMENTOS`): financiamento exige 10 documentos; à vista 4; FGTS soma 3.
- RF-04.2 Cada documento tem `status` (7 estados), arquivo, validade, revisor e motivo de reprovação.
- RF-04.3 Fluxo: `pendente → solicitado → recebido → em_analise → aprovado | reprovado`; `reprovado` volta a `solicitado` ao reenviar. `vencido` é calculado por `expires_at < hoje` em job na abertura do board.
- RF-04.4 `aprovado` exige `fileUrl`; `reprovado` exige `rejectionReason` (CHECK no banco + zod).
- RF-04.5 Bloqueio de avanço: `deal.stage` não passa de `contrato` para `ganho` com documento obrigatório não aprovado (`assertDocumentacaoCompleta`).
- RF-04.6 Painel "Documentação pendente" com vencimentos em 30 dias e reprovados.

**RF-05 — Dashboard**
- RF-05.1 Cards: VGV em aberto, VGV ganho no mês, win rate (ganhos / ganhos+perdidos), ticket médio, negócios estagnados, documentos pendentes.
- RF-05.2 Funil (barras horizontais por estágio) e evolução mensal de ganhos (últimos 6 meses).
- RF-05.3 Ranking de corretores por VGV ganho e atividades realizadas.
- RF-05.4 Tudo calculado por SQL (`vw_pipeline` + agregações), nunca no cliente.

**RF-06 — Atividades e agenda**
- RF-06.1 Registrar ligação, WhatsApp, e-mail, visita, reunião, tarefa e nota, vinculado a deal/lead/pessoa.
- RF-06.2 Tarefas com `dueAt`, conclusão (`doneAt`), atrasadas em vermelho; atualização de `deal.last_activity_at` por trigger.
- RF-06.3 Timeline cronológica no drawer do negócio.

**RF-07 — Comissão**
- RF-07.1 Gerada ao ganhar o negócio: `pct` do negócio (default 3%), `total_cents`, split entre corretores somando 100%.
- RF-07.2 Status `prevista → faturada → recebida`; negócio com comissão `recebida` não pode ser excluído.

---

## 2. Pilha de tecnologia — decisão (ADR-001)

| Critério | React+TS+Express+SQLite | Next.js | Python/FastAPI |
|---|---|---|---|
| Instalação no Windows do usuário | 1 `npm install`, sem toolchain extra | ok, mais pesado | exige Python + venv |
| SQLite local sem servidor | nativo | nativo | nativo |
| Compartilhar tipos cliente/servidor | total (um `tsconfig`) | total | duplicação |
| Curva para o time | baixa (React já usado) | média | alta |
| Build/entrega | Vite, artefato estático + API | acoplado | dois processos |

**Decisão:** React + TS + Express + SQLite. Motivo: menor atrito no Windows, tipos compartilhados e um único runtime. Consequência aceita: sem SSR (irrelevante para app interno) e sem multiusuário concorrente real (SQLite serializa escritas — suficiente para ≤15 corretores).

Bibliotecas fixadas: `react@18`, `react-router-dom@6`, `@tanstack/react-query@5`, `@dnd-kit/core@6` + `@dnd-kit/sortable`, `zod@3`, `drizzle-orm@0.36` + `drizzle-kit`, `better-sqlite3@11`, `express@4`, `vitest@2`, `date-fns@4`, `clsx`, `lucide-react`. Proibido: bibliotecas de UI completas (MUI/AntD), ORMs pesados, estado global (Redux).

---

## 3. Estrutura de pastas (obrigatória)

```
crm-imob/
├── SPEC.md                     # contrato de dados v1 (referência)
├── ARQUITETURA.md              # este documento
├── schema.sql                  # DDL de referência (fonte: migrations)
├── schemas/                    # 14 JSON Schemas (contrato externo)
└── app/
    ├── package.json  tsconfig.json  vite.config.ts  tailwind.config.ts
    ├── postcss.config.js  index.html  .env.example  README.md
    ├── data/                              # crm.sqlite (gitignored)
    ├── public/uploads/                    # fotos e documentos
    ├── schemas/                           # cópia de ../schemas
    └── src/
        ├── main.tsx  App.tsx  index.css
        ├── config/env.ts                  # PORT, DB_PATH, UPLOAD_DIR
        ├── lib/  db.ts  uuid.ts  money.ts  dates.ts  http.ts
        ├── db/
        │   ├── schema.ts                  # Drizzle (espelha schema.sql)
        │   ├── client.ts                  # better-sqlite3 + pragmas
        │   ├── migrations/0001_init.sql
        │   └── seed.ts                    # idempotente
        ├── domain/
        │   ├── enums.ts  pipeline.ts  validators.ts  score.ts
        │   ├── documents.ts               # TEMPLATE_DOCUMENTOS + assertDocumentacaoCompleta
        │   └── money.ts
        ├── server/
        │   ├── index.ts  middleware/{auth,errors,validate}.ts
        │   ├── routes/{persons,properties,leads,deals,activities,proposals,documents,dashboard,uploads}.ts
        │   └── services/{dealService,leadService,documentService,dashboardService}.ts
        ├── hooks/  useDeals.ts  usePipeline.ts  useActivities.ts  useDocuments.ts  useDashboard.ts
        ├── components/
        │   ├── layout/{AppShell,Sidebar,Topbar}.tsx
        │   ├── pipeline/{KanbanBoard,StageColumn,DealCard,DealDrawer,StageChangeDialog}.tsx
        │   ├── deals/{DealForm,DealTimeline,DealHeader}.tsx
        │   ├── leads/{LeadList,LeadForm,LeadScoreBadge,ConvertLeadDialog}.tsx
        │   ├── properties/{PropertyList,PropertyForm,PropertyGallery,PropertyCard}.tsx
        │   ├── documents/{DocumentChecklist,DocumentForm,DocumentStatusBadge}.tsx
        │   ├── dashboard/{KpiCards,FunnelChart,MonthlyChart,RankingTable}.tsx
        │   ├── activities/{ActivityList,ActivityForm}.tsx
        │   └── ui/{Button,Input,Select,Textarea,Modal,Badge,Table,Tabs,EmptyState,Toast}.tsx
        ├── pages/  DashboardPage  PipelinePage  LeadsPage  PropertiesPage  DocumentsPage  ActivitiesPage
        └── tests/  pipeline.test.ts  validators.test.ts  score.test.ts  documents.test.ts  seed.test.ts
```

Convenções: componente `PascalCase.tsx`, hook `useXxx.ts`, rota `kebab-case`, coluna SQL `snake_case`, campo TS `camelCase`, tipo `PascalCase`, constante `SCREAMING_SNAKE`. Nenhum `any` implícito; `strict: true` e `noUncheckedIndexedAccess: true`.

---

## 4. Contrato de API REST

Prefixo `/api`. JSON em `camelCase`. Erro padrão: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "campo": "motivo" } } }` com HTTP 400/401/403/404/409/422.

| Método | Rota | Papel mínimo | Descrição |
|---|---|---|---|
| GET | `/api/deals?stage=&ownerId=&q=&stale=` | corretor | lista paginada |
| POST | `/api/deals` | corretor | cria negócio |
| GET | `/api/deals/:id` | corretor | detalhe + proposal + activity + documents |
| PATCH | `/api/deals/:id` | corretor | edita campos |
| PATCH | `/api/deals/:id/stage` | corretor | `{ stage, note?, lostReason?, valueCents? }` |
| DELETE | `/api/deals/:id` | gestor | soft delete |
| GET | `/api/pipeline` | corretor | colunas + totais (usa `vw_pipeline`) |
| GET/POST | `/api/leads` | corretor | lista / cria (409 em duplicidade) |
| POST | `/api/leads/:id/convert` | corretor | `{ propertyId?, valueCents }` → deal |
| GET/POST | `/api/properties` | corretor | lista (filtros tipo/status/faixa) / cria |
| PATCH | `/api/properties/:id` | corretor | edita (409 se vendido) |
| POST | `/api/uploads` | corretor | multipart, retorna `{ url, fileName, mimeType, sizeBytes }` |
| GET | `/api/deals/:id/documents` | corretor | checklist + status |
| POST | `/api/documents` | corretor | cria/atualiza item do checklist |
| PATCH | `/api/documents/:id/status` | gestor | `{ status, rejectionReason? }` |
| GET | `/api/dashboard?from=&to=` | corretor | KPIs, funil, série mensal, ranking |
| GET/POST | `/api/activities` | corretor | agenda |
| PATCH | `/api/activities/:id/done` | corretor | conclui tarefa |

Transações obrigatórias: `convertLeadToDeal`, `changeDealStage` (+documento/property/comissão), `approveDocument`.

---

## 5. Documentação — máquina de estados

```
pendente ──solicitar──> solicitado ──anexar──> recebido ──iniciar análise──> em_analise
                             ▲                    │                            │
                             │                    │                            ├──aprovar──> aprovado
                        reenviar                 │                            └──reprovar─> reprovado
                             └────────────────────┴──────────── reprovado ─────┘
expires_at < hoje  ⇒  vencido (derivado, persiste no job diário)
```

`DocumentStatus` = `pendente | solicitado | recebido | em_analise | aprovado | reprovado | vencido`.

`TEMPLATE_DOCUMENTOS` (chave = `PaymentMethod`):

| Pagamento | Documentos obrigatórios |
|---|---|
| `financiamento` | rg, cpf, comprovante_renda, comprovante_residencia, certidao_estado_civil, matricula_imovel, contrato, proposta_assinada, iptu, condominio |
| `fgts` | financiamento + 3 comprovantes de depósito FGTS |
| `a_vista` | rg, cpf, matricula_imovel, contrato |
| `subsidio` | financiamento + comprovante de enquadramento |
| `permuta` | rg, cpf, matricula_imovel (dos dois imóveis), contrato |

---

## 6. Regras de negócio implementáveis (fonte única em `src/domain`)

1. `ALLOWED_TRANSITIONS` (em `pipeline.ts`):
```ts
novo_lead → contato_feito
contato_feito → qualificado | novo_lead
qualificado → visita_agendada | contato_feito | perdido
visita_agendada → proposta | qualificado | perdido
proposta → negociacao | visita_agendada | perdido
negociacao → reserva | proposta | perdido
reserva → contrato | negociacao | perdido
contrato → ganho | reserva | perdido
ganho → ∅            perdido → novo_lead   // reabertura manual do gestor
```
2. `value_cents > 0` obrigatório a partir de `proposta`; `closed_at` só em `ganho`/`perdido`; `lost_reason` obrigatório em `perdido`.
3. `ganho` exige proposta `aceita` + documentação obrigatória `aprovada`.
4. `deal.property.status` acompanha o estágio (`reserva`→`reservado`, `ganho`→`vendido`, `perdido`→`disponivel`).
5. Estagnado: `stage` aberto e `now - last_activity_at > 15 dias`.
6. Idempotência do seed: `INSERT ... ON CONFLICT DO NOTHING` com UUIDs fixos em `SEED_IDS`.
7. Cálculo de comissão: `total_cents = round(gross_value_cents * pct / 100)`; soma dos splits deve fechar exatamente `total_cents` (distribui o resto de centavos no primeiro).

---

## 7. Requisitos não funcionais

| ID | Requisito | Meta verificável |
|---|---|---|
| RNF-01 | Board com 500 negócios | primeira renderização < 1s em máquina i5 |
| RNF-02 | Consultas | todo endpoint < 200ms; `EXPLAIN QUERY PLAN` sem `SCAN` nas listas principais |
| RNF-03 | Integridade | `PRAGMA foreign_keys=ON`, WAL, backup `VACUUM INTO` diário |
| RNF-04 | Acessibilidade | navegação por teclado no kanban (Alt+←/→), foco visível, contraste AA |
| RNF-05 | LGPD | consentimento obrigatório, soft delete, exportação dos dados da pessoa em JSON |
| RNF-06 | Tipagem | `tsc --noEmit` sem erro, `any` proibido (lint `@typescript-eslint/no-explicit-any: error`) |
| RNF-07 | Testes | ≥ 20 casos, cobertura de `domain/` ≥ 80% |
| RNF-08 | Windows | `npm run setup` único; sem dependência de build nativo além de `better-sqlite3` (documentar fallback `node:sqlite`) |

---

## 8. Critérios de aceite (validação no Windows)

1. `npm install && npm run db:migrate && npm run db:seed && npm run build` sem erro.
2. `npm test` verde com ≥ 20 testes (transições, validação, score, documentos, seed idempotente).
3. `npm run dev` sobe API (3001) e UI (5173); board renderiza 10 colunas e os 8 negócios do seed.
4. Arrastar `qualificado → visita_agendada` persiste e grava `deal_stage_history`; `qualificado → ganho` é bloqueado com mensagem em PT-BR.
5. Mover para `ganho` cria `commission` e marca o imóvel como `vendido` na mesma transação.
6. Checklist de documentos aparece conforme `payment_method`; `aprovado` sem arquivo é rejeitado; `ganho` com documento pendente é bloqueado.
7. Dashboard sem `NaN`/`undefined` e com números conferindo com o seed.
8. Reexecutar o seed não duplica registros.
9. `tsc --noEmit` limpo e console do navegador sem erros.

---

## 9. Backlog priorizado (fora do escopo desta entrega)

P1: notificações WhatsApp/e-mail, agenda compartilhada, importação de portais.
P2: multiempresa, assinatura eletrônica, relatório de repasse ao proprietário.
P3: app mobile, integração com Huly/Monday via API, BI externo.

---

## 10. Rastreabilidade

`ARQUITETURA.md` (§4, §6) → `schema.sql` → `schemas/*.schema.json` → `src/domain/*` → `src/db/*` → rotas → telas → testes. Qualquer divergência deve ser corrigida primeiro no documento, depois no código.
