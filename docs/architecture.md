# Architecture

Verdant keeps transport, business rules, persistence, and presentation separate so future channels—mobile ordering, a staff display, or delivery integrations—can reuse the same core behavior.

```text
Kiosk SPA -> HTTP routes -> Order service -> repositories -> SQLite
              |                  |
              +------ shared contracts ------+
```

## Boundaries

- `@verdant/contracts` owns public request and response shapes plus boundary validation.
- `@verdant/api` maps HTTP to application services. Repositories hide SQLite and expose domain-shaped records.
- `@verdant/kiosk` owns touch interaction and local cart state. It never calculates authoritative prices; the API returns the accepted total.

## Extension points

- Implement the repository interfaces for a hosted SQL database without changing route handlers.
- Add modifiers to contracts and persist them as immutable order-line snapshots.
- Publish an `order.created` event from `OrderService` for kitchen display and receipt integrations.

## Operational choices

- Money is represented in integer cents.
- Each order line snapshots its display name and unit price to preserve history.
- SQLite foreign keys and write-ahead logging are enabled at connection time.
- The API sends explicit CORS headers only for the configured kiosk origin.
