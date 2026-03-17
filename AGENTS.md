# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Contrail?

Contrail is an AT Protocol (Bluesky) data indexer that runs on Cloudflare Workers + D1. You define collections in `src/config.ts`, and it automatically handles Jetstream ingestion, PDS backfill, user discovery via relays, and serves typed XRPC query endpoints.

## Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start wrangler dev server (port 8787)
pnpm dev:auto             # Start dev with auto-ingestion every 60s
pnpm generate             # Regenerate lexicons + types from config
pnpm generate:pull        # Pull lexicons from network, detect fields, generate types
pnpm typecheck            # Run tsc --noEmit
pnpm ingest               # Manually trigger ingestion cycle (requires dev server running)
pnpm sync                 # Discover users + backfill records from PDS (requires dev server)
pnpm deploy               # Deploy to Cloudflare Workers
```

## Architecture

### Entry points

- **`src/adapters/worker.ts`** — Cloudflare Worker entry point. Handles HTTP fetch (Hono app) and scheduled cron (ingestion cycle).
- **`src/adapters/sqlite.ts`** — Local SQLite adapter wrapping better-sqlite3 to match the D1 `Database` interface. Excluded from tsconfig for Worker builds.

### Core modules (`src/core/`)

- **`types.ts`** — Central types (`Database`, `ContrailConfig`, `RecordRow`, `IngestEvent`) and config resolution logic. The `Database`/`Statement` interface abstracts over D1 and SQLite.
- **`jetstream.ts`** — Connects to Bluesky Jetstream WebSocket endpoints, collects events, runs full ingest cycles (load cursor → ingest → apply → save cursor → refresh identities).
- **`backfill.ts`** — Two functions: `backfillUser` (pages through a user's PDS via `com.atproto.repo.listRecords`) and `discoverDIDs` (discovers users via `com.atproto.sync.listReposByCollection` from relay endpoints).
- **`identity.ts`** — DID/handle resolution and caching in the `identities` table.
- **`client.ts`** — Creates authenticated AT Protocol XRPC clients for a given DID.
- **`queryable.generated.ts`** — Auto-generated file mapping collections to their queryable fields. **Do not edit manually** — run `pnpm generate`.

### Database (`src/core/db/`)

- **`schema.ts`** — Schema initialization: base tables (records, counts, backfills, discovery, cursor, identities) + dynamic indexes derived from queryable fields and relations.
- **`records.ts`** — Core DB operations: cursor management, applying ingest events (upsert/delete + relation count updates), querying records with filters/pagination.

### Router (`src/core/router/`)

- **`index.ts`** — Hono app factory with CORS, health checks, admin routes, and per-collection routes.
- **`collection.ts`** — Registers dynamic XRPC endpoints per collection: `getRecords`, `getRecord`, `getUsers`, `getStats`, plus custom queries.
- **`admin.ts`** — Admin endpoints (`sync`, `getCursor`, `getOverview`) protected by `ADMIN_SECRET`.
- **`hydrate.ts`** — Hydration: embedding related records into responses.
- **`profiles.ts`** — Profile resolution: attaching handle + profile data to responses.

### Code generation (`scripts/generate-lexicons.ts`)

This script reads `src/config.ts`, auto-detects queryable fields from lexicon JSON files, generates XRPC lexicon definitions under `lexicons-generated/`, updates `lex.config.js`, and writes `src/core/queryable.generated.ts`. The `lex-cli generate` step then produces TypeScript types under `src/lexicon-types/`.

### Key patterns

- **Config-driven**: `src/config.ts` is the single source of truth. Adding a collection there drives schema creation, endpoint registration, Jetstream subscriptions, and code generation.
- **Database abstraction**: `Database`/`Statement` interfaces in `types.ts` let the same core logic run against both Cloudflare D1 and local SQLite.
- **Dependent collections**: Collections with `discover: false` (e.g., profiles) only index records for DIDs already known from discoverable collections.
- **Relations**: Materialized counts in the `counts` table, updated on every ingest event. `groupBy` splits counts by a field value.
