# Flows

## 1. Core Runtime Model

All file-opening behavior should follow this normalized model:

```text
User action -> frontend gets Lazycat file URL -> middle layer creates editor session ->
frontend initializes DocumentServer editor -> DocumentServer downloads file ->
DocumentServer saves back through callback -> middle layer writes back file
```

The frontend input is a full Lazycat file URL, not raw file bytes.

Middle-layer role in all flows:

```text
The middle layer receives full Lazycat file URLs from the frontend,
extracts the relative file path after /_lzc/files/home/,
translates that into a DocumentServer-consumable editing session,
and persists lightweight application state such as recent files.
```

## 2. Homepage File Picker Flow

```text
1. User opens homepage.
2. User selects a file through locally bundled @lazycatcloud/lzc-file-pickers.
3. React frontend obtains a full Lazycat file URL.
4. React calls POST /api/editor/session.
5. Middle layer validates the URL, extracts the relative path, and builds ONLYOFFICE config.
6. Frontend loads DocsAPI script from DocumentServer.
7. Frontend initializes DocsAPI.DocEditor with returned config.
8. DocumentServer fetches document bytes from middle-layer download endpoint.
9. User edits document.
10. DocumentServer posts save callback to middle layer.
11. Middle layer writes the updated document back.
12. Middle layer updates recent-file record.
```

## 3. Lazycat file_handler Flow

```text
1. User opens a file from Lazycat file manager.
2. Lazycat file_handler opens the app through /open?url=...
3. React frontend receives the incoming URL parameter from the entry route.
4. React calls POST /api/editor/session with that URL.
5. The rest of the process is identical to homepage flow.
```

This means homepage open and file_handler open are different entry sources, but not different backend flows.

## 3.1 Interface Split

The app uses two distinct layers of interface:

```text
/open?url=...
  = external browser entry route

POST /api/editor/session
  = formal middle-layer business API
```

This separation is intentional.

The first is for navigation and external invocation.
The second is for React-to-backend session creation.

## 4. Editor Initialization Flow

The frontend should not hardcode document download logic.

Recommended sequence:

```text
1. Frontend requests middle layer for editor config.
2. Middle layer returns ONLYOFFICE config.
3. Frontend loads `/web-apps/apps/api/documents/api.js` from DocumentServer.
4. Frontend calls `new DocsAPI.DocEditor(...)`.
```

The critical config fields conceptually include:

```text
document.title
document.fileType
document.url
document.key
editorConfig.callbackUrl
```

The middle layer owns the logic for these values.

## 5. Download Flow

DocumentServer should not directly interpret Lazycat business file paths.

The intended flow is:

```text
1. DocumentServer reads `document.url` from editor config.
2. DocumentServer requests middle-layer download endpoint.
3. Middle layer resolves the session/token to a validated relative file path.
4. Middle layer reads the underlying file.
5. Middle layer streams bytes back to DocumentServer.
```

The middle layer remains the single file-orchestration authority.

## 6. Save Callback Flow

The save path is also middle-layer owned:

```text
1. User triggers save through ONLYOFFICE editor.
2. DocumentServer posts to `callbackUrl`.
3. Middle layer validates the callback session.
4. Middle layer fetches or receives the saved content according to ONLYOFFICE protocol.
5. Middle layer writes content back to the original file target.
6. Middle layer records metadata updates such as recent-file timestamp.
```

## 7. Recent Files Flow

Recent files should follow this lifecycle:

```text
1. A document open request succeeds.
2. Middle layer records file metadata into local @lazycatcloud/minidb.
3. Frontend requests recent-file list from middle layer.
4. Frontend renders recent-file UI.
```

The backend is the authoritative source of recent-file data.

The recent-file store is application state only.

It is not intended to become a copy of the file system or a rich metadata warehouse.

## 8. File URL Model

The canonical frontend input is a full Lazycat file URL.

Expected pattern:

```text
https://file.<box-domain>/_lzc/files/home/<path-after-home>
```

Example:

```text
https://file.lc03test.heiyu.space/_lzc/files/home/文档/合同/test.docx
```

Canonical middle-layer internal value:

```text
文档/合同/test.docx
```

That value is the relative path after `/_lzc/files/home/`.

The middle layer must not treat the full URL as the final trusted storage key.

Instead, it must:

- validate the URL shape
- verify the fixed `/_lzc/files/home/` prefix
- decode and normalize the path
- keep the relative path as the internal canonical identifier

This keeps frontend input stable while making backend persistence independent of the full domain string.

## 9. Flow Summary

The most important runtime rule is:

```text
All entry points converge into one middle-layer-controlled editor session flow.
```

The most important middle-layer boundary rule is:

```text
The middle layer bridges frontend and DocumentServer,
and persists only the lightweight application state needed by the app itself.
```
