# Architecture

## 1. Overview

This system uses a three-layer architecture:

```text
Browser
  -> React frontend
  -> TS/JS middle layer
  -> ONLYOFFICE DocumentServer
```

The architectural intent is to keep business logic and document editing responsibilities separate.

## 2. Layer Definitions

### 2.1 React Frontend

The frontend is the user-facing layer.

Primary responsibilities:

- render homepage
- render recent files list
- integrate local `@lazycatcloud/lzc-file-pickers`
- receive file-open entry parameters
- render editor container page
- request editor session/config from the middle layer
- load ONLYOFFICE DocsAPI script
- initialize `DocsAPI.DocEditor`
- show loading, empty, and error states

The frontend must not own file orchestration logic.

Frontend presentation decision:

```text
The homepage visual style must stay calm, flat, and office-product-like.
The intended tone is closer to WPS-like productivity UI than a marketing page.
Do not make it flashy.
```

Homepage module boundary:

```text
The homepage must contain only two business modules:
1. Recent files
2. Lazycat file picker area
```

The homepage must not contain descriptive or promotional modules.

Frontend dependency decision:

```text
The file picker component is @lazycatcloud/lzc-file-pickers.
It must be installed into the local frontend project and bundled locally.
It must not be loaded from a CDN.
```

### 2.2 TS/JS Middle Layer

The middle layer is the business backend of the app.

Boundary definition:

```text
The middle layer is a bridge layer between frontend and DocumentServer.
It is responsible for file orchestration and lightweight persistent app state.
It is not a presentation layer and it is not a document-rendering layer.
```

Primary responsibilities:

- accept all file-open requests
- normalize incoming Lazycat file URLs into a unified internal model
- validate file path and file type
- create ONLYOFFICE editor session/config
- provide download endpoint for DocumentServer
- receive save callback from DocumentServer
- write file back to Lazycat-accessible storage
- record and serve recent-file data
- own temporary session state and token mapping

This layer is the only place where file business rules should live.

Middle-layer input model:

- full Lazycat file URLs from frontend
- open-file actions
- save callbacks from DocumentServer

Middle-layer output model:

- editor config returned to frontend
- document bytes returned to DocumentServer
- file write-back execution
- recent-file data returned to frontend

Canonical input contract:

```text
The frontend passes a full Lazycat file URL to the middle layer.
Expected URL shape:
https://file.<box-domain>/_lzc/files/home/<path-after-home>
```

Canonical internal normalization result:

```text
The middle layer extracts and stores the relative path after:
/_lzc/files/home/
```

Middle-layer storage decision:

```text
The middle layer uses @lazycatcloud/minidb as its application data store.
It must be installed into the local backend project and used locally.
It must not be loaded from a CDN.
```

The initial expected storage scope includes at minimum:

- recent-file records
- editor session metadata
- token or mapping state if needed by implementation

The middle layer should not become a large general-purpose backend.

Its persistent scope should stay limited to application-owned lightweight state.

### 2.3 DocumentServer

DocumentServer is an isolated document editing backend.

Dependency boundary definition:

```text
The app depends on DocumentServer only through its standard editing protocol surface.
The app must not depend on DocumentServer internal page structure or internal implementation details.
```

Primary responsibilities:

- serve ONLYOFFICE frontend assets
- provide DocsAPI runtime support
- fetch document bytes from the middle layer
- render and operate the editor
- perform document editing and conversion
- callback the middle layer when saving

DocumentServer must not become part of app-specific Lazycat business logic.

The intended dependency surface includes at minimum:

- DocsAPI frontend script access
- `DocsAPI.DocEditor(config)` initialization path
- document download via `document.url`
- save callback via `callbackUrl`
- supported file type handling for target office formats

The app is not intended to depend on:

- DocumentServer homepage behavior
- DocumentServer internal HTML structure
- DocumentServer internal JS implementation details
- non-public internal paths used by chance
- upstream image file modifications as an integration mechanism

## 3. Deployment Model

Recommended deployment model inside the Lazycat app:

```text
service: app
  - Node.js runtime
  - TS/JS middle layer
  - React built static assets

service: document-server
  - ONLYOFFICE DocumentServer
```

Physical deployment may use one Node service for both frontend asset hosting and middle-layer APIs, but logical boundaries must remain intact.

Recommended first-version service split decision:

```text
Do not split frontend and middle layer into separate Lazycat services in the first version.
Use one `app` service for React static assets plus TS/JS backend logic.
Use one separate `document-server` service for ONLYOFFICE.
```

