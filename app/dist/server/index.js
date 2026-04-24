var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@lazycatcloud/minidb/dist/remoteDB.js
var require_remoteDB = __commonJS({
  "node_modules/@lazycatcloud/minidb/dist/remoteDB.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteDB = void 0;
    function optionsToParams(selector, options) {
      options = Object.assign({}, options);
      const params = {};
      if (options.sort) {
        params.sort = JSON.stringify(options.sort);
      }
      if (options.limit != null) {
        params.limit = options.limit;
      }
      params.selector = JSON.stringify(selector || {});
      const p = new URLSearchParams(params);
      return p.toString();
    }
    var RemoteDB = class {
      constructor(url) {
        this.url = url;
      }
      async _findFetch(selector, options) {
        const params = optionsToParams(selector, options);
        return fetch(this.url + `?${params}`).then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          const data = await res.json();
          return data;
        });
      }
      find(selector, options) {
        return {
          fetch: () => this._findFetch(selector, options)
        };
      }
      async findOne(selector, options) {
        options = Object.assign({}, options, { limit: 1 });
        const params = optionsToParams(selector, options);
        return fetch(this.url + `?${params}`).then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          const data = await res.json();
          if (data.length > 0) {
            return data[0];
          } else {
            return null;
          }
        });
      }
      async upsertOrUpdate(selector, doc, options) {
        options = Object.assign({}, options, { limit: 1 });
        const params = optionsToParams(selector, options);
        return fetch(this.url + `/upsertOrUpdate?${params}`, {
          method: "POST",
          body: JSON.stringify(doc)
        }).then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return await res.json();
        });
      }
      upsert(docs, bases) {
        if (!Array.isArray(docs)) {
          docs = [docs];
        }
        let request;
        if (bases) {
          if (!Array.isArray(bases)) {
            bases = Array(docs.length).fill(bases);
          }
          if (docs.length != bases.length) {
            throw "docs length don't equal bases length";
          }
          request = fetch(this.url, {
            method: "PATCH",
            body: JSON.stringify({ docs, bases })
          });
        } else {
          request = fetch(this.url, {
            method: "POST",
            body: JSON.stringify({ docs })
          });
        }
        return request.then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          const data = await res.json();
          if (docs.length > 1) {
            return data;
          } else {
            return data[0];
          }
        });
      }
      remove(ids) {
        if (!Array.isArray(ids)) {
          ids = [ids];
        }
        const request = fetch(this.url, {
          method: "DELETE",
          body: JSON.stringify({ ids })
        });
        return request.then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return;
        });
      }
    };
    exports.RemoteDB = RemoteDB;
  }
});

// node_modules/@lazycatcloud/minidb/dist/index.js
var require_dist = __commonJS({
  "node_modules/@lazycatcloud/minidb/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MiniDB = exports.RemoteDB = void 0;
    var remoteDB_1 = require_remoteDB();
    Object.defineProperty(exports, "RemoteDB", { enumerable: true, get: function() {
      return remoteDB_1.RemoteDB;
    } });
    var MiniDB2 = class {
      constructor({ urlPath = "/_lzc/ext/db/", origin = window.origin } = {}) {
        this.remoteUrl = `${origin}${urlPath}`;
      }
      getCollection(name) {
        return new remoteDB_1.RemoteDB(this.remoteUrl + name);
      }
      async removeCollection(name) {
        return fetch(this.remoteUrl + name + "/drop", { method: "DELETE" }).then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return;
        });
      }
    };
    exports.MiniDB = MiniDB2;
  }
});

// server/config.ts
function loadConfig() {
  const port = Number(process.env.PORT || "3000");
  const appOrigin = (process.env.APP_ORIGIN || `http://localhost:${port}`).replace(/\/+$/, "");
  const homeRoot = process.env.HOME_ROOT || "/lzcapp/document";
  const stateDir2 = process.env.STATE_DIR || "/lzcapp/var/state";
  const documentServerPublicOrigin = (process.env.DOCUMENT_SERVER_PUBLIC_ORIGIN || "").replace(/\/+$/, "");
  const deployUid = (process.env.DEPLOY_UID || process.env.LAZYCAT_APP_DEPLOY_UID || "").trim();
  return {
    port,
    appOrigin,
    homeRoot,
    stateDir: stateDir2,
    documentServerPublicOrigin,
    deployUid
  };
}

// server/app.ts
import http from "node:http";

// server/errors.ts
var HttpError = class extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
  status;
  code;
};
function isHttpError(error) {
  return error instanceof HttpError;
}

