# ONLYOFFICE Docs AI Entry

## Project Goal

This project builds a Lazycat application with a three-layer architecture:

1. React frontend for homepage, recent files, file picker, and editor container.
2. TS/JS middle layer for file access, editor session creation, recent-file state, and ONLYOFFICE integration.
3. ONLYOFFICE DocumentServer as an isolated document editing backend service.

The core principle is:

```text
Frontend handles UI.
Middle layer handles business logic and file orchestration.
DocumentServer handles editing engine capabilities only.
```

## Document Map

- `architecture.md`: static structure, service boundaries, and responsibility ownership.
- `architecture.md`: static structure, service boundaries, service split decision, and route ownership model.
- `flows.md`: runtime flows for opening files, editor initialization, downloading, saving, and recent-file updates.
- `constraints.md`: hard rules, routing boundaries, upgrade rules, and forbidden designs.
- `plan.md`: phased implementation sequence and acceptance targets.

## Recommended Reading Order

- To understand the whole system:
  Read `README-AI.md` + `architecture.md`
- To implement file open/save logic:
  Read `README-AI.md` + `flows.md` + `constraints.md`
- To implement frontend pages and interactions:
  Read `README-AI.md` + `architecture.md` + `flows.md`
- To start coding end-to-end:
  Read `README-AI.md` + `architecture.md` + `flows.md` + `constraints.md` + `plan.md`

## Current Architecture Decision

The current agreed architecture is:

```text
React frontend -> TS/JS middle layer -> DocumentServer backend
```

The currently fixed local package decisions are:

```text
Frontend file picker: @lazycatcloud/lzc-file-pickers
Middle-layer storage: @lazycatcloud/minidb
```

These packages must be installed and bundled locally in the project.

```text
CDN usage is forbidden for both packages.
```

Important interpretation:

```text
DocumentServer is not the business backend.
DocumentServer is a document editing engine backend.
The middle layer is the real business backend of this app.
```

## Current Stage

The project is currently in architecture-definition stage.

At this stage:

- The document set defines system structure and boundaries.
- No implementation details should violate the rules in `constraints.md`.
- Future code generation should follow the phased sequence in `plan.md`.
