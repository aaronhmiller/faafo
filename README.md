# Verdant Coffee Kiosk

A touch-first, single-page menu and ordering experience for an in-store coffee kiosk. The repository is an npm workspace monorepo with a zero-framework TypeScript API, a SQLite database, shared contracts, and a Vite-powered frontend.

## Workspace map

```text
apps/api           HTTP API, application services, and SQLite adapter
apps/kiosk         Touch-first single-page kiosk experience
packages/contracts Shared API types and validation helpers
docs               Architecture and operational notes
```

## Quick start

Requires Node.js 24 or newer.

```bash
npm install
npm run dev:api
npm run dev:kiosk
```

Open `http://localhost:5173`. The API seeds `./data/verdant.db` and listens on `http://localhost:3001`.

## Quality gates

```bash
npm test
npm run typecheck
npm run build
```

See [docs/architecture.md](docs/architecture.md) for boundaries and extension points.