// server/utils/http.ts
function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}
function sendError(response, error) {
  if (isHttpError(error)) {
    sendJson(response, error.status, { error: { code: error.code, message: error.message } });
    return;
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  sendJson(response, 500, { error: { code: "internal_error", message } });
}
async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

// server/services/editor-session.ts
import fs3 from "node:fs/promises";
import path4 from "node:path";

// server/services/file-url.ts
import path from "node:path";
var FILE_PREFIX = "/_lzc/files/home/";
function normalizeLazycatFileUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") {
    throw new HttpError(400, "missing_file_url", "Missing Lazycat file URL.");
  }
  let parsed;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return normalizeLazycatRelativePath(fileUrl);
  }
  if (parsed.protocol !== "https:") {
    throw new HttpError(400, "invalid_file_url_protocol", "File URL must use https.");
  }
  if (!parsed.hostname.startsWith("file.")) {
    throw new HttpError(400, "invalid_file_host", "File URL host must start with file.");
  }
  if (!parsed.pathname.startsWith(FILE_PREFIX)) {
    throw new HttpError(400, "invalid_file_prefix", `File URL path must start with ${FILE_PREFIX}.`);
  }
  const rawRelativePath = decodeURIComponent(parsed.pathname.slice(FILE_PREFIX.length));
  const relativePath = normalizeRelativePath(rawRelativePath);
  const title = path.posix.basename(relativePath) || "document";
  const fileType = path.posix.extname(title).replace(/^\./, "").toLowerCase();
  if (!fileType) {
    throw new HttpError(415, "unsupported_file_type", "File URL does not contain a file extension.");
  }
  return {
    originalUrl: fileUrl,
    fileOrigin: parsed.origin,
    relativePath,
    ownerUid: "",
    title,
    fileType
  };
}
function normalizeLazycatRelativePath(filePath) {
  const relativePath = normalizeRelativePath(filePath.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^home\//, ""));
  const title = path.posix.basename(relativePath) || "document";
  const fileType = path.posix.extname(title).replace(/^\./, "").toLowerCase();
  if (!fileType) {
    throw new HttpError(415, "unsupported_file_type", "File path does not contain a file extension.");
  }
  return {
    originalUrl: filePath,
    fileOrigin: "",
    relativePath,
    ownerUid: "",
    title,
    fileType
  };
}
function normalizeRelativePath(input) {
  const withoutNull = input.replace(/\0/g, "");
  const normalized = path.posix.normalize(`/${withoutNull}`).replace(/^\/+/, "");
  if (!normalized || normalized === ".") {
    throw new HttpError(400, "empty_relative_path", "File URL does not contain a file path.");
  }
  if (normalized.startsWith("../") || normalized.includes("/../")) {
    throw new HttpError(400, "unsafe_relative_path", "File path escapes allowed root.");
  }
  return normalized;
}

// server/services/document-type.ts
var WORD_EXTS = /* @__PURE__ */ new Set(["doc", "docm", "docx", "dot", "dotm", "dotx", "epub", "fb2", "fodt", "htm", "html", "mht", "odt", "ott", "rtf", "txt", "wps", "xml"]);
var CELL_EXTS = /* @__PURE__ */ new Set(["csv", "fods", "ods", "ots", "xls", "xlsm", "xlsx", "xlt", "xltm", "xltx"]);
var SLIDE_EXTS = /* @__PURE__ */ new Set(["fodp", "odp", "otp", "pot", "potm", "potx", "pps", "ppsm", "ppsx", "ppt", "pptm", "pptx"]);
function getDocumentType(fileType) {
  const ext = fileType.toLowerCase();
  if (WORD_EXTS.has(ext)) return "word";
  if (CELL_EXTS.has(ext)) return "cell";
  if (SLIDE_EXTS.has(ext)) return "slide";
  throw new HttpError(415, "unsupported_file_type", `Unsupported file type: ${fileType}`);
}

// server/services/token.ts
import crypto from "node:crypto";
function createSessionId() {
  return crypto.randomBytes(16).toString("hex");
}
function createDocumentKey(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}

// server/services/file-store.ts
import fs from "node:fs";
import path2 from "node:path";
import { pipeline } from "node:stream/promises";
function resolveHomeFilePath(relativePath, config2, ownerUid) {
  const root = path2.resolve(config2.homeRoot);
  const normalizedOwnerUid = normalizeOwnerUid(ownerUid);
  const target = normalizedOwnerUid ? path2.resolve(root, normalizedOwnerUid, relativePath) : path2.resolve(root, relativePath);
  if (target !== root && !target.startsWith(`${root}${path2.sep}`)) {
    throw new HttpError(400, "unsafe_file_path", "Resolved file path escapes home root.");
  }
  return target;
}
function createReadStreamForRelativePath(relativePath, config2, range, ownerUid) {
  const target = resolveHomeFilePath(relativePath, config2, ownerUid);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    throw new HttpError(404, "file_not_found", "File does not exist.");
  }
  return fs.createReadStream(target, range);
}
async function saveFromUrl(url, relativePath, config2, ownerUid) {
  const target = resolveHomeFilePath(relativePath, config2, ownerUid);
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new HttpError(502, "callback_download_failed", `Failed to download saved document: ${response.status}`);
  }
  await fs.promises.mkdir(path2.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await pipeline(response.body, fs.createWriteStream(tmp));
  await fs.promises.rename(tmp, target);
}
function normalizeOwnerUid(ownerUid) {
  if (!ownerUid) {
    return "";
  }
  const normalized = ownerUid.trim();
  if (!normalized) {
    return "";
  }
  if (normalized.includes("/") || normalized.includes("\\") || normalized === "." || normalized === "..") {
    throw new HttpError(400, "unsafe_owner_uid", "Owner UID is invalid.");
  }
  return normalized;
}

// server/db/minidb.ts
var import_minidb = __toESM(require_dist(), 1);
var db;
var fallbackWarningShown = false;
var stateDir = "/lzcapp/var/state";
function initMiniDB(config2) {
  db = new import_minidb.MiniDB({ origin: config2.appOrigin });
  stateDir = config2.stateDir;
}
function getStateDir() {
  return stateDir;
}
function getCollection(name) {
  if (!db) {
    throw new Error("MiniDB has not been initialized.");
  }
  return db.getCollection(name);
}
function canUseLocalMiniDBFallback(error) {
  if (!fallbackWarningShown) {
    fallbackWarningShown = true;
    console.warn(`MiniDB unavailable, using file fallback: ${getErrorMessage(error)}`);
  }
  return true;
}
function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

// server/db/file-store.ts
import fs2 from "node:fs/promises";
import path3 from "node:path";
async function readJsonArray(name) {
  try {
    const content = await fs2.readFile(resolveStateFile(name), "utf8");
    const value = JSON.parse(content);
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (isMissingFile(error)) {
      return [];
    }
    throw error;
  }
}
async function writeJsonArray(name, items) {
  const target = resolveStateFile(name);
  await fs2.mkdir(path3.dirname(target), { recursive: true });
  await fs2.writeFile(target, JSON.stringify(items, null, 2), "utf8");
}
function resolveStateFile(name) {
  return path3.join(getStateDir(), `${name}.json`);
}
function isMissingFile(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

// server/db/session-store.ts
var SESSIONS_STORE = "editor_sessions";
function collection() {
  return getCollection(SESSIONS_STORE);
}
async function saveSession(session) {
  try {
    await collection().upsert(session);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const sessions = await readJsonArray(SESSIONS_STORE);
    const index = sessions.findIndex((item) => item.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    await writeJsonArray(SESSIONS_STORE, sessions);
  }
}
async function getSession(id) {
  try {
    return await collection().findOne({ id });
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const sessions = await readJsonArray(SESSIONS_STORE);
    return sessions.find((session) => session.id === id);
  }
}

// server/db/recent-store.ts
var RECENT_STORE = "recent_files";
function collection2() {
  return getCollection(RECENT_STORE);
}
async function touchRecentFile(session) {
  try {
    const existing = await collection2().findOne({ id: session.id });
    await collection2().upsert(buildRecentFile(session, existing));
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(RECENT_STORE);
    const index = items.findIndex((item) => item.id === session.id);
    const next = buildRecentFile(session, index >= 0 ? items[index] : void 0);
    if (index >= 0) {
      items[index] = next;
    } else {
      items.push(next);
    }
    await writeJsonArray(RECENT_STORE, items);
  }
}
async function listRecentFiles(limit = 20) {
  try {
    const items = await collection2().find({}, { sort: ["-lastOpenedAt"] }).fetch();
    return items.slice(0, limit);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(RECENT_STORE);
    return items.sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt)).slice(0, limit);
  }
}
async function deleteRecentFile(id) {
  try {
    await collection2().remove(id);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(RECENT_STORE);
    await writeJsonArray(RECENT_STORE, items.filter((item) => item.id !== id));
  }
}
async function clearRecentFiles() {
  try {
    const items = await collection2().find({}).fetch();
    await collection2().remove(items.map((item) => item.id));
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
  }
  await writeJsonArray(RECENT_STORE, []);
}
function buildRecentFile(session, existing) {
  return {
    id: session.id,
    fileUrl: session.originalUrl,
    relativePath: session.relativePath,
    ownerUid: session.ownerUid,
    title: session.title,
    fileType: session.fileType,
    source: session.source,
    lastOpenedAt: (/* @__PURE__ */ new Date()).toISOString(),
    openCount: (existing?.openCount || 0) + 1
  };
}

// server/services/editor-session.ts
async function createEditorSessionWithCookie(request, config2, options) {
  const normalized = normalizeLazycatFileUrl(request.fileUrl);
  const documentType = getDocumentType(normalized.fileType);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = createSessionId();
  const ownerUid = options.user.id;
  const documentIdentity = await resolveDocumentIdentity(normalized.relativePath, ownerUid, config2);
  const documentKey = createDocumentKey(documentIdentity);
  const session = {
    ...normalized,
    ownerUid,
    id,
    documentType,
    createdAt: now,
    updatedAt: now,
    source: request.source || "manual",
    documentKey,
    requestCookie: options.requestCookie,
    user: options.user
  };
  await saveSession(session);
  await touchRecentFile(session);
  return {
    session,
    config: buildOnlyOfficeConfig(session, config2)
  };
}
async function resolveDocumentIdentity(relativePath, ownerUid, config2) {
  try {
    const target = resolveHomeFilePath(relativePath, config2, ownerUid);
    const [stats, realPath] = await Promise.all([
      fs3.stat(target),
      fs3.realpath(target).catch(() => target)
    ]);
    if (stats.isFile()) {
      const mountedIdentity = await resolveMountedDocumentIdentity(realPath, target);
      if (mountedIdentity) {
        return mountedIdentity;
      }
      const documentPathIdentity = resolveDocumentPathIdentity(realPath, target, config2);
      if (documentPathIdentity) {
        return documentPathIdentity;
      }
      return `local-file:${realPath}:${stats.dev}:${stats.ino}`;
    }
  } catch (error) {
    console.warn("[editor-session] fallback document identity", {
      ownerUid,
      relativePath,
      error: error instanceof Error ? error.message : String(error)
    });
  }
  return `path:${relativePath}`;
}
function resolveDocumentPathIdentity(realPath, targetPath, config2) {
  const root = path4.resolve(config2.homeRoot);
  const candidates = [path4.resolve(realPath), path4.resolve(targetPath)];
  for (const candidate of candidates) {
    const logicalDocumentPath = toLogicalDocumentPath(candidate);
    if (logicalDocumentPath && !logicalDocumentPath.includes("/.shared-center/")) {
      return `document-path:${logicalDocumentPath}`;
    }
    if (!isPathInside(candidate, root)) {
      continue;
    }
    const relative = path4.relative(root, candidate).replace(/\\/g, "/");
    if (relative && !relative.startsWith("..") && !relative.includes("/.shared-center/") && !relative.startsWith(".shared-center/")) {
      return `document-path:/document/${relative}`;
    }
  }
  return "";
}
async function resolveMountedDocumentIdentity(realPath, targetPath) {
  const entries = await readMountInfo();
  const candidates = [path4.resolve(realPath), path4.resolve(targetPath)];
  for (const candidate of candidates) {
    const entry = findBestMountInfoEntry(candidate, entries);
    if (!entry) {
      continue;
    }
    const suffix = path4.relative(entry.mountPoint, candidate);
    const sourcePath = normalizeMountSourcePath(entry.root, suffix);
    if (sourcePath) {
      const logicalDocumentPath = toLogicalDocumentPath(sourcePath);
      if (logicalDocumentPath) {
        return `document-path:${logicalDocumentPath}`;
      }
      return `mounted-file:${entry.source}:${sourcePath}`;
    }
  }
  return "";
}
async function readMountInfo() {
  const content = await fs3.readFile("/proc/self/mountinfo", "utf8");
  return content.split("\n").map(parseMountInfoLine).filter((entry) => Boolean(entry));
}
function parseMountInfoLine(line) {
  if (!line.trim()) {
    return null;
  }
  const separator = line.indexOf(" - ");
  if (separator < 0) {
    return null;
  }
  const left = line.slice(0, separator).split(" ");
  const right = line.slice(separator + 3).split(" ");
  const root = left[3];
  const mountPoint = left[4];
  const source = right[1];
  if (!root || !mountPoint || !source) {
    return null;
  }
  return {
    root: decodeMountInfoPath(root),
    mountPoint: decodeMountInfoPath(mountPoint),
    source: decodeMountInfoPath(source)
  };
}
function findBestMountInfoEntry(candidate, entries) {
  let best = null;
  for (const entry of entries) {
    if (!isPathInside(candidate, entry.mountPoint)) {
      continue;
    }
    if (!best || entry.mountPoint.length > best.mountPoint.length) {
      best = entry;
    }
  }
  return best;
}
function normalizeMountSourcePath(root, suffix) {
  const normalizedSuffix = suffix && suffix !== "." ? suffix : "";
  const sourcePath = path4.posix.normalize(`/${root}/${normalizedSuffix}`.replace(/\\/g, "/"));
  return sourcePath === "/" ? "" : sourcePath;
}
function toLogicalDocumentPath(input) {
  const normalized = path4.posix.normalize(input.replace(/\\/g, "/"));
  const marker = "/document/";
  const index = normalized.indexOf(marker);
  if (index < 0) {
    return "";
  }
  return normalized.slice(index);
}
function isPathInside(candidate, parent) {
  return candidate === parent || candidate.startsWith(`${parent}${path4.sep}`);
}
function decodeMountInfoPath(input) {
  return input.replace(/\\([0-7]{3})/g, (_match, value) => String.fromCharCode(parseInt(value, 8)));
}
function buildOnlyOfficeConfig(session, config2) {
  const documentServiceOrigin = config2.documentServerPublicOrigin || config2.appOrigin;
  const downloadUrl = `${documentServiceOrigin}/download/${encodeURIComponent(session.id)}`;
  const callbackUrl = `${documentServiceOrigin}/callback/${encodeURIComponent(session.id)}`;
  return {
    width: "100%",
    height: "100%",
    type: "desktop",
    documentType: session.documentType,
    document: {
      title: session.title,
      url: downloadUrl,
      fileType: session.fileType,
      key: session.documentKey,
      permissions: {
        edit: true,
        download: true,
        print: true,
        review: true,
        comment: true
      }
    },
    editorConfig: {
      mode: "edit",
      lang: "zh-CN",
      callbackUrl,
      user: session.user,
      customization: {
        autosave: true,
        forcesave: true,
        compactToolbar: false
      }
    }
  };
}

