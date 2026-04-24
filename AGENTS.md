# oportobahia-backend

Backend for Oporto Bahia that syncs data between Firebird ERP (legacy) and MongoDB, integrating with Tiny.com.br API.

## Entry Points

- `src/server.js` — main entry; starts Express server and scheduled jobs
- `src/app.js` — Express app config; exports `app` for testing

## Run Commands

```bash
cd src
npm start        # npx nodemon server.js (development)
npm run start    # same — no production script defined
```

## Architecture

Two-database sync system:
- **Firebird** (`src/infra/fb5.js`) — legacy ERP reads; connection-per-query pattern
- **MongoDB** (`src/infra/mongoClient.js`) — sync destination; multi-tenant store

Scheduled jobs (`src/agenda.js`) run every 12 minutes:
- Sync products from Tiny API → MongoDB
- Sync invoices (NFe), price lists, royalties
- Maintenance window: 20:00–06:00 (skips processing)

## Directory Roles

```
src/
├── infra/         — db clients (fb5.js, mongoClient.js)
├── api/           — Tiny ERP HTTP client
├── services/      — Tiny class wrapper with rate-limit handling
├── repository/    — data access; extends baseRepository.js
├── controller/    — business logic; each exports `init()` for scheduled runs
├── mappers/       — data transformation
├── types/         — constants (STATUS enums)
├── utils/         — helpers (lib.js, xmlParser.js)
```

## Key Patterns

- **Repository**: `Repository` class in `baseRepository.js` — auto-adds `id_tenant` filter
- **Controller**: exports `init()` for scheduled execution + specific query methods
- **Tenant**: multi-tenant; tenant config stored in MongoDB `tenant` collection

## Environment

Required variables (see `src/.env.example`):
```
NODE_PORT=3000
MONGO_CONNECTION=mongodb://...
MONGO_DATABASE=dbname
FIREBIRD_HOST, FIREBIRD_PORT, FIREBIRD_DATABASE, FIREBIRD_USER, FIREBIRD_PWD
PEDIDO_NUMERO_DIAS_PROCESSAR=15
CORS_ORIGIN=*
TZ="America/Sao_Paulo"
```

## Notes

- ESM modules (`"type": "module"` in package.json) — use `import/export`
- No TypeScript — plain JS; types in `src/types/` are runtime constants
- No tests configured — no jest/vitest/eslint setup
- Health endpoint: `GET /health` returns status JSON
- Tiny API rate-limit: `Tiny` class in `services/tinyService.js` auto-retries with sleep