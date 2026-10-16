# Repository review guidance

## Production invariants

- The API is authoritative for prices, availability, and order totals.
- Money uses integer cents; never use floating-point arithmetic for totals.
- Kiosk requests are untrusted and must be validated at the HTTP boundary.
- Never log credentials, bearer tokens, payment data, or customer PII.
- Repository methods own persistence details; services own business rules.
- Prefer bounded inputs, deterministic tests, and actionable customer-safe errors.

## CodeRabbit showcase scope

Files under `coderabbit-showcase/fixtures/` are intentionally defective local review fixtures. Review them as proposed production code and report each issue with severity, impact, and a concrete fix. Do not suppress findings merely because the fixtures are a demonstration. When asked to fix findings, preserve the public API and make the fixture tests pass.