// server/routes/editor.ts
async function handleEditorSession(request, response, config2) {
  const body = await readJsonBody(request);
  const result = await createEditorSessionWithCookie(body, config2, {
    requestCookie: request.headers.cookie,
    user: resolveEditorUser(request, config2)
  });
  sendJson(response, 200, result);
}
function resolveEditorUser(request, config2) {
  const headerUserId = readHeader(request, "x-hc-user-id");
  const userId = headerUserId || config2.deployUid || "anonymous";
  const displayName = headerUserId || config2.deployUid || "anonymous";
  return {
    id: userId,
    name: displayName
  };
}
function readHeader(request, name) {
  const value = request.headers[name];
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }
  return value?.trim() || "";
}

// server/routes/recent.ts
async function handleRecentFiles(response) {
  const items = await listRecentFiles();
  sendJson(response, 200, { items });
}
async function handleClearRecentFiles(response) {
  await clearRecentFiles();
  sendJson(response, 200, { ok: true });
}
async function handleDeleteRecentFile(id, response) {
  if (!id) {
    throw new HttpError(400, "missing_recent_id", "Missing recent file id.");
  }
  await deleteRecentFile(id);
  sendJson(response, 200, { ok: true });
}

// server/routes/files.ts
import { pipeline as pipeline2 } from "node:stream/promises";
async function handleDownload(sessionId, request, response, config2, headOnly = false) {
  const session = await getRequiredSession(sessionId);
  if (session.fileOrigin) {
    return proxyOriginalFileDownload(session, request, response, headOnly);
  }
  const resolvedPath = resolveHomeFilePath(session.relativePath, config2, session.ownerUid);
  const stats = await import("node:fs").then((fs6) => fs6.promises.stat(resolvedPath));
  console.log("[download] local request", {
    sessionId,
    title: session.title,
    relativePath: session.relativePath,
    resolvedPath,
    headOnly
  });
  const filename = encodeURIComponent(session.title);
  const range = parseRangeHeader(request.headers.range, stats.size);
  const headers = {
    "content-type": contentTypeFor(session.fileType),
    "content-disposition": `attachment; filename*=UTF-8''${filename}`,
    "content-length": String(range ? range.end - range.start + 1 : stats.size),
    "accept-ranges": "bytes",
    "cache-control": "no-store"
  };
  if (range) {
    response.writeHead(206, {
      ...headers,
      "content-range": `bytes ${range.start}-${range.end}/${stats.size}`
    });
  } else {
    response.writeHead(200, headers);
  }
  if (headOnly) {
    response.end();
    return;
  }
  const stream = createReadStreamForRelativePath(session.relativePath, config2, range || void 0, session.ownerUid);
  stream.pipe(response);
}
async function proxyOriginalFileDownload(session, request, response, headOnly) {
  const upstream = await fetch(session.originalUrl, {
    method: headOnly ? "HEAD" : "GET",
    headers: {
      ...request.headers.range ? { range: request.headers.range } : {},
      ...session.requestCookie ? { cookie: session.requestCookie } : {}
    }
  });
  if (!upstream.ok && upstream.status !== 206) {
    throw new HttpError(upstream.status, "file_download_failed", `Failed to fetch original file: ${upstream.status}`);
  }
  console.log("[download] proxy request", {
    sessionId: session.id,
    title: session.title,
    relativePath: session.relativePath,
    source: session.originalUrl,
    status: upstream.status,
    headOnly
  });
  const filename = encodeURIComponent(session.title);
  const headers = {
    "content-type": upstream.headers.get("content-type") || contentTypeFor(session.fileType),
    "content-disposition": `attachment; filename*=UTF-8''${filename}`,
    "accept-ranges": upstream.headers.get("accept-ranges") || "bytes",
    "cache-control": "no-store"
  };
  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");
  if (contentLength) headers["content-length"] = contentLength;
  if (contentRange) headers["content-range"] = contentRange;
  response.writeHead(upstream.status, headers);
  if (headOnly) {
    response.end();
    return;
  }
  if (!upstream.body) {
    throw new HttpError(502, "empty_file_download", "Original file response body is empty.");
  }
  await pipeline2(upstream.body, response);
}
function parseRangeHeader(rangeHeader, size) {
  if (!rangeHeader) {
    return null;
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!match) {
    return null;
  }
  const [, rawStart, rawEnd] = match;
  let start = rawStart ? Number(rawStart) : 0;
  let end = rawEnd ? Number(rawEnd) : size - 1;
  if (!rawStart && rawEnd) {
    const suffixLength = Number(rawEnd);
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
    return null;
  }
  return { start, end: Math.min(end, size - 1) };
}
async function handleCallback(sessionId, request, response, config2) {
  const session = await getRequiredSession(sessionId);
  const payload = await readJsonBody(request);
  const status = Number(payload.status || 0);
  console.log("[callback] onlyoffice save event", {
    sessionId,
    status,
    forcesavetype: payload.forcesavetype,
    hasUrl: Boolean(payload.url),
    key: payload.key,
    users: payload.users,
    title: session.title,
    relativePath: session.relativePath,
    ownerUid: session.ownerUid
  });
  if ((status === 2 || status === 6) && payload.url) {
    await saveFromUrl(payload.url, session.relativePath, config2, session.ownerUid);
    console.log("[callback] saved document", {
      sessionId,
      status,
      title: session.title,
      relativePath: session.relativePath,
      ownerUid: session.ownerUid
    });
  }
  sendJson(response, 200, { error: 0 });
}
async function getRequiredSession(sessionId) {
  const session = await getSession(sessionId);
  if (!session) {
    throw new HttpError(404, "session_not_found", "Editor session does not exist.");
  }
  return session;
}
function contentTypeFor(fileType) {
  const ext = fileType.toLowerCase();
  const map = {
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odt: "application/vnd.oasis.opendocument.text",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odp: "application/vnd.oasis.opendocument.presentation",
    txt: "text/plain; charset=utf-8",
    csv: "text/csv; charset=utf-8"
  };
  return map[ext] || "application/octet-stream";
}

