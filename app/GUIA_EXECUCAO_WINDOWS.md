# Guia de execução local — Windows (CRM Imobiliário)

Pasta do projeto: `C:\Users\dados\OpenBot\Shared\crm-imob\app`

## Pré-requisitos
- Node.js 20+ e npm (verifique com `node -v` e `npm -v`)
- Não é necessário instalar banco de dados separado (usa SQLite local em `data/crm.sqlite`)
- `better-sqlite3` já está compilado nativo neste Windows (não precisa de build tools)

## 1. Instalar dependências (uma única vez)
No terminal, dentro da pasta `app`:
```
cd "C:\Users\dados\OpenBot\Shared\crm-imob\app"
npm install
```

## 2. Iniciar a aplicação (cada sessão)
Use um dos scripts abaixo. Eles rodam migração + seed (idempotente) e sobem a API + frontend:

- **Prompt de Comando:** `start.bat`
- **PowerShell:** `start.ps1`

Após iniciar:
- API: `http://localhost:3001` (ex: `GET /api/health`, `GET /api/deals`)
- Frontend: `http://localhost:5173`

## 3. Banco de dados do zero (se precisar resetar)
```
reset-db.bat      # Prompt de Comando
reset-db.ps1      # PowerShell
```
Remove `data/crm.sqlite`, recria as tabelas e reinsere a seed (3 usuários, 5 pessoas, 2 empreendimentos, 6 imóveis, 8 negócios, 10 atividades, 2 propostas).

## 4. Comandos individuais (terminal)
```
npm run db:migrate   # aplica a migration (idempotente)
npm run db:seed      # popula dados iniciais (idempotente)
npm run dev          # sobe API (Express :3001) + Vite (:5173) em paralelo
npm run build        # tsc --noEmit + vite build (producao em dist/)
npm test             # vitest (23 casos)
npx tsc --noEmit     # checagem de tipos
.\verify.ps1         # PowerShell: roda tsc + test + build + migrate + seed e imprime status
```

## 5. Scripts disponíveis na pasta `app/`
- `start.bat` / `start.ps1` — instala, migra, faz seed e sobe API + frontend (abre o navegador em :5173)
- `reset-db.bat` / `reset-db.ps1` — recria o banco do zero e reinsere a seed
- `verify.ps1` — verificação completa de integridade (tsc, test, build, migrate, seed)

## 5. Validação de QA já feita (nesta máquina Windows)
| Comando | Resultado |
|---|---|
| `npm install` | OK (better-sqlite3 nativo carregado) |
| `npx tsc --noEmit` | OK, sem erros de tipo |
| `npm run db:migrate` | OK (após correção da tabela `_migrations`) |
| `npm run db:seed` | OK, idempotente (reexecução não duplica) |
| `npm test` | 23 testes aprovados |
| `npm run build` | OK (vite build em `dist/`) |

## Correções aplicadas ao código do Desenvolvedor (não foi reescrito o projeto)
1. `src/db/migrations/0001_init.sql`: `CREATE TABLE _migrations` → `CREATE TABLE IF NOT EXISTS _migrations` (corrigia `SqliteError: table _migrations already exists` no `db:migrate`).
2. `src/db/seed.ts` (`clean()`): campos objeto/array (ex: `tags`, `amenities`, `features`, `photos`) agora viram `JSON.stringify` antes de serem ligados a colunas `TEXT` (corrigia `TypeError: can only bind ...` no `db:seed`).
3. `src/db/seed.ts`: insert de propriedades agora preenche `areaM2: p.area` (corrigia `RangeError: Missing named parameter "areaM2"`).

## Itens do ARQUITECTURA.md v2.0 ainda não entregues pelo Desenvolvedor (fora da revisão de QA)
- `src/domain/score.ts` e `src/domain/documents.ts` (RF-02.2, `assertDocumentacaoCompleta`)
- Rotas `/api/documents`, upload local em `public/uploads` e galeria de imóveis
- Seed com comissão + checklist de documentos por negócio
- Testes ampliados para ≥ 20 casos cobrindo os novos módulos
- README revisado com as decisões do ARQUITECTURA.md v2.0

Encaminhar ao Desenvolvedor/Arquiteto para conclusão da esteira v2.0, se necessário.
