# Plan

## 1. Delivery Strategy

Implementation should proceed in phases.

Each phase must preserve the architecture and constraints defined in the companion documents.

## 2. Phase 1: Minimum End-to-End Editing Loop

Goal:

```text
Build the smallest working system that can open a file, edit it through ONLYOFFICE, and save it back.
```

Scope:

- Node-based TS/JS middle layer skeleton
- React frontend skeleton
- independent DocumentServer service
- local backend dependency wiring for `@lazycatcloud/minidb`
- unified file-open entry model
- `/open?url=...` external entry route
- `POST /api/editor/session` internal session API
- editor session creation
- document download endpoint
- save callback endpoint
- minimal file_handler-compatible entry handling

Acceptance focus:

- file can be opened through the unified flow
- ONLYOFFICE editor initializes successfully
- DocumentServer can download the file from middle layer
- save callback reaches middle layer
- updated file can be written back

## 3. Phase 2: Homepage and Recent Files

Goal:

```text
Add user-facing homepage features without changing the core editor flow.
```

Scope:

- homepage UI
- recent-file API and UI
- recent-file persistence design using local `@lazycatcloud/minidb`
- frontend navigation between homepage and editor page
- restrained office-style homepage presentation
- responsive adaptation for desktop, mobile, and client window sizes

Acceptance focus:

- homepage renders independently of DocumentServer internals
- recent files are recorded through backend-owned state
- reopening recent files reuses the same editor session flow
- homepage contains only the recent-files module and Lazycat file-picker module
- homepage does not include descriptive or promotional sections

## 4. Phase 3: lzc-file-pickers Integration

Goal:

```text
Enable homepage-based file selection through Lazycat file picker.
```

Scope:

- local integration of `@lazycatcloud/lzc-file-pickers`
- picker result normalization into the agreed full Lazycat file URL contract
- reuse of existing open-file session creation flow

Acceptance focus:

- picker-selected file opens through the same middle-layer flow
- no duplicate editor backend logic is introduced
- file picker package is bundled locally, not loaded from CDN

## 5. Phase 4: Robustness and Productization

Goal:

```text
Improve stability, observability, and maintainability while preserving architecture boundaries.
```

Scope:

- better error handling
- clearer session/token management
- recent-file data refinement
- safer validation and routing hardening
- upgrade-oriented packaging cleanup
- DocumentServer upgrade checklist and regression verification

Acceptance focus:

- failures are diagnosable
- route ownership remains clear
- future upgrades do not require upstream image modification
- DocumentServer upgrades can be validated through a stable regression checklist

## 6. What Not To Do Early

The following should not be part of early implementation unless required by a validated blocker:

- heavy full-site reverse proxying of DocumentServer
- invasive homepage replacement inside upstream image contents
- duplicate flows for different file-open entry points
- premature complex collaboration or extra product features

## 7. Recommended Execution Order

Recommended implementation order:

```text
1. define route ownership
2. stand up middle layer + frontend shell
3. connect DocumentServer assets
4. implement editor session flow
5. implement download/callback loop
6. add recent files
7. add lzc-file-pickers
8. harden constraints and packaging
```

## 8. Planning Summary

The project should always prioritize:

```text
first make the editor loop work,
then add homepage experience,
then add convenience features,
then optimize robustness.
```