// server/routes/drive.ts
import fs4 from "node:fs/promises";
import path5 from "node:path";
var SUPPORTED_EXTENSIONS = /* @__PURE__ */ new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "odt", "ods", "odp"]);
var SHARED_CENTER_PATH = ".shared-center";
var FILE_SERVICE_ROOT_BY_SCOPE = {
  external: "/.media",
  mount: "/.remotefs"
};
async function handleDriveList(request, response, config2, requestedPath = "", rawScope = "all") {
  const scope = normalizeScope(rawScope);
  if (scope === "all" || scope === "shared") {
    return handleLocalDriveList(response, config2, requestedPath, scope, resolveDriveOwnerUid(request, config2));
  }
  return handleFileServiceDriveList(request, response, config2, requestedPath, scope);
}
async function handleLocalDriveList(response, config2, requestedPath, scope, ownerUid) {
  const relativePath = resolveLocalDrivePath(requestedPath, scope);
  const targetPath = resolveHomeFilePath(relativePath, config2, ownerUid);
  const dirents = await fs4.readdir(targetPath, { withFileTypes: true });
  const entries = await Promise.all(dirents.map((dirent) => toLocalDriveEntry(dirent, relativePath, targetPath, scope)));
  const visibleEntries = entries.filter((entry) => Boolean(entry)).filter((entry) => scope === "shared" || !entry.name.startsWith(".")).map((entry) => scope === "shared" ? { ...entry, path: toClientLocalDrivePath(entry.path, scope) } : entry).sort(compareEntries);
  sendJson(response, 200, {
    scope,
    path: toClientLocalDrivePath(relativePath, scope),
    parentPath: toClientLocalDrivePath(getLocalParentPath(relativePath), scope),
    entries: visibleEntries
  });
}
function resolveDriveOwnerUid(request, config2) {
  const headerUserId = firstHeader(request.headers["x-hc-user-id"])?.trim() || "";
  return headerUserId || config2.deployUid || "";
}
function resolveLocalDrivePath(requestedPath, scope) {
  const normalizedPath = requestedPath ? normalizeDrivePath(requestedPath) : "";
  if (scope !== "shared") {
    return normalizedPath;
  }
  if (!normalizedPath) {
    return SHARED_CENTER_PATH;
  }
  if (normalizedPath === SHARED_CENTER_PATH || normalizedPath.startsWith(`${SHARED_CENTER_PATH}/`)) {
    return normalizedPath;
  }
  return joinDrivePath(SHARED_CENTER_PATH, normalizedPath);
}
function toClientLocalDrivePath(relativePath, scope) {
  if (scope !== "shared") {
    return relativePath;
  }
  if (!relativePath || relativePath === SHARED_CENTER_PATH) {
    return "";
  }
  if (relativePath.startsWith(`${SHARED_CENTER_PATH}/`)) {
    return relativePath.slice(SHARED_CENTER_PATH.length + 1);
  }
  return relativePath;
}
async function handleFileServiceDriveList(request, response, config2, requestedPath, scope) {
  const rootPath = FILE_SERVICE_ROOT_BY_SCOPE[scope];
  const fileServicePath = requestedPath ? normalizeFileServicePath(requestedPath, rootPath) : rootPath;
  const fileServiceOrigin = getFileServiceOrigin(request, config2);
  const payload = await fetchFileServiceDirectory(fileServiceOrigin, fileServicePath, request.headers.cookie);
  const entries = (payload.data || []).map((entry) => toFileServiceDriveEntry(entry, scope)).filter((entry) => Boolean(entry)).sort(compareEntries);
  console.log("[drive] file service list", {
    scope,
    path: fileServicePath,
    origin: fileServiceOrigin,
    count: entries.length,
    total: payload.total ?? entries.length
  });
  sendJson(response, 200, {
    scope,
    path: fileServicePath,
    parentPath: getFileServiceParentPath(fileServicePath, rootPath),
    entries
  });
}
async function fetchFileServiceDirectory(origin, targetPath, cookie) {
  const apiUrl = `${origin}/api/webdav/getDirectoryContents`;
  const result = await fetch(apiUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...cookie ? { cookie } : {}
    },
    body: JSON.stringify({
      path: targetPath,
      page: 1,
      pageSize: 100,
      sort: [],
      type: "",
      mimeType: "",
      includeHidden: false,
      owner: "",
      extname: "",
      ignoreName: ""
    })
  });
  const raw = await result.text();
  if (!result.ok) {
    throw new HttpError(result.status, "drive_file_service_failed", `Lazycat file service returned ${result.status}: ${raw.slice(0, 200)}`);
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(502, "drive_file_service_invalid_json", "Lazycat file service did not return valid JSON.");
  }
}
function normalizeScope(input) {
  if (input === "shared" || input === "external" || input === "mount") {
    return input;
  }
  return "all";
}
async function toLocalDriveEntry(dirent, currentPath, targetPath, scope) {
  if (!dirent.isDirectory() && !dirent.isFile()) {
    return null;
  }
  const entryPath = joinDrivePath(currentPath, dirent.name);
  const stats = await fs4.stat(path5.join(targetPath, dirent.name));
  const fileType = dirent.isFile() ? path5.posix.extname(dirent.name).replace(/^\./, "").toLowerCase() : "";
  return {
    name: dirent.name,
    path: entryPath,
    type: dirent.isDirectory() ? "directory" : "file",
    size: dirent.isFile() ? stats.size : 0,
    modifiedAt: stats.mtime.toISOString(),
    fileType,
    supported: dirent.isFile() && SUPPORTED_EXTENSIONS.has(fileType),
    source: scope
  };
}
function toFileServiceDriveEntry(entry, scope) {
  const type = entry.type === "directory" ? "directory" : entry.type === "file" ? "file" : null;
  const entryPath = normalizeReturnedFileServicePath(entry.filename || "", FILE_SERVICE_ROOT_BY_SCOPE[scope]);
  const name = entry.basename || path5.posix.basename(entryPath);
  if (!type || !entryPath || !name) {
    return null;
  }
  const fileType = type === "file" ? path5.posix.extname(name).replace(/^\./, "").toLowerCase() : "";
  return {
    name,
    path: entryPath,
    type,
    size: type === "file" ? Number(entry.size || 0) : 0,
    modifiedAt: normalizeLastModified(entry.lastmod),
    fileType,
    supported: type === "file" && SUPPORTED_EXTENSIONS.has(fileType),
    source: scope,
    mime: entry.mime || void 0,
    owner: entry.owner || void 0,
    mountPointPath: entry.mountPointPath || void 0
  };
}
function normalizeDrivePath(input) {
  return path5.posix.normalize(`/${input.replace(/\\/g, "/")}`).replace(/^\/+/, "").replace(/^\.$/, "");
}
function normalizeFileServicePath(input, rootPath) {
  const raw = input.replace(/\0/g, "").replace(/\\/g, "/");
  const absolutePath = raw.startsWith("/") ? raw : joinDrivePath(rootPath, raw);
  const normalized = path5.posix.normalize(absolutePath);
  if (normalized !== rootPath && !normalized.startsWith(`${rootPath}/`)) {
    throw new HttpError(400, "unsafe_drive_path", "Drive path escapes the selected Lazycat drive scope.");
  }
  return normalized;
}
function normalizeReturnedFileServicePath(input, rootPath) {
  if (!input) {
    return "";
  }
  return normalizeFileServicePath(input, rootPath);
}
function joinDrivePath(parentPath, name) {
  return parentPath ? `${parentPath}/${name}` : name;
}
function getLocalParentPath(input) {
  if (!input) {
    return "";
  }
  const parent = path5.posix.dirname(input);
  return parent === "." ? "" : parent;
}
function getFileServiceParentPath(input, rootPath) {
  if (!input || input === rootPath) {
    return "";
  }
  const parent = path5.posix.dirname(input);
  return parent === rootPath ? "" : parent;
}
function normalizeLastModified(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return new Date(value).toISOString();
  }
  if (typeof value === "string" && value) {
    const numeric = Number(value);
    const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }
  return "";
}
function getFileServiceOrigin(request, config2) {
  const fallback = new URL(config2.appOrigin);
  const host = firstHeader(request.headers["x-forwarded-host"]) || request.headers.host || fallback.host;
  const protocol = firstHeader(request.headers["x-forwarded-proto"]) || fallback.protocol.replace(/:$/, "") || "https";
  const boxDomain = getBoxDomain(host);
  return `${protocol}://file.${boxDomain}`;
}
function firstHeader(value) {
  return Array.isArray(value) ? value[0] : value;
}
function getBoxDomain(host) {
  const hostname = host.split(":")[0] || host;
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length <= 2) {
    return hostname;
  }
  return parts.slice(1).join(".");
}
function compareEntries(a, b) {
  if (a.type !== b.type) {
    return a.type === "directory" ? -1 : 1;
  }
  return a.name.localeCompare(b.name, "zh-CN", { numeric: true, sensitivity: "base" });
}

