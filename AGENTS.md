# AGENTS.md

Scope: entire repository.

This file is the routing entry for AI agents. It should not duplicate detailed project constraints. For concrete rules, route to the matching docs and follow them.

## Agent Routing

### Architecture Agent

Use when changing service boundaries, route ownership, middle-layer responsibilities, DocumentServer integration boundaries, or cross-layer behavior.

Read first:

- `docs/README-AI.md`
- `docs/architecture.md`
- `docs/constraints.md`
- `docs/backend-agent.md`

### File Flow Agent

Use when changing file open, file URL normalization, editor session creation, document download, ONLYOFFICE callback, save/write-back, recent records, favorites, or clientfs behavior.

Read first:

- `docs/README-AI.md`
- `docs/flows.md`
- `docs/constraints.md`
- `docs/backend-agent.md`

### Frontend Agent

Use when changing React pages, CSS, layout, icons, empty states, navigation, file list UI, font management UI, favorites UI, recent UI, or editor/open-page UI.

Read first:

- `docs/README-AI.md`
- `docs/architecture.md`
- `docs/constraints.md`
- `docs/frontend-agent.md`

### Lazycat Package Agent

Use when changing Lazycat packaging, `lzc-build.yml`, `lzc-manifest.yml`, `package.yml`, service binds, setup scripts, routes, public paths, file handlers, or lpk build behavior.

Read first:

- `docs/README-AI.md`
- `docs/architecture.md`
- `docs/constraints.md`
- `lzc-build.yml`
- `lzc-manifest.yml`
- `package.yml`

### Docs Agent

Use when changing project guidance, constraints, planning docs, or agent routing itself.

Read first:

- `docs/README-AI.md`
- Existing doc being edited
- `AGENTS.md` when changing agent routing

## General Rules

- Do not rely on memory when docs define a boundary or rule.
- Keep changes minimal and focused on the user request.
- Do not rewrite unrelated UI or backend behavior.
- Preserve the documented architecture boundaries.
- Prefer local bundled assets/dependencies; do not introduce CDN dependencies for project-critical frontend/backend packages.
- Use existing SVG assets from `app/frontend/src/icon` when matching icons already exist.
- Do not commit changes unless explicitly requested.

## Validation Routing

For runtime code changes, normally run:

```sh
npm --prefix app run typecheck
./build.sh
lzc-cli project build
```

For docs-only changes, build is not required unless requested.

## Response Language

The user communicates in Chinese. Final responses should be concise Chinese summaries with changed paths and validation status.
