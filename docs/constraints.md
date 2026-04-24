# Constraints

## 1. Core Architecture Rules

### Rule 1

DocumentServer is only a document editing engine backend.

It must not become the business backend of the application.

### Rule 2

The TS/JS middle layer is the only business backend of the application.

All file access orchestration must be centralized there.

### Rule 3

React frontend is only the UI and interaction layer.

It must not own the authoritative file business flow.

### Rule 3.1

Frontend file-picker integration must use locally installed `@lazycatcloud/lzc-file-pickers`.

CDN loading is forbidden.

### Rule 3.2

The homepage visual style must be restrained, plain, and office-product-like.

It must not become a flashy or marketing-style page.

### Rule 3.3

The homepage must contain only two business modules:

- recent files
- Lazycat file picker area

### Rule 3.4

The homepage must not contain explanatory, descriptive, marketing, onboarding, or technology-introduction sections.

This includes, but is not limited to:

- project introduction
- module explanation blocks
- technology stack description
- welcome banners
- hero sections
- feature explanation cards

### Rule 3.5

Frontend layout must support desktop, mobile, and narrow client window scenarios.

## 2. File-Orchestration Rules

### Rule 4

Homepage file picker flow and Lazycat file_handler flow must converge into the same middle-layer open-file logic.

They are allowed to have different entry points, but not different backend implementations.

### Rule 5

Frontend should pass a full Lazycat file URL, not raw file content, as the core open-file input.

### Rule 5.1

The expected frontend input format is:

```text
https://file.<box-domain>/_lzc/files/home/<path-after-home>
```

### Rule 5.2

The middle layer must normalize the incoming URL and extract the canonical relative path after `/_lzc/files/home/`.

### Rule 6

The middle layer must be the only place that:

- validates incoming file references
- creates editor sessions
- exposes document download endpoint
- receives save callbacks
- writes file back

### Rule 6.1

The middle layer exists to bridge frontend and DocumentServer.

It must not evolve into a presentation layer.

### Rule 6.2

The middle layer may persist only application-owned lightweight state, such as recent files and session metadata.

It must not become an unrelated large business backend without an explicit architecture revision.

## 3. Routing Rules

### Rule 7

ONLYOFFICE runtime paths must remain owned by DocumentServer.

This includes at minimum:

- `/web-apps/*`
- other ONLYOFFICE runtime asset paths as needed

### Rule 8

The application frontend and middle-layer routes must not accidentally swallow DocumentServer runtime paths.

### Rule 8.1

The first-version deployment must prefer one `app` service plus one `document-server` service.

Do not split frontend and middle layer into separate Lazycat services unless there is a clear architectural reason.

### Rule 9

Do not design the system around proxying the entire DocumentServer site through the middle layer unless absolutely necessary.

The preferred design is clear route ownership, not blanket reverse proxying.

### Rule 9.1

`/open`, `/api/*`, `/download/*`, and `/callback/*` must remain app-owned routes.

### Rule 9.1.1

`/open?url=...` is the external entry route.

### Rule 9.1.2

`POST /api/editor/session` is the formal middle-layer session-creation API.

The two must not be collapsed into one ambiguous interface contract.

### Rule 9.2

`/web-apps/*` must remain a DocumentServer-owned route.

## 4. Upgrade Rules

### Rule 10

Do not modify upstream DocumentServer image contents.

### Rule 11

All homepage, file picker, recent-file, and Lazycat integration logic must stay outside DocumentServer image internals.

### Rule 12

System design should allow DocumentServer image replacement with minimal adaptation effort.

### Rule 12.1

The app may depend only on DocumentServer's standard editing protocol surface.

This includes DocsAPI loading, editor initialization, document download, and save callback behavior.

### Rule 12.2

The app must not depend on DocumentServer internal HTML, internal JS implementation, or private internal pages.

### Rule 12.3

The app must not use upstream image modification as a required integration strategy.

## 5. State Rules

### Rule 13

Recent-file data is business state and belongs to the middle layer.

Browser local cache may exist, but backend state remains authoritative.

### Rule 14

Session mapping, token mapping, and file-open bookkeeping must be middle-layer owned.

### Rule 14.1

Middle-layer persistent application state must use locally installed `@lazycatcloud/minidb`.

CDN loading is forbidden.

## 6. Security Rules

### Rule 15

Incoming file references must always be normalized and validated by the middle layer.

### Rule 15.1

The middle layer must not trust the raw incoming file URL as the final internal identifier.

It must validate host and prefix shape, decode the path, and keep only the normalized relative path as the internal canonical value.

### Rule 16

The middle layer must not trust frontend-provided file metadata without validation.

### Rule 17

DocumentServer should never be treated as trusted business validator for Lazycat file semantics.

## 7. Forbidden Directions

The following directions are forbidden unless the architecture is explicitly revised:

- treating DocumentServer as homepage/business backend
- duplicating separate open-file backend flows for picker and file_handler
- putting recent-file authoritative state only in frontend local storage
- tightly coupling app business pages to upstream DocumentServer internal pages
- relying on invasive modification of upstream DocumentServer image contents
- loading `@lazycatcloud/lzc-file-pickers` from a CDN
- loading `@lazycatcloud/minidb` from a CDN
- adding explanatory homepage modules beyond recent files and Lazycat file picker
- adding hero, banner, or marketing-style sections to the homepage
- turning the middle layer into a document-rendering layer
- turning the middle layer into an unrelated large general-purpose backend
- depending on DocumentServer internal page structure as an app contract
- depending on DocumentServer internal JS implementation as an app contract
- depending on upstream image patching as a permanent integration requirement

## 8. Constraint Summary

The system must preserve this invariant:

```text
React owns UI.
Middle layer owns business and file flow.
DocumentServer owns editing engine behavior.
```

## 9. Upgrade Checks

Whenever DocumentServer is upgraded, the following areas must be checked:

- DocsAPI resource availability
- editor initialization compatibility
- document download behavior from `document.url`
- save callback behavior to `callbackUrl`
- supported file type open behavior
- route ownership for DocumentServer runtime paths

Practical shorthand:

```text
Can load.
Can open.
Can save.
```
