# AGENTS.md — OfferLens Dev Guidelines

## Branch-first workflow

**Create branch before any code changes.** Never edit main directly.

```bash
git checkout -b <type>/<short-description> main
```

Types: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `style/`, `perf/`, `ci/`

## Commit convention (Angular)

```
<type>(<scope>): <short summary>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`, `ci`
Scope: `api`, `web`, `ext`, `mcp`, `libs`, `deps` — omit if broad
Summary: lowercase, no period, imperative mood

Examples:

```
feat(api): add auth endpoints
fix(mcp): correct SSE endpoint format
refactor: move backend to apps/api
chore(deps): bump deno to 2.2
```

## PR discipline

- Create PR immediately after first commit (prefix `[WIP]` if incomplete)
- Update PR after every human interaction
- Remove `[WIP]` only when task is fully complete
- Keep PR body accurate

```bash
gh pr create --fill
```

## Deploy & verify (REQUIRED before final commit)

1. Build Docker images locally
2. Push images to production server
3. Verify service starts healthy
4. Verify feature works via public URL
5. Commit & push

## Pre-commit checklist

```bash
deno task check
```

Runs `fmt + lint + type-check + tests`. ALL must pass.

## Merge protocol

**Do not merge yourself.** Wait for human review.

When human says "merge":

- If all commits relate to same feature → **squash**
- If commits have independent meaning → **rebase**

```bash
gh pr merge --squash --delete-branch
git checkout main
git branch -d <branch-name>
```

## Apps structure

```
apps/
  api/     — Hono backend (routes, services, mod.ts)
  web/     — Fresh/Preact web app
  ext/     — Chrome extension
  mcp/     — MCP server (stdio + HTTP)
libs/
  shared/  — Types, constants, interfaces
  scraper/ — Page scraping logic
  prompts/ — LLM prompt templates
  analyzer/ — Scrape → prompt → LLM → structured output
  db/      — Postgres + in-memory fallback
```

## Code style

- Deno, TypeScript
- Interfaces for shapes, enums (start at 1) for constants, types for unions
- No semicolons, 2-space indent, double quotes, 100 col
- Store money as ints (cents)
- Minimize third-party deps

## Fail-open principle

Guard calls to non-critical external services with `|| true`. Failure of supporting subsystems must never block primary operations. Document tradeoffs when primary depends on external service.

## Key rules

- Never commit plaintext credentials or env values
- .env.example uses `REPLACE_WITH_*` placeholders
- Encryption (SOPS/age) for any env file committed to git
- One logical change per commit
- Keep commits small and focused
