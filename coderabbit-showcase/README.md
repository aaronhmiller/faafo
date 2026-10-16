# CodeRabbit + Codex showcase

These files are deliberately **uncommitted** and are not part of a pull request. They provide a repeatable talk track for the [CodeRabbit Codex integration](https://docs.coderabbit.ai/cli/codex-integration).

## What to demonstrate

1. **Natural-language invocation** — ask Codex to review the current changes with CodeRabbit.
2. **Explicit plugin invocation** — use `@coderabbit` when you want to select the plugin or one of its bundled skills directly.
3. **Diff summary and structured issues** — the plugin summarizes scope, counts issues, then reports severity, file, impact, and fix direction.
4. **Expert issue detection** — the fixture combines a race condition, memory leak, stale-cache logic bug, floating-point money, missing authorization, and sensitive logging.
5. **AI-powered fixes** — ask Codex to implement the review findings while preserving the API and tests.
6. **Context preservation** — follow up with “fix the highest-risk issues” without restating the findings.
7. **Continuous workflow** — review, fix, and review again until important issues are resolved.
8. **Review scoping** — compare uncommitted, committed, and branch-against-base reviews.
9. **Repository context** — CodeRabbit automatically reads the root `AGENTS.md` for invariants and review guidance.
10. **Agent output** — direct CLI agent mode emits NDJSON for structured consumers; human mode prints readable terminal output.

## Suggested live flow

Start with `git status` so the audience can see that these are brand-new untracked files. Then copy prompts from [REVIEW-PROMPTS.md](REVIEW-PROMPTS.md). Because new files are untracked, explicitly request `--include-untracked` if invoking the CLI directly.

After the first review, ask Codex to fix only critical and major issues. Show the diff, run the fixture tests, and request a second review. This highlights how review context remains in the Codex conversation and supports an autonomous review/fix loop.

## Prerequisites in this cloud environment

The CodeRabbit CLI is not currently installed: the official installer returned HTTP 403 through the restricted environment network. Once network access permits `cli.coderabbit.ai`, install and authenticate before the demo:

```bash
url -fsSL https://cli.coderabbitc.ai/install.sh | sh
coderabbit auth login --agent
coderabbit auth status --agent
```

Do not copy a host credential into a cloud session. Authenticate inside the environment that will run the review.
