# Facilitator notes

Use these only after the audience has seen the first review.

The fixture is seeded with interacting defects that benefit from review context:

- concurrent `pay` calls both pass the status check and emit duplicate paid events;
- `actorCustomerId` is logged but never used for authorization;
- the log contains a customer email and the complete order;
- JavaScript number arithmetic produces an imprecise monetary total;
- returning a missing cached total as zero corrupts repeat-payment behavior;
- event listeners have no unsubscribe path and can accumulate in a long-lived process;
- the total cache has no eviction and survives cancellations;
- cancellation is fire-and-forget, races with payment, and hides persistence errors;
- unbounded or negative discounts and prices are accepted.

The tests intentionally fail. A good fix loop should add an ownership field or authorization dependency, move money to integer cents, serialize the state transition in the store, make cancellation awaitable, redact logs, and provide lifecycle controls for listeners/cache. Ask Codex to reconcile API compatibility with those invariants rather than blindly patching each line.
