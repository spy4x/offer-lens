# OfferLens — Media Buyer's AI Co-Pilot

Landing page analysis AI — angles, hooks, ad copy, email/SMS, competitive intel.
Source: [github.com/spy4x/offer-lens](https://github.com/spy4x/offer-lens)

## Access

- **Web App**: `https://offer-lens.${DOMAIN}`
- **MCP**: `http://hl-offerlens-mcp:3000/mcp` (internal, via OpenWebUI)

## Build

Before first deploy, build Docker images from the offer-lens source:

```bash
# From homelab repo root
docker compose -f stacks/offerlens/compose.yml build
```

The `build.context` in compose.yml references `../../../offer-lens` relative to the stack directory. Ensure the offer-lens repo is cloned at `~/sync/code/offer-lens`.

## Stack

3 services:

| Service         | Image                     | Purpose                 |
| --------------- | ------------------------- | ----------------------- |
| `offerlens`     | `hl-offerlens:latest`     | API + Web UI, port 8000 |
| `offerlens-mcp` | `hl-offerlens-mcp:latest` | MCP server, port 3000   |
| `offerlens-db`  | `postgres:16-alpine`      | Usage tracking          |

## Env Vars

| Var                           | Required | Default                    | Description                     |
| ----------------------------- | -------- | -------------------------- | ------------------------------- |
| `OFFERLENS_DEMO_API_KEY`      | Yes      | —                          | DeepSeek API key for analysis   |
| `OFFERLENS_API_BASE`          | No       | `https://api.deepseek.com` | OpenAI-compatible base URL      |
| `OFFERLENS_MODEL`             | No       | `deepseek-chat`            | LLM model                       |
| `OFFERLENS_BATCH_CONCURRENCY` | No       | `5`                        | Batch concurrency               |
| `OFFERLENS_DB_NAME`           | No       | `offerlens`                | DB name                         |
| `OFFERLENS_DB_USER`           | No       | `offerlens`                | DB user                         |
| `OFFERLENS_DB_PASSWORD`       | Yes      | —                          | DB password                     |
| `OFFERLENS_MCP_SESSION_ID`    | No       | `offerlens-mcp`            | MCP session ID (auto-generated) |

## Monitoring

No Gatus endpoint yet (service has own auth). Add to gatus config on cloud server once route is stable.