Reasoning:

- frontend and middle layer are tightly coupled in this app
- an extra service would add route and health-check complexity too early
- route ownership remains simpler with one `app` service and one `document-server` service

## 3.1 Routing Ownership Model

Recommended route ownership in `lzc-manifest`:

```text
/                    -> app
/open                -> app
/assets/             -> app
/api/                -> app
/download/           -> app
/callback/           -> app

/web-apps/           -> document-server
/hosting/            -> document-server
/cache/              -> document-server
/healthcheck         -> document-server
```

Interpretation:

- homepage belongs to the app service
- frontend static assets belong to the app service
- business API belongs to the app service
- document download and save callback belong to the app service
- ONLYOFFICE runtime resources belong to DocumentServer

## 3.2 Manifest Routing Strategy

Preferred `lzc-manifest` routing strategy:

```text
Use `application.upstreams` instead of only simple `routes`.
```

Reason:

- this app needs explicit path ownership
- `DocumentServer` paths must not be swallowed by the app service
- `/` should remain the final fallback to the app service

Conceptual route order:

```text
1. explicit DocumentServer runtime paths
2. explicit app API and app business paths
3. final `/` fallback to app
```

## 3.3 file_handler Entry Decision

The unified open-file entry should be owned by the app service.

Recommended shape:

```text
file_handler -> /open?url=%u
```

This keeps homepage-open and file_handler-open aligned under one application-controlled entry.

## 3.3.1 Entry Route vs Internal API

The app should use two different interfaces for two different purposes:

```text
External entry route: /open?url=...
Internal business API: POST /api/editor/session
```

Recommended responsibility split:

- `/open?url=...` exists for external entry and browser navigation
- `POST /api/editor/session` exists for React-to-middle-layer session creation

This keeps entry routing simple while preserving a clean backend API contract.

## 3.4 public_path Design Decision

`public_path` is not fixed blindly at architecture stage.

The decision depends on whether DocumentServer will access download/callback through:

- public application domain
- internal service address

However, the architecture-level invariant is fixed:

```text
/download/* and /callback/* always belong to the app service.
```

What may vary later is only whether they must be added to `public_path`.

## 4. Responsibility Ownership

### 4.1 What belongs to React

- homepage UI
- recent files presentation
- file picker interactions
- editor container page
- browser-side navigation and local UI state
- local integration of `@lazycatcloud/lzc-file-pickers`
- responsive layout for desktop, mobile, and client window sizes

### 4.2 What belongs to the Middle Layer

- Lazycat file URL parsing and normalization
- file access orchestration
- editor config generation
- download/callback endpoints
- recent files authoritative storage
- security validation
- local integration of `@lazycatcloud/minidb`
- `/api/*`, `/download/*`, and `/callback/*` route ownership
- bridge logic between frontend and DocumentServer
- `POST /api/editor/session` business API ownership

What does not belong to the middle layer:

- frontend presentation logic
- document rendering logic
- upstream ONLYOFFICE runtime asset serving
- unrelated large business domains outside file orchestration and lightweight app state

### 4.3 What belongs to DocumentServer

- `/web-apps/*` assets
- ONLYOFFICE DocsAPI resources
- document editor runtime
- save callback emission
- ONLYOFFICE runtime route ownership such as `/web-apps/*`

## 5. Unified Entry Principle

All file-opening entry points must converge into one application-level model.

Examples of entry sources:

- homepage file picker
- Lazycat `file_handler`

Both must be translated into the same internal open-file flow through the middle layer.

## 6. Design Intent Summary

This architecture exists to guarantee the following:

- UI changes do not require changes to DocumentServer internals.
- Lazycat integration remains in app-owned layers.
- DocumentServer can be upgraded independently.
- File open/save behavior is centralized and auditable.
- Multiple file-open entry points reuse the same backend flow.
- `lzc-manifest` route ownership remains explicit and maintainable.
- the homepage remains a productivity surface, not a descriptive landing page.
- DocumentServer remains a replaceable third-party editing engine.

## 7. DocumentServer Upgrade Perspective

DocumentServer is expected to evolve independently.

The app should remain stable as long as the following contract stays valid:

- DocsAPI resource remains reachable
- editor initialization remains compatible
- document download contract remains compatible
- callback contract remains compatible
- route ownership remains correct for runtime paths

This means the architecture intentionally binds to protocol-level behavior rather than implementation-level details.
