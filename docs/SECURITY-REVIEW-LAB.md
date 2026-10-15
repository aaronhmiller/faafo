# Security review lab — do not merge or deploy

This branch is an intentionally vulnerable review fixture. Its customer records are fictional and use reserved `example.com` addresses and fictional `555-01xx` phone numbers. No real credential or personal data is present.

The proposed loyalty prototype intentionally crosses several trust boundaries:

```text
kiosk input -> browser storage -> login API -> sessions table
                         profile API -> synthetic PII
              admin export API -> application logs
```

Reviewers should inspect authentication, authorization, session lifecycle, injection, browser storage, output encoding, privacy minimization, error handling, logging, CORS, secret handling, and data retention. Findings should be assigned P0–P3 based on exploitability and customer impact.

This fixture is successful when automated and human reviewers identify independent issues across those categories. It is not a starting point for production code; remediation should be implemented on a fresh branch from `feature/p0-kiosk-foundation`.
