# Backend Agent Guidelines

This document defines backend-specific design boundaries and edge-case rules for the TS/JS middle layer.

The backend in this project means `app/server/**` plus shared contracts in `app/shared/**`.

## Core Responsibility

The TS/JS middle layer is the application's business backend.

It must own:

- file URL normalization
- file path validation
- editor session creation and takeover/conflict rules
- ONLYOFFICE document download endpoints
- ONLYOFFICE save callback handling
- file write-back orchestration
- lightweight app state such as sessions, recent files, favorites, online URL history, and font metadata actions
- current-user scoping for user-owned storage views

It must not become:

- a presentation layer
- a document rendering engine
- a replacement for ONLYOFFICE DocumentServer
- a large unrelated general-purpose backend

## Required Backend Docs

Before backend changes, read:

- `docs/README-AI.md`
- `docs/architecture.md`
- `docs/flows.md`
- `docs/constraints.md`
- this file

## Route Ownership

App-owned backend routes include:

- `/api/*`
- `/open` frontend entry support through static fallback
- `/download/*`
- `/callback/*`

ONLYOFFICE runtime routes must remain DocumentServer-owned through manifest/proxy configuration, including:

- `/web-apps/*`
- `/hosting/*`
- `/cache/*`
- `/doc/*`
- `/healthcheck`

Do not accidentally route ONLYOFFICE runtime assets into the app backend.

## File URL and Storage Rules

All file entry points must converge into the same middle-layer session flow.

Rules:

- Do not create separate backend open flows for homepage, file handler, recent files, favorites, or clientfs.
- Normalize file references in `app/server/services/file-url.ts` or a clearly equivalent service layer.
- Treat frontend-provided URLs and paths as untrusted input.
- Canonical Lazycat file input is a full file URL shaped like `https://file.<domain>/_lzc/files/home/<path>`.
- Store and operate on normalized relative paths, not arbitrary full URLs, for local file storage targets.
- Reject unsafe paths that escape configured roots.
- Preserve owner/user scoping when resolving home and clientfs paths.

## ClientFS Rules

ClientFS is special and must stay explicit.

Rules:

- Resolve clientfs under `/lzcapp/clientfs/{current-user}/...` or the configured `CLIENTFS_ROOT` equivalent.
- Do not mix clientfs paths with Lazycat home paths.
- Preserve the `clientfs:` URL prefix through frontend open and backend normalization.
- Direct write-back may fail if the platform mounts clientfs read-only. If runtime returns `EROFS`, report the platform mount limitation clearly instead of silently copying to another storage target.
- Do not reintroduce “copy clientfs file to Lazycat document/home on first open” unless the user explicitly requests that behavior.

## Session and Conflict Rules

Editor sessions are backend-owned state.

Rules:

- Session creation belongs in the middle layer.
- Document identity should be stable enough to detect duplicate active edit sessions.
- Edit conflicts should be handled by backend session state, not by frontend-only flags.
- Takeover should supersede old active sessions instead of leaving two active edit sessions for the same user/document.
- Read-only/view mode must not write back on callback.
- Inactive, released, or superseded sessions must ignore save callbacks safely.

## ONLYOFFICE Callback Rules

ONLYOFFICE callbacks are backend business flow.

Rules:

- Only save when callback status indicates saved/force-saved content and a valid URL exists.
- Fetch saved content from the callback `url` server-side.
- Write back through the storage-specific service path.
- Return ONLYOFFICE-compatible JSON responses such as `{ "error": 0 }` for handled callbacks.
- Log enough context for save failures: session id, storage type, relative path, owner uid, status, key, and error message.
- Do not expose sensitive tokens or cookies in logs.

## Download Rules

DocumentServer downloads documents through backend-owned `/download/*` endpoints.

Rules:

- Resolve files by session id, not raw arbitrary request paths.
- Support range/head behavior where needed by DocumentServer.
- Use correct content type from file type.
- Do not let DocumentServer directly interpret Lazycat business paths.

## Persistence Rules

The backend may persist lightweight app-owned state only.

Allowed examples:

- editor session metadata
- recent files
- favorites
- online URL history
- font-management status/log metadata

Rules:

- Prefer `@lazycatcloud/minidb` when available.
- Keep local JSON fallback scoped to `STATE_DIR`.
- Keep fallback behavior explicit and logged once when MiniDB is unavailable.
- Do not use frontend localStorage as authoritative backend state.
- Do not persist large document contents as app metadata unless explicitly required by a future design revision.

## User Scoping Rules

Backend APIs must resolve the current user consistently.

Rules:

- Use the existing request-user helper when adding user-owned APIs.
- Filter recent files, favorites, and other user-scoped state by owner uid.
- Do not return one user's clientfs/home/recent/favorite data to another user.
- Validate any owner uid before composing filesystem paths.

## Fonts Backend Rules

Font management is app-owned backend behavior plus DocumentServer refresh orchestration.

Rules:

- Store uploaded fonts under configured `FONTS_DIR`, currently `/lzcapp/var/fonts`.
- Validate font extension/type for uploads.
- Keep large upload limits aligned with proxy config.
- Manual refresh should be explicit and report success/failure based on watcher status where possible.
- Keep font-refresh scripts out of bloated inline manifest blocks when practical.

## Error Handling Rules

Backend error handling should be explicit and safe.

Rules:

- Use structured `HttpError` or equivalent error responses for expected failures.
- Keep user-facing errors actionable.
- Log server-side details for debugging without leaking sensitive data.
- Do not swallow write-back failures silently.
- Do not “success” a failed save unless the callback is intentionally ignored due to inactive/view session rules.

## Shared Contract Rules

Shared API contracts live in `app/shared/**`.

Rules:

- Update shared types when backend responses or requests change.
- Keep frontend and backend import paths aligned with shared contracts.
- Do not duplicate subtly different request/response shapes in frontend and backend.

## Validation

For backend code changes, run:

```sh
npm --prefix app run typecheck
./build.sh
lzc-cli project build
```

If changing only docs, build is not required unless requested.
