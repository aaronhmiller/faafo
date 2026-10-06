![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/aaronhmiller/faafo?utm_source=oss&utm_medium=github&utm_campaign=aaronhmiller%2Ffaafo&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
# faafo
A repo to 'mess' around with and find things out (yeah, you know what i mean don't you?)

## testing tagging & pushing to main
Setup two github actions workflows to handle the following situations:

1. Explicitly tagging a release
2. Pushing a change to main branch

***
2026/09/16
1. Testing CR TS config
2. Adding poem back

2026/07/25
Testing CR review

2025/03/19
Testing tj-actions...againB

2023/04/21
Adding Docker Hub scanning & fixing release note dates

2023/03/28
Testing the github remote host change

2025/09/07
note: it seems you can only have one (verified but no sigstore) or the other (sigstore but unverified)
CONFIRMED
reconfirming...just to be sure
another test

## MCP server
`mcp-server/` is a [Model Context Protocol](https://modelcontextprotocol.io) server (stdio transport) that exposes the users API as tools: `healthcheck`, `list_users`, `get_user`, `create_user`, `update_user`, `delete_user`.

```sh
cd mcp-server && npm install
npm test                      # smoke test against a stubbed API
FAAFO_BASE_URL=http://localhost:3000 npm start
```

`.mcp.json` at the repo root registers it for Claude Code, so opening this repo in Claude Code makes the tools available once the app is running (`docker compose up`).