// server/static.ts
import fs5 from "node:fs";
import path6 from "node:path";
var FRONTEND_DIST = path6.resolve(process.env.FRONTEND_DIST || "dist/frontend");
function serveStatic(urlPath, response) {
  const normalizedPath = urlPath === "/" ? "/index.html" : urlPath;
  const target = path6.resolve(FRONTEND_DIST, `.${normalizedPath}`);
  if (!target.startsWith(FRONTEND_DIST)) return false;
  if (!fs5.existsSync(target) || !fs5.statSync(target).isFile()) return false;
  response.writeHead(200, { "content-type": contentType(target) });
  fs5.createReadStream(target).pipe(response);
  return true;
}
function serveFrontendFallback(response) {
  if (!serveStatic("/index.html", response)) {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end('<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>');
  }
}
function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

// server/app.ts
function createServer(config2) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", config2.appOrigin);
      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, { ok: true });
      }
      if (request.method === "POST" && url.pathname === "/api/editor/session") {
        return await handleEditorSession(request, response, config2);
      }
      if (request.method === "GET" && url.pathname === "/api/recent") {
        return await handleRecentFiles(response);
      }
      if (request.method === "DELETE" && url.pathname === "/api/recent") {
        return await handleClearRecentFiles(response);
      }
      if (request.method === "DELETE" && url.pathname.startsWith("/api/recent/")) {
        return await handleDeleteRecentFile(decodeURIComponent(url.pathname.slice("/api/recent/".length)), response);
      }
      if (request.method === "GET" && url.pathname === "/api/drive/list") {
        return await handleDriveList(request, response, config2, url.searchParams.get("path") || "", url.searchParams.get("scope") || "all");
      }
      if ((request.method === "GET" || request.method === "HEAD") && url.pathname.startsWith("/download/")) {
        return await handleDownload(
          decodeURIComponent(url.pathname.slice("/download/".length)),
          request,
          response,
          config2,
          request.method === "HEAD"
        );
      }
      if (request.method === "POST" && url.pathname.startsWith("/callback/")) {
        return await handleCallback(decodeURIComponent(url.pathname.slice("/callback/".length)), request, response, config2);
      }
      if (request.method === "GET" && serveStatic(url.pathname, response)) {
        return;
      }
      if (request.method === "GET") {
        return serveFrontendFallback(response);
      }
      sendJson(response, 405, { error: { code: "method_not_allowed", message: "Method not allowed." } });
    } catch (error) {
      sendError(response, error);
    }
  });
}

// server/index.ts
var config = loadConfig();
initMiniDB(config);
var server = createServer(config);
server.listen(config.port, "0.0.0.0", () => {
  console.log(`ONLYOFFICE Lazycat app listening on :${config.port}`);
});
//# sourceMappingURL=index.js.map
