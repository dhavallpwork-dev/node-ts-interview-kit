# Multi-tenant Orders API: interview exercise

A small Express + TypeScript API for a multi-tenant food-delivery SaaS. Tenants (`acme`, `globex`) have orders and delivery slots. Data is in memory; there is no database to set up.

## Setup (about 1 minute)

Requires Node 20+.

```bash
npm install
npm test
```

`npm test` runs every task's tests. The baseline tests pass; each task's tests fail until you complete it. Run one task with `npx vitest run tests/03`.

`npm run dev` starts the server on port 3000 if you want to poke it with curl.

## Auth

Send `Authorization: Bearer <token>`. Seeded tokens are in `src/seed.ts`:

| Token | Tenant | Role |
|---|---|---|
| `acme-admin` | acme | admin |
| `acme-staff` | acme | staff |
| `acme-viewer` | acme | viewer |
| `globex-admin` | globex | admin |

```bash
curl -H "Authorization: Bearer acme-admin" "localhost:3000/orders?page=1&limit=5"
```

## Layout

```
src/
  app.ts            Express app wiring
  auth.ts           Token auth + role middleware
  store.ts          In-memory store (every call is async, with simulated DB latency)
  seed.ts           Seed data and tokens
  routes/orders.ts  GET /orders, GET /orders/:id, POST /orders, POST /orders/:id/cancel
  routes/slots.ts   GET /slots/:id, POST /slots/:id/book
tests/              One file per task
```

## Tasks

Talk through your reasoning as you go. Do them in any order. You may change any file under `src/`; do not change the tests.

### Easy

**1. Pagination.** `GET /orders?page=1` skips the first page of results. Fix it, and return `400` when `page` is not an integer >= 1 or `limit` is not an integer from 1 to 100. Default is `page=1`, `limit=10`.

**2. Request validation.** `POST /orders` accepts anything. Return `400` unless `items` is a non-empty array where every item has a non-empty string `sku`, a positive integer `quantity`, and a non-negative integer `unitPriceCents`.

### Medium

**3. Tenant isolation.** A user in one tenant can read another tenant's order through `GET /orders/:id`. Fix it so that request returns `404`. Then: where else in this codebase could the same class of bug appear, and how would you prevent it structurally rather than per route?

**4. Role-based access.** `requireRole` in `src/auth.ts` is a stub that lets everyone through. Implement it so a role not in the allowed list gets `403`. Viewers cannot create orders; only admins can cancel.

### Hard

**5. Slot overbooking.** Each delivery slot has a `capacity`. Under concurrent `POST /slots/:id/book` requests, the slot gets overbooked. Fix it so a slot never exceeds capacity, and the same order cannot be booked twice (`409`). Then: how would you solve this against PostgreSQL with several API instances running?

**6. Idempotent order creation.** Clients retry `POST /orders` on network timeouts and create duplicate orders. Support an `Idempotency-Key` header:

- Same key + same body returns the original order (`201`) and creates nothing new.
- Concurrent requests with the same key create exactly one order.
- Same key + different body returns `422`.
- Keys are scoped per tenant.
- No header: no deduplication.

Then: what changes when this runs on several instances with a real database, and how long should keys live?
