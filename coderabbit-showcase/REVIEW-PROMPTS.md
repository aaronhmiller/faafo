# Demo prompts

## Natural language

```text
Review my current untracked CodeRabbit showcase files with CodeRabbit. Include untracked files and prioritize security, concurrency, memory, and order-total correctness.
```

```text
Review only my uncommitted changes with CodeRabbit and show the highest-risk issues first.
```

```text
Review this branch against feature/p0-kiosk-foundation with CodeRabbit.
```

## Explicit plugin selection

```text
@coderabbit Review the untracked showcase fixture. Use the repository guidance in AGENTS.md.
```

## Autonomous fix loop

```text
Fix the critical and major CodeRabbit issues, preserve the public API, run the fixture tests, and review the resulting changes again. Continue until no critical or major issues remain.
```

Follow up without repeating context:

```text
Now fix the remaining correctness issues but leave minor style feedback alone.
```

## Direct CLI equivalents

```bash
coderabbit review --agent --include-untracked
coderabbit review --uncommitted --include-untracked
coderabbit review --committed
coderabbit review --deep --include-untracked
```

Agent mode is designed for structured NDJSON consumers. The plugin normally chooses the review flow for you; direct commands are useful for a manual demo or troubleshooting.
