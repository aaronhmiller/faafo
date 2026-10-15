# AI concierge: architecture and review guide

This change deliberately spans UI state, API contracts, model integration, business policy, persistence, and operations. Review it as a system rather than as isolated files.

## Request path

```text
Kiosk mood + dietary flags
  -> contract parser (bounded enums, no free text)
  -> candidate policy (availability, cart exclusion, dietary intersection)
  -> AI provider (structured candidates, strict output contract, 1.8s timeout)
  -> output grounding (known IDs, deduplication, max three)
  -> metadata-only audit event
  -> kiosk explanation + source disclosure
```

If the provider is absent, slow, malformed, or unavailable, the same service invokes the deterministic house recommender. Checkout does not depend on recommendations.

## Trust boundaries

1. **Kiosk → API:** all values are parsed against fixed enums and bounded arrays. The kiosk sends no customer name or free-text prompt.
2. **Database → model:** menu copy is treated as untrusted prompt data. The system prompt explicitly prohibits following instructions inside candidates.
3. **Model → API:** JSON is shape-checked, reasons are length-bounded, and IDs are grounded against the filtered candidate set.
4. **API → audit store:** only a random trace ID, categorical inputs, result IDs, timing, and source are stored. There is no customer or device identifier.
5. **Recommendation → customer:** the UI identifies AI versus fallback and does not present dietary filtering as an allergy guarantee.

## Agentic review missions

Run separate review passes, then reconcile their conclusions:

- **Contract investigator:** trace every request and response field across kiosk, parser, service, provider, and UI.
- **Safety investigator:** attempt prompt injection through menu content, hallucinated IDs, malformed JSON, timeouts, and duplicate output.
- **Privacy investigator:** enumerate what leaves the store network and what persists in `recommendation_events`.
- **Reliability investigator:** follow provider-disabled, provider-error, zero-candidate, and database-failure paths.
- **Product investigator:** verify disclosure, allergy language, loading behavior, and whether cart contents appropriately influence results.

## Evaluation matrix

| Scenario | Invariant | Automated coverage |
| --- | --- | --- |
| Provider invents an item | Unknown IDs never reach the customer | `recommendation-service.test.ts` |
| Vegan selection | Every candidate carries the vegan flag | `recommendation-service.test.ts` |
| Provider fails | Deterministic results return and source is `fallback` | `recommendation-service.test.ts` |
| Item already in cart | Candidate is removed before provider invocation | `recommendation-service.test.ts` |
| Provider response is malformed | Provider rejects it; service falls back | Provider parser + fallback path |

## Deployment controls

- Leave `AI_RECOMMENDATIONS_URL` or `AI_API_KEY` blank to run deterministic-only.
- Use a low-capability, low-latency model because the task is bounded ranking, not conversation.
- Alert on fallback ratio and p95 latency derived from metadata-only audit rows.
- Rotate the provider key outside the repository and never expose it to the kiosk build.
