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
  const clientfsRoot = process.env.CLIENTFS_ROOT || "/lzcapp/clientfs";
  const stateDir2 = process.env.STATE_DIR || "/lzcapp/var/state";
  const fontsDir = process.env.FONTS_DIR || "/lzcapp/var/fonts";
  const fontRefreshDir = process.env.FONT_REFRESH_DIR || "/lzcapp/var/document-server/font-refresh";
  const documentServerPublicOrigin = (process.env.DOCUMENT_SERVER_PUBLIC_ORIGIN || "").replace(/\/+$/, "");
  const deployUid = (process.env.DEPLOY_UID || process.env.LAZYCAT_APP_DEPLOY_UID || "").trim();
  return {
    port,
    appOrigin,
    homeRoot,
    clientfsRoot,
    stateDir: stateDir2,
    fontsDir,
    fontRefreshDir,
    documentServerPublicOrigin,
    deployUid
  };
}

// server/app.ts
import http from "node:http";

// server/errors.ts
var HttpError = class extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
  status;
  code;
  details;
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
    sendJson(response, error.status, {
      error: { code: error.code, message: error.message },
      ...error.details || {}
    });
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
import fs from "node:fs/promises";
import path from "node:path";
async function readJsonArray(name) {
  try {
    const content = await fs.readFile(resolveStateFile(name), "utf8");
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
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(items, null, 2), "utf8");
}
function resolveStateFile(name) {
  return path.join(getStateDir(), `${name}.json`);
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
async function findActiveEditSession(documentIdentity, userId) {
  try {
    const sessions = await collection().find({
      documentIdentity,
      mode: "edit",
      state: "active"
    }).fetch();
    return sessions.find((session) => session.user.id === userId);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const sessions = await readJsonArray(SESSIONS_STORE);
    return sessions.find((session) => session.documentIdentity === documentIdentity && session.user.id === userId && session.mode === "edit" && session.state === "active");
  }
}
async function updateSession(session) {
  await saveSession(session);
}
async function releaseActiveSession(id) {
  const session = await getSession(id);
  if (!session || session.state !== "active") {
    return;
  }
  const releasedAt = (/* @__PURE__ */ new Date()).toISOString();
  await updateSession({
    ...session,
    state: "released",
    updatedAt: releasedAt,
    releasedAt
  });
}

// server/services/editor-session.ts
import fs3 from "node:fs/promises";
import path5 from "node:path";

// server/services/file-url.ts
import path3 from "node:path";

// server/services/drive-file-service.ts
import path2 from "node:path";
var FILE_SERVICE_ROOT_BY_SCOPE = {
  external: "/.media",
  mount: "/.remotefs"
};
var EXTERNAL_REMOTE_FS_ALIAS = "RemoteFS";
function normalizeFileServiceRelativePath(input, rootPath) {
  const raw = input.replace(/\0/g, "").replace(/\\/g, "/");
  const withoutRoot = raw === rootPath ? "" : raw.startsWith(`${rootPath}/`) ? raw.slice(rootPath.length + 1) : raw;
  const normalized = normalizeDrivePath(withoutRoot);
  if (normalized === ".." || normalized.startsWith("../")) {
    throw new HttpError(400, "unsafe_drive_path", "Drive path escapes the selected Lazycat drive scope.");
  }
  return normalized;
}
function toFileServiceAbsolutePath(relativePath, rootPath) {
  const absolutePath = relativePath ? joinDrivePath(rootPath, relativePath) : rootPath;
  const normalized = path2.posix.normalize(absolutePath);
  if (normalized !== rootPath && !normalized.startsWith(`${rootPath}/`)) {
    throw new HttpError(400, "unsafe_drive_path", "Drive path escapes the selected Lazycat drive scope.");
  }
  return normalized;
}
function resolveFileServiceTargetPath(scope, requestedPath) {
  const rootPath = FILE_SERVICE_ROOT_BY_SCOPE[scope];
  const relativePath = requestedPath ? normalizeFileServiceRelativePath(requestedPath, rootPath) : "";
  if (scope === "external" && isExternalRemoteFsPath(relativePath)) {
    const serviceRelativePath = stripExternalRemoteFsAlias(relativePath);
    const remoteFsRootPath = FILE_SERVICE_ROOT_BY_SCOPE.mount;
    return {
      rootPath: remoteFsRootPath,
      relativePath,
      serviceRelativePath,
      absolutePath: toFileServiceAbsolutePath(serviceRelativePath, remoteFsRootPath)
    };
  }
  return {
    rootPath,
    relativePath,
    serviceRelativePath: relativePath,
    absolutePath: toFileServiceAbsolutePath(relativePath, rootPath)
  };
}
function toExternalRemoteFsClientPath(serviceRelativePath) {
  return serviceRelativePath ? `${EXTERNAL_REMOTE_FS_ALIAS}/${serviceRelativePath}` : EXTERNAL_REMOTE_FS_ALIAS;
}
function getFileServiceParentPath(input) {
  if (!input) {
    return "";
  }
  const parent = path2.posix.dirname(input);
  return parent === "." ? "" : parent;
}
function getFileServiceOrigin(request, config2) {
  const fallback = new URL(config2.appOrigin);
  const host = firstHeader(request.headers["x-forwarded-host"]) || request.headers.host || fallback.host;
  const protocol = firstHeader(request.headers["x-forwarded-proto"]) || fallback.protocol.replace(/:$/, "") || "https";
  const boxDomain = getBoxDomain(host);
  return `${protocol}://file.${boxDomain}`;
}
async function fetchFileServicePath(origin, targetPath, ownerUid, options = {}) {
  const apiUrl = `${origin}/api/webdav/file?path=${encodeURIComponent(targetPath)}${ownerUid ? `&owner=${encodeURIComponent(ownerUid)}` : ""}`;
  return fetch(apiUrl, {
    method: options.method || "GET",
    headers: options.headers,
    body: options.body
  });
}
function parseDriveFileUrl(fileUrl) {
  const match = /^drive:(external|mount):(.*)$/.exec(fileUrl);
  if (!match) {
    return null;
  }
  const scope = match[1];
  const rootPath = FILE_SERVICE_ROOT_BY_SCOPE[scope];
  const decodedPath = decodeURIComponent(match[2] || "");
  return {
    scope,
    relativePath: normalizeFileServiceRelativePath(decodedPath, rootPath)
  };
}
function normalizeDrivePath(input) {
  return path2.posix.normalize(`/${input.replace(/\\/g, "/")}`).replace(/^\/+/, "").replace(/^\.$/, "");
}
function joinDrivePath(parentPath, name) {
  return parentPath ? `${parentPath}/${name}` : name;
}
function isExternalRemoteFsPath(relativePath) {
  return relativePath === EXTERNAL_REMOTE_FS_ALIAS || relativePath.startsWith(`${EXTERNAL_REMOTE_FS_ALIAS}/`);
}
function stripExternalRemoteFsAlias(relativePath) {
  if (relativePath === EXTERNAL_REMOTE_FS_ALIAS) {
    return "";
  }
  return relativePath.slice(EXTERNAL_REMOTE_FS_ALIAS.length + 1);
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

// server/services/file-url.ts
var FILE_PREFIX = "/_lzc/files/home/";
function normalizeLazycatFileUrl(fileUrl) {
  const driveFile = parseDriveFileUrl(fileUrl);
  if (driveFile) {
    return normalizeDriveFileServicePath(fileUrl, driveFile.scope, driveFile.relativePath);
  }
  if (fileUrl.startsWith("clientfs:")) {
    return normalizeClientfsRelativePath(fileUrl.slice("clientfs:".length));
  }
  if (!fileUrl || typeof fileUrl !== "string") {
    throw new HttpError(400, "missing_file_url", "Missing Lazycat file URL.");
  }
  let parsed;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return normalizeLazycatRelativePath(fileUrl);
  }
  if (isRemoteDocumentUrl(parsed)) {
    return normalizeRemoteDocumentUrl(parsed, fileUrl);
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
  const title = path3.posix.basename(relativePath) || "document";
  const fileType = path3.posix.extname(title).replace(/^\./, "").toLowerCase();
  if (!fileType) {
    throw new HttpError(415, "unsupported_file_type", "File URL does not contain a file extension.");
  }
  return {
    originalUrl: fileUrl,
    fileOrigin: parsed.origin,
    relativePath,
    ownerUid: "",
    title,
    fileType,
    storageType: "lazycat-file"
  };
}
function normalizeDriveFileServicePath(originalUrl, driveScope, relativePath) {
  const title = path3.posix.basename(relativePath) || "document";
  const fileType = path3.posix.extname(title).replace(/^\./, "").toLowerCase();
  if (!fileType) {
    throw new HttpError(415, "unsupported_file_type", "Drive file path does not contain a file extension.");
  }
  return {
    originalUrl,
    fileOrigin: "",
    relativePath,
    ownerUid: "",
    title,
    fileType,
    storageType: "drive-file-service",
    driveScope
  };
}
function normalizeRemoteDocumentUrl(parsed, originalUrl) {
  const title = resolveRemoteDocumentTitle(parsed);
  const fileType = path3.posix.extname(title).replace(/^\./, "").toLowerCase();
  if (!fileType) {
    throw new HttpError(415, "unsupported_file_type", "Remote URL does not contain a file extension.");
  }
  return {
    originalUrl,
    fileOrigin: parsed.origin,
    relativePath: title,
    ownerUid: "",
    title,
    fileType,
    storageType: "remote-url"
  };
}
function normalizeClientfsRelativePath(filePath) {
  const relativePath = normalizeRelativePath(filePath.replace(/\\/g, "/").replace(/^\/+/, ""));
  const title = path3.posix.basename(relativePath) || "document";
  const fileType = path3.posix.extname(title).replace(/^\./, "").toLowerCase();
  if (!fileType) {
    throw new HttpError(415, "unsupported_file_type", "Client file path does not contain a file extension.");
  }
  return {
    originalUrl: `clientfs:${relativePath}`,
    fileOrigin: "",
    relativePath,
    ownerUid: "",
    title,
    fileType,
    storageType: "clientfs"
  };
}
function normalizeLazycatRelativePath(filePath) {
  const relativePath = normalizeRelativePath(filePath.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^home\//, ""));
  const title = path3.posix.basename(relativePath) || "document";
  const fileType = path3.posix.extname(title).replace(/^\./, "").toLowerCase();
  if (!fileType) {
    throw new HttpError(415, "unsupported_file_type", "File path does not contain a file extension.");
  }
  return {
    originalUrl: filePath,
    fileOrigin: "",
    relativePath,
    ownerUid: "",
    title,
    fileType,
    storageType: "local-path"
  };
}
function isRemoteDocumentUrl(parsed) {
  return (parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.hostname.startsWith("file.");
}
function resolveRemoteDocumentTitle(parsed) {
  const rawName = decodeURIComponent(path3.posix.basename(parsed.pathname));
  const nameFromPath = sanitizeTitle(rawName);
  if (path3.posix.extname(nameFromPath)) {
    return nameFromPath;
  }
  const nameFromQuery = sanitizeTitle(parsed.searchParams.get("filename") || parsed.searchParams.get("name") || "");
  if (path3.posix.extname(nameFromQuery)) {
    return nameFromQuery;
  }
  return nameFromPath || nameFromQuery || "document";
}
function sanitizeTitle(input) {
  const sanitized = input.replace(/[\\/:*?"<>|\0]/g, "_").trim();
  return sanitized || "document";
}
function normalizeRelativePath(input) {
  const withoutNull = input.replace(/\0/g, "");
  const normalized = path3.posix.normalize(`/${withoutNull}`).replace(/^\/+/, "");
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
import fs2 from "node:fs";
import path4 from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
function resolveClientfsFilePath(relativePath, config2, ownerUid) {
  const normalizedOwnerUid = normalizeOwnerUid(ownerUid);
  const scopedPath = normalizedOwnerUid ? path4.join(normalizedOwnerUid, relativePath) : relativePath;
  return resolvePathInRoot(config2.clientfsRoot, scopedPath, "Resolved clientfs path escapes clientfs root.");
}
function resolveHomeFilePath(relativePath, config2, ownerUid) {
  const root = path4.resolve(config2.homeRoot);
  const normalizedOwnerUid = normalizeOwnerUid(ownerUid);
  const scopedPath = normalizedOwnerUid ? path4.join(normalizedOwnerUid, relativePath) : relativePath;
  return resolvePathInRoot(root, scopedPath, "Resolved file path escapes home root.");
}
function createReadStreamForRelativePath(relativePath, config2, range, ownerUid, root = "home") {
  const target = root === "clientfs" ? resolveClientfsFilePath(relativePath, config2, ownerUid) : resolveHomeFilePath(relativePath, config2, ownerUid);
  if (!fs2.existsSync(target) || !fs2.statSync(target).isFile()) {
    throw new HttpError(404, "file_not_found", "File does not exist.");
  }
  return fs2.createReadStream(target, range);
}
async function saveFromUrl(url, relativePath, config2, ownerUid, root = "home") {
  const target = root === "clientfs" ? resolveClientfsFilePath(relativePath, config2, ownerUid) : resolveHomeFilePath(relativePath, config2, ownerUid);
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new HttpError(502, "callback_download_failed", `Failed to download saved document: ${response.status}`);
  }
  await fs2.promises.mkdir(path4.dirname(target), { recursive: true });
  if (root === "clientfs") {
    const body = Buffer.from(await response.arrayBuffer());
    await writeClientfsFile(target, body);
    return;
  }
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await pipeline(response.body, fs2.createWriteStream(tmp));
  await fs2.promises.rename(tmp, target);
}
async function writeClientfsFile(target, body) {
  try {
    await fs2.promises.writeFile(target, body);
    return;
  } catch (writeError) {
    try {
      await fs2.promises.truncate(target, 0);
      await pipeline(Readable.from(body), fs2.createWriteStream(target, { flags: "r+" }));
      return;
    } catch (streamError) {
      const writeMessage = writeError instanceof Error ? writeError.message : String(writeError);
      const streamMessage = streamError instanceof Error ? streamError.message : String(streamError);
      throw new HttpError(500, "clientfs_write_failed", `Clientfs write failed: ${writeMessage}; fallback failed: ${streamMessage}`);
    }
  }
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
function resolvePathInRoot(rootPath, relativePath, errorMessage) {
  const root = path4.resolve(rootPath);
  const target = path4.resolve(root, relativePath);
  if (target !== root && !target.startsWith(`${root}${path4.sep}`)) {
    throw new HttpError(400, "unsafe_file_path", errorMessage);
  }
  return target;
}

// server/db/recent-store.ts
import crypto2 from "node:crypto";
var RECENT_STORE = "recent_files";
function collection2() {
  return getCollection(RECENT_STORE);
}
async function touchRecentFile(session) {
  try {
    const existing = await findExistingRecentFile(session.ownerUid, session.originalUrl);
    await collection2().upsert(buildRecentFile(session, existing));
    if (existing && existing.id !== buildRecentFileId(session.ownerUid, session.originalUrl)) {
      await collection2().remove(existing.id);
    }
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(RECENT_STORE);
    const existing = items.find((item) => item.ownerUid === session.ownerUid && item.fileUrl === session.originalUrl);
    const next = buildRecentFile(session, existing);
    const nextItems = [next, ...items.filter((item) => item.id !== next.id && !(item.ownerUid === session.ownerUid && item.fileUrl === session.originalUrl))];
    await writeJsonArray(RECENT_STORE, nextItems);
  }
}
async function listRecentFiles(ownerUid, limit = 20) {
  try {
    const items = await collection2().find({ ownerUid }, { sort: ["-lastOpenedAt"] }).fetch();
    return items.slice(0, limit);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(RECENT_STORE);
    return items.filter((item) => item.ownerUid === ownerUid).sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt)).slice(0, limit);
  }
}
async function deleteRecentFile(id, ownerUid) {
  try {
    const existing = await collection2().findOne({ id });
    if (existing?.ownerUid === ownerUid) {
      await collection2().remove(id);
    }
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(RECENT_STORE);
    await writeJsonArray(RECENT_STORE, items.filter((item) => item.id !== id || item.ownerUid !== ownerUid));
  }
}
async function clearRecentFiles(ownerUid) {
  try {
    const items2 = await collection2().find({ ownerUid }).fetch();
    await collection2().remove(items2.map((item) => item.id));
    return;
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
  }
  const items = await readJsonArray(RECENT_STORE);
  await writeJsonArray(RECENT_STORE, items.filter((item) => item.ownerUid !== ownerUid));
}
function buildRecentFile(session, existing) {
  return {
    id: buildRecentFileId(session.ownerUid, session.originalUrl),
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
async function findExistingRecentFile(ownerUid, fileUrl) {
  const id = buildRecentFileId(ownerUid, fileUrl);
  const byId = await collection2().findOne({ id });
  if (byId) {
    return byId;
  }
  return collection2().findOne({ ownerUid, fileUrl });
}
function buildRecentFileId(ownerUid, fileUrl) {
  return crypto2.createHash("sha256").update(`${ownerUid}
${fileUrl}`).digest("hex").slice(0, 32);
}

// server/services/editor-session.ts
async function createEditorSessionWithCookie(request, config2, options) {
  const normalized = normalizeLazycatFileUrl(request.fileUrl);
  const documentType = getDocumentType(normalized.fileType);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = createSessionId();
  const ownerUid = options.user.id;
  const normalizedSession = normalized.storageType === "clientfs" ? { ...normalized, relativePath: stripClientfsOwnerPrefix(normalized.relativePath, ownerUid), originalUrl: `clientfs:${stripClientfsOwnerPrefix(normalized.relativePath, ownerUid)}` } : normalized;
  const documentIdentity = normalizedSession.storageType === "remote-url" ? `remote-url:${normalizedSession.originalUrl}` : normalizedSession.storageType === "drive-file-service" ? `drive-file-service:${normalizedSession.driveScope || "unknown"}:${ownerUid}:${normalizedSession.relativePath}` : await resolveDocumentIdentity(normalizedSession.relativePath, ownerUid, config2, normalizedSession.storageType === "clientfs" ? "clientfs" : "home");
  const requestedMode = request.mode === "view" ? "view" : "edit";
  const activeSession = requestedMode === "edit" ? await findActiveEditSession(documentIdentity, options.user.id) : void 0;
  if (activeSession && !request.takeover) {
    throw new HttpError(409, "editor_session_conflict", "\u6B64\u6587\u4EF6\u5DF2\u88AB\u5360\u7528", {
      conflict: {
        sessionId: activeSession.id,
        title: activeSession.title,
        updatedAt: activeSession.updatedAt
      }
    });
  }
  if (activeSession && request.takeover) {
    const supersededAt = now;
    await updateSession({
      ...activeSession,
      state: "superseded",
      updatedAt: supersededAt,
      supersededAt,
      supersededBy: id
    });
  }
  const documentKey = createDocumentKey(`${documentIdentity}:${id}`);
  const session = {
    ...normalizedSession,
    ownerUid,
    id,
    documentType,
    createdAt: now,
    updatedAt: now,
    source: request.source || "manual",
    mode: requestedMode,
    state: "active",
    documentIdentity,
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
function stripClientfsOwnerPrefix(relativePath, ownerUid) {
  if (!relativePath || !ownerUid) {
    return relativePath;
  }
  return relativePath === ownerUid ? "" : relativePath.startsWith(`${ownerUid}/`) ? relativePath.slice(ownerUid.length + 1) : relativePath;
}
async function resolveDocumentIdentity(relativePath, ownerUid, config2, root) {
  try {
    const target = root === "clientfs" ? resolveClientfsFilePath(relativePath, config2, ownerUid) : resolveHomeFilePath(relativePath, config2, ownerUid);
    const [stats, realPath] = await Promise.all([
      fs3.stat(target),
      fs3.realpath(target).catch(() => target)
    ]);
    if (stats.isFile()) {
      const mountedIdentity = await resolveMountedDocumentIdentity(realPath, target);
      if (mountedIdentity) {
        return mountedIdentity;
      }
      const documentPathIdentity = root === "clientfs" ? `clientfs-path:/${relativePath}` : resolveDocumentPathIdentity(realPath, target, config2);
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
  return `${root}:path:${relativePath}`;
}
function resolveDocumentPathIdentity(realPath, targetPath, config2) {
  const root = path5.resolve(config2.homeRoot);
  const candidates = [path5.resolve(realPath), path5.resolve(targetPath)];
  for (const candidate of candidates) {
    const logicalDocumentPath = toLogicalDocumentPath(candidate);
    if (logicalDocumentPath && !logicalDocumentPath.includes("/.shared-center/")) {
      return `document-path:${logicalDocumentPath}`;
    }
    if (!isPathInside(candidate, root)) {
      continue;
    }
    const relative = path5.relative(root, candidate).replace(/\\/g, "/");
    if (relative && !relative.startsWith("..") && !relative.includes("/.shared-center/") && !relative.startsWith(".shared-center/")) {
      return `document-path:/document/${relative}`;
    }
  }
  return "";
}
async function resolveMountedDocumentIdentity(realPath, targetPath) {
  const entries = await readMountInfo();
  const candidates = [path5.resolve(realPath), path5.resolve(targetPath)];
  for (const candidate of candidates) {
    const entry = findBestMountInfoEntry(candidate, entries);
    if (!entry) {
      continue;
    }
    const suffix = path5.relative(entry.mountPoint, candidate);
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
  const sourcePath = path5.posix.normalize(`/${root}/${normalizedSuffix}`.replace(/\\/g, "/"));
  return sourcePath === "/" ? "" : sourcePath;
}
function toLogicalDocumentPath(input) {
  const normalized = path5.posix.normalize(input.replace(/\\/g, "/"));
  const marker = "/document/";
  const index = normalized.indexOf(marker);
  if (index < 0) {
    return "";
  }
  return normalized.slice(index);
}
function isPathInside(candidate, parent) {
  return candidate === parent || candidate.startsWith(`${parent}${path5.sep}`);
}
function decodeMountInfoPath(input) {
  return input.replace(/\\([0-7]{3})/g, (_match, value) => String.fromCharCode(parseInt(value, 8)));
}
function buildOnlyOfficeConfig(session, config2) {
  const documentServiceOrigin = config2.documentServerPublicOrigin || config2.appOrigin;
  const downloadUrl = `${documentServiceOrigin}/download/${encodeURIComponent(session.id)}`;
  const callbackUrl = `${documentServiceOrigin}/callback/${encodeURIComponent(session.id)}`;
  const canEdit = session.mode === "edit" && session.state === "active";
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
        edit: canEdit,
        download: true,
        print: true,
        review: canEdit,
        comment: canEdit
      }
    },
    editorConfig: {
      mode: canEdit ? "edit" : "view",
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

// server/user.ts
function resolveRequestUser(request, config2) {
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

// server/routes/editor.ts
async function handleEditorSession(request, response, config2) {
  const body = await readJsonBody(request);
  const result = await createEditorSessionWithCookie(body, config2, {
    requestCookie: request.headers.cookie,
    user: resolveRequestUser(request, config2)
  });
  sendJson(response, 200, result);
}
async function handleReleaseEditorSession(sessionId, _request, response) {
  await releaseActiveSession(sessionId);
  sendJson(response, 200, { ok: true });
}

// server/routes/recent.ts
async function handleRecentFiles(request, response, config2) {
  const user = resolveRequestUser(request, config2);
  const items = await listRecentFiles(user.id);
  sendJson(response, 200, { items });
}
async function handleClearRecentFiles(request, response, config2) {
  const user = resolveRequestUser(request, config2);
  await clearRecentFiles(user.id);
  sendJson(response, 200, { ok: true });
}
async function handleDeleteRecentFile(id, request, response, config2) {
  if (!id) {
    throw new HttpError(400, "missing_recent_id", "Missing recent file id.");
  }
  const user = resolveRequestUser(request, config2);
  await deleteRecentFile(id, user.id);
  sendJson(response, 200, { ok: true });
}

// server/db/favorite-store.ts
import crypto3 from "node:crypto";
var FAVORITE_STORE = "favorite_items";
function collection3() {
  return getCollection(FAVORITE_STORE);
}
async function listFavoriteItems(ownerUid) {
  try {
    const items = await collection3().find({ ownerUid }, { sort: ["-createdAt"] }).fetch();
    return items;
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(FAVORITE_STORE);
    return items.filter((item) => item.ownerUid === ownerUid).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
}
async function upsertFavoriteItem(ownerUid, entry, fileUrl) {
  const item = buildFavoriteItem(ownerUid, entry, fileUrl);
  try {
    await collection3().upsert(item);
    return item;
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(FAVORITE_STORE);
    await writeJsonArray(FAVORITE_STORE, [item, ...items.filter((current) => current.id !== item.id)]);
    return item;
  }
}
async function deleteFavoriteItem(id, ownerUid) {
  try {
    const existing = await collection3().findOne({ id });
    if (existing?.ownerUid === ownerUid) {
      await collection3().remove(id);
    }
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(FAVORITE_STORE);
    await writeJsonArray(FAVORITE_STORE, items.filter((item) => item.id !== id || item.ownerUid !== ownerUid));
  }
}
function buildFavoriteItem(ownerUid, entry, fileUrl) {
  const source = entry.source || "all";
  return {
    id: buildFavoriteItemId(ownerUid, source, entry.path, entry.type),
    ownerUid,
    name: entry.name,
    path: entry.path,
    type: entry.type,
    size: entry.size,
    modifiedAt: entry.modifiedAt,
    fileType: entry.fileType,
    supported: entry.supported,
    source,
    fileUrl,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function buildFavoriteItemId(ownerUid, source, itemPath, type) {
  return crypto3.createHash("sha256").update(`${ownerUid}
${source}
${type}
${itemPath}`).digest("hex").slice(0, 32);
}

// server/routes/favorites.ts
async function handleFavoriteItems(request, response, config2) {
  const user = resolveRequestUser(request, config2);
  const items = await listFavoriteItems(user.id);
  sendJson(response, 200, { items });
}
async function handleUpsertFavoriteItem(request, response, config2) {
  const user = resolveRequestUser(request, config2);
  const body = await readJsonBody(request);
  if (!body.item?.path || !body.item?.name || !body.item?.type) {
    throw new HttpError(400, "missing_favorite_item", "Missing favorite item.");
  }
  const item = await upsertFavoriteItem(user.id, body.item, body.fileUrl || body.item.path);
  sendJson(response, 200, { item });
}
async function handleDeleteFavoriteItem(id, request, response, config2) {
  if (!id) {
    throw new HttpError(400, "missing_favorite_id", "Missing favorite id.");
  }
  const user = resolveRequestUser(request, config2);
  await deleteFavoriteItem(id, user.id);
  sendJson(response, 200, { ok: true });
}

// server/routes/files.ts
import { pipeline as pipeline2 } from "node:stream/promises";
async function handleDownload(sessionId, request, response, config2, headOnly = false) {
  const session = await getRequiredSession(sessionId);
  if (session.storageType === "remote-url") {
    return proxyOriginalFileDownload(session, request, response, headOnly);
  }
  if (session.storageType === "drive-file-service") {
    return proxyDriveFileServiceDownload(session, request, response, config2, headOnly);
  }
  if (session.storageType === "lazycat-file" || session.fileOrigin) {
    return proxyOriginalFileDownload(session, request, response, headOnly);
  }
  const resolvedPath = session.storageType === "clientfs" ? resolveClientfsFilePath(session.relativePath, config2, session.ownerUid) : resolveHomeFilePath(session.relativePath, config2, session.ownerUid);
  const stats = await import("node:fs").then((fs7) => fs7.promises.stat(resolvedPath));
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
  const stream = createReadStreamForRelativePath(
    session.relativePath,
    config2,
    range || void 0,
    session.ownerUid,
    session.storageType === "clientfs" ? "clientfs" : "home"
  );
  stream.pipe(response);
}
async function proxyOriginalFileDownload(session, request, response, headOnly) {
  const upstream = await fetch(session.originalUrl, {
    method: headOnly ? "HEAD" : "GET",
    headers: {
      ...request.headers.range ? { range: request.headers.range } : {},
      ...session.storageType === "lazycat-file" && session.requestCookie ? { cookie: session.requestCookie } : {}
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
    if (session.mode !== "edit" || session.state !== "active") {
      console.warn("[callback] ignored inactive editor session save", {
        sessionId,
        status,
        mode: session.mode,
        state: session.state,
        supersededBy: session.supersededBy
      });
      return sendJson(response, 200, { error: 0 });
    }
    if (session.storageType === "remote-url") {
      await saveRemoteDocumentFromUrl(payload.url, session.originalUrl, session.fileType);
      console.log("[callback] saved remote document", {
        sessionId,
        status,
        title: session.title,
        source: session.originalUrl
      });
      return sendJson(response, 200, { error: 0 });
    }
    if (session.storageType === "drive-file-service") {
      await saveDriveFileServiceDocumentFromUrl(payload.url, session, request, config2);
      console.log("[callback] saved drive file service document", {
        sessionId,
        status,
        title: session.title,
        relativePath: session.relativePath,
        ownerUid: session.ownerUid,
        driveScope: session.driveScope
      });
      return sendJson(response, 200, { error: 0 });
    }
    try {
      await saveFromUrl(
        payload.url,
        session.relativePath,
        config2,
        session.ownerUid,
        session.storageType === "clientfs" ? "clientfs" : "home"
      );
    } catch (error) {
      console.error("[callback] failed to save document", {
        sessionId,
        storageType: session.storageType,
        relativePath: session.relativePath,
        ownerUid: session.ownerUid,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
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
async function proxyDriveFileServiceDownload(session, request, response, config2, headOnly) {
  if (!session.driveScope) {
    throw new HttpError(400, "missing_drive_scope", "Drive file session is missing scope.");
  }
  const target = resolveFileServiceTargetPath(session.driveScope, session.relativePath);
  const origin = getFileServiceOrigin(request, config2);
  const upstream = await fetchFileServicePath(origin, target.absolutePath, session.ownerUid, {
    method: headOnly ? "HEAD" : "GET",
    headers: {
      ...request.headers.range ? { range: request.headers.range } : {}
    }
  });
  if (!upstream.ok && upstream.status !== 206) {
    throw new HttpError(upstream.status, "drive_file_download_failed", `Failed to fetch drive file: ${upstream.status}`);
  }
  assertDriveFileResponseIsDocument(upstream, session.fileType);
  console.log("[download] drive file service proxy request", {
    sessionId: session.id,
    title: session.title,
    relativePath: session.relativePath,
    targetPath: target.absolutePath,
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
    throw new HttpError(502, "empty_drive_file_download", "Drive file response body is empty.");
  }
  await pipeline2(upstream.body, response);
}
async function saveDriveFileServiceDocumentFromUrl(sourceUrl, session, request, config2) {
  if (!session.driveScope) {
    throw new HttpError(400, "missing_drive_scope", "Drive file session is missing scope.");
  }
  const download = await fetch(sourceUrl);
  if (!download.ok) {
    throw new HttpError(502, "callback_download_failed", `Failed to download saved document: ${download.status}`);
  }
  const target = resolveFileServiceTargetPath(session.driveScope, session.relativePath);
  const body = Buffer.from(await download.arrayBuffer());
  const upload = await fetchFileServicePath(getFileServiceOrigin(request, config2), target.absolutePath, session.ownerUid, {
    method: "PUT",
    headers: {
      "content-type": download.headers.get("content-type") || contentTypeFor(session.fileType),
      "content-length": String(body.byteLength)
    },
    body
  });
  if (!upload.ok) {
    throw new HttpError(upload.status, "drive_file_writeback_failed", `Drive file writeback failed: ${upload.status}`);
  }
}
function assertDriveFileResponseIsDocument(response, fileType) {
  const contentType2 = response.headers.get("content-type") || "";
  if (!/text\/html/i.test(contentType2)) {
    return;
  }
  throw new HttpError(
    502,
    "drive_file_auth_required",
    `Drive file service returned HTML while downloading .${fileType}; authentication may be required.`
  );
}
async function saveRemoteDocumentFromUrl(sourceUrl, targetUrl, fileType) {
  const download = await fetch(sourceUrl);
  if (!download.ok) {
    throw new HttpError(502, "callback_download_failed", `Failed to download saved document: ${download.status}`);
  }
  const body = Buffer.from(await download.arrayBuffer());
  const upload = await fetch(targetUrl, {
    method: "PUT",
    headers: {
      "content-type": download.headers.get("content-type") || contentTypeFor(fileType),
      "content-length": String(body.byteLength)
    },
    body
  });
  if (!upload.ok) {
    throw new HttpError(upload.status, "remote_writeback_failed", `Remote URL writeback failed: ${upload.status}`);
  }
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

// server/routes/fonts.ts
import fs4 from "node:fs/promises";
import path6 from "node:path";
var MAX_FONT_UPLOAD_BYTES = 80 * 1024 * 1024;
var FONT_EXTENSIONS = /* @__PURE__ */ new Set([".ttf", ".otf", ".ttc"]);
async function handleFontList(_request, response, config2) {
  await ensureFontDirs(config2);
  const entries = await fs4.readdir(config2.fontsDir, { withFileTypes: true });
  const items = await Promise.all(
    entries.filter((entry) => entry.isFile() && FONT_EXTENSIONS.has(path6.extname(entry.name).toLowerCase())).map(async (entry) => {
      const stats = await fs4.stat(path6.join(config2.fontsDir, entry.name));
      return {
        name: entry.name,
        size: stats.size,
        updatedAt: stats.mtime.toISOString()
      };
    })
  );
  items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  sendJson(response, 200, {
    items,
    lastRefreshAt: await readLastRefreshAt(config2),
    logs: await readFontRefreshLogs(config2)
  });
}
async function handleFontUpload(request, response, config2) {
  await ensureFontDirs(config2);
  const boundary = parseMultipartBoundary(request.headers["content-type"] || "");
  if (!boundary) {
    throw new HttpError(400, "invalid_upload", "\u8BF7\u4F7F\u7528 multipart/form-data \u4E0A\u4F20\u5B57\u4F53\u6587\u4EF6\u3002");
  }
  const body = await readLimitedBody(request, MAX_FONT_UPLOAD_BYTES);
  const file = parseMultipartFile(body, boundary);
  const originalName = sanitizeFontFileName(file.filename);
  validateFontFile(originalName, file.content);
  const targetPath = path6.join(config2.fontsDir, originalName);
  await fs4.writeFile(targetPath, file.content, { mode: 420 });
  const stats = await fs4.stat(targetPath);
  sendJson(response, 201, {
    item: {
      name: originalName,
      size: stats.size,
      updatedAt: stats.mtime.toISOString()
    }
  });
}
async function handleFontRefresh(_request, response, config2) {
  await ensureFontDirs(config2);
  const refreshRequestedAt = (/* @__PURE__ */ new Date()).toISOString();
  await fs4.writeFile(path6.join(config2.fontRefreshDir, "request"), refreshRequestedAt);
  sendJson(response, 200, { ok: true, refreshRequestedAt });
}
async function handleFontDelete(fontName, _request, response, config2) {
  await ensureFontDirs(config2);
  const safeName = sanitizeFontFileName(fontName);
  const targetPath = path6.join(config2.fontsDir, safeName);
  await fs4.rm(targetPath, { force: true });
  sendJson(response, 200, { ok: true });
}
async function ensureFontDirs(config2) {
  await fs4.mkdir(config2.fontsDir, { recursive: true });
  await fs4.mkdir(config2.fontRefreshDir, { recursive: true });
}
async function readLastRefreshAt(config2) {
  try {
    return (await fs4.readFile(path6.join(config2.fontRefreshDir, "last-success"), "utf8")).trim() || null;
  } catch {
    return null;
  }
}
async function readFontRefreshLogs(config2) {
  try {
    const raw = await fs4.readFile(path6.join(config2.fontRefreshDir, "fonts.log"), "utf8");
    return raw.trim().split("\n").slice(-80);
  } catch {
    return [];
  }
}
function parseMultipartBoundary(contentType2) {
  const match = contentType2.match(/(?:^|;)\s*boundary=(?:("([^"]+)")|([^;]+))/i);
  return (match?.[2] || match?.[3] || "").trim() || null;
}
async function readLimitedBody(request, limit) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > limit) {
      throw new HttpError(413, "upload_too_large", "\u5B57\u4F53\u6587\u4EF6\u8FC7\u5927\uFF0C\u8BF7\u4E0A\u4F20 80MB \u4EE5\u5185\u7684\u5B57\u4F53\u6587\u4EF6\u3002");
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}
function parseMultipartFile(body, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  let offset = 0;
  while (offset < body.length) {
    const partStart = body.indexOf(delimiter, offset);
    if (partStart < 0) {
      break;
    }
    const headersStart = partStart + delimiter.length;
    if (body.subarray(headersStart, headersStart + 2).toString() === "--") {
      break;
    }
    const contentStart = body.indexOf(Buffer.from("\r\n\r\n"), headersStart);
    if (contentStart < 0) {
      break;
    }
    const headers = body.subarray(headersStart, contentStart).toString("utf8");
    const filename = parseContentDispositionFilename(headers);
    const nextPart = body.indexOf(delimiter, contentStart + 4);
    if (nextPart < 0) {
      break;
    }
    if (filename) {
      let contentEnd = nextPart;
      if (contentEnd >= 2 && body[contentEnd - 2] === 13 && body[contentEnd - 1] === 10) {
        contentEnd -= 2;
      }
      return { filename, content: body.subarray(contentStart + 4, contentEnd) };
    }
    offset = nextPart;
  }
  throw new HttpError(400, "missing_font_file", "\u8BF7\u4E0A\u4F20\u4E00\u4E2A\u5B57\u4F53\u6587\u4EF6\u3002");
}
function parseContentDispositionFilename(headers) {
  const disposition = headers.split("\r\n").find((line) => line.toLowerCase().startsWith("content-disposition:")) || "";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
  }
  const match = disposition.match(/filename="([^"]+)"|filename=([^;]+)/i);
  return (match?.[1] || match?.[2] || "").trim() || null;
}
function sanitizeFontFileName(input) {
  const baseName = path6.basename(input).trim().replace(/[\\/:*?"<>|\0]/g, "_");
  if (!baseName || baseName === "." || baseName === "..") {
    throw new HttpError(400, "invalid_font_name", "\u5B57\u4F53\u6587\u4EF6\u540D\u65E0\u6548\u3002");
  }
  if (!FONT_EXTENSIONS.has(path6.extname(baseName).toLowerCase())) {
    throw new HttpError(400, "unsupported_font_type", "\u4EC5\u652F\u6301 .ttf\u3001.otf\u3001.ttc \u5B57\u4F53\u6587\u4EF6\u3002");
  }
  return baseName;
}
function validateFontFile(filename, content) {
  if (!content.length) {
    throw new HttpError(400, "empty_font_file", "\u5B57\u4F53\u6587\u4EF6\u4E0D\u80FD\u4E3A\u7A7A\u3002");
  }
  const extension = path6.extname(filename).toLowerCase();
  const signature = content.subarray(0, 4).toString("latin1");
  const isTrueType = content.length >= 4 && content[0] === 0 && content[1] === 1 && content[2] === 0 && content[3] === 0;
  const isOpenType = signature === "OTTO";
  const isTrueTypeCollection = signature === "ttcf";
  const isAppleTrueType = signature === "true";
  if (extension === ".ttc" && !isTrueTypeCollection) {
    throw new HttpError(400, "invalid_font_file", "\u5B57\u4F53\u6587\u4EF6\u683C\u5F0F\u4E0E\u6269\u5C55\u540D\u4E0D\u5339\u914D\u3002");
  }
  if ((extension === ".ttf" || extension === ".otf") && !isTrueType && !isOpenType && !isAppleTrueType) {
    throw new HttpError(400, "invalid_font_file", "\u5B57\u4F53\u6587\u4EF6\u683C\u5F0F\u4E0E\u6269\u5C55\u540D\u4E0D\u5339\u914D\u3002");
  }
}

// server/routes/drive.ts
import fs5 from "node:fs/promises";
import path7 from "node:path";
var SUPPORTED_EXTENSIONS = /* @__PURE__ */ new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "odt", "ods", "odp"]);
var SHARED_CENTER_PATH = ".shared-center";
async function handleDriveList(request, response, config2, requestedPath = "", rawScope = "all") {
  const scope = normalizeScope(rawScope);
  if (scope === "all" || scope === "shared" || scope === "client") {
    return handleLocalDriveList(response, config2, requestedPath, scope, resolveDriveOwnerUid(request, config2));
  }
  return handleFileServiceDriveList(request, response, config2, requestedPath, scope, resolveDriveOwnerUid(request, config2));
}
async function handleLocalDriveList(response, config2, requestedPath, scope, ownerUid) {
  const relativePath = resolveLocalDrivePath(requestedPath, scope, ownerUid);
  const targetPath = scope === "client" ? resolveClientfsFilePath(relativePath, config2, ownerUid) : resolveHomeFilePath(relativePath, config2, ownerUid);
  const dirents = await fs5.readdir(targetPath, { withFileTypes: true });
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
  const headerUserId = firstHeader2(request.headers["x-hc-user-id"])?.trim() || "";
  return headerUserId || config2.deployUid || "";
}
function resolveLocalDrivePath(requestedPath, scope, ownerUid = "") {
  const normalizedPath = requestedPath ? normalizeDrivePath2(requestedPath) : "";
  if (scope === "client") {
    return stripClientfsOwnerPrefix2(normalizedPath, ownerUid);
  }
  if (scope !== "shared") {
    return normalizedPath;
  }
  if (!normalizedPath) {
    return SHARED_CENTER_PATH;
  }
  if (normalizedPath === SHARED_CENTER_PATH || normalizedPath.startsWith(`${SHARED_CENTER_PATH}/`)) {
    return normalizedPath;
  }
  return joinDrivePath2(SHARED_CENTER_PATH, normalizedPath);
}
function stripClientfsOwnerPrefix2(relativePath, ownerUid) {
  if (!relativePath || !ownerUid) {
    return relativePath;
  }
  return relativePath === ownerUid ? "" : relativePath.startsWith(`${ownerUid}/`) ? relativePath.slice(ownerUid.length + 1) : relativePath;
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
async function handleFileServiceDriveList(request, response, config2, requestedPath, scope, ownerUid) {
  const target = resolveFileServiceTargetPath(scope, requestedPath);
  const fileServiceOrigin = getFileServiceOrigin(request, config2);
  const payload = await fetchFileServiceDirectory(fileServiceOrigin, target.absolutePath, ownerUid, request.headers.cookie);
  const entries = (payload.data || []).map((entry) => toFileServiceDriveEntry(entry, scope, target)).filter((entry) => Boolean(entry)).sort(compareEntries);
  console.log("[drive] file service list", {
    scope,
    path: target.absolutePath,
    origin: fileServiceOrigin,
    count: entries.length,
    total: payload.total ?? entries.length
  });
  sendJson(response, 200, {
    scope,
    path: target.relativePath,
    parentPath: getFileServiceParentPath(target.relativePath),
    entries
  });
}
async function fetchFileServiceDirectory(origin, targetPath, ownerUid, cookie) {
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
      owner: ownerUid,
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
  if (input === "shared" || input === "external" || input === "mount" || input === "client") {
    return input;
  }
  return "all";
}
async function toLocalDriveEntry(dirent, currentPath, targetPath, scope) {
  const entryPath = joinDrivePath2(currentPath, dirent.name);
  const stats = await fs5.stat(path7.join(targetPath, dirent.name)).catch(() => null);
  if (!stats || !stats.isDirectory() && !stats.isFile()) {
    return null;
  }
  const fileType = stats.isFile() ? path7.posix.extname(dirent.name).replace(/^\./, "").toLowerCase() : "";
  return {
    name: dirent.name,
    path: entryPath,
    type: stats.isDirectory() ? "directory" : "file",
    size: stats.isFile() ? stats.size : 0,
    modifiedAt: stats.mtime.toISOString(),
    fileType,
    supported: stats.isFile() && SUPPORTED_EXTENSIONS.has(fileType),
    source: scope
  };
}
function toFileServiceDriveEntry(entry, scope, target) {
  const type = entry.type === "directory" ? "directory" : entry.type === "file" ? "file" : null;
  const serviceEntryPath = normalizeReturnedFileServicePath(entry.filename || "", target.rootPath);
  const entryPath = target.rootPath === FILE_SERVICE_ROOT_BY_SCOPE.mount && scope === "external" ? toExternalRemoteFsClientPath(serviceEntryPath) : serviceEntryPath;
  const name = entry.basename || path7.posix.basename(serviceEntryPath);
  if (!type || !entryPath || !name) {
    return null;
  }
  const fileType = type === "file" ? path7.posix.extname(name).replace(/^\./, "").toLowerCase() : "";
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
function normalizeDrivePath2(input) {
  return path7.posix.normalize(`/${input.replace(/\\/g, "/")}`).replace(/^\/+/, "").replace(/^\.$/, "");
}
function normalizeReturnedFileServicePath(input, rootPath) {
  if (!input) {
    return "";
  }
  return normalizeFileServiceRelativePath(input, rootPath);
}
function joinDrivePath2(parentPath, name) {
  return parentPath ? `${parentPath}/${name}` : name;
}
function getLocalParentPath(input) {
  if (!input) {
    return "";
  }
  const parent = path7.posix.dirname(input);
  return parent === "." ? "" : parent;
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
function firstHeader2(value) {
  return Array.isArray(value) ? value[0] : value;
}
function compareEntries(a, b) {
  if (a.type !== b.type) {
    return a.type === "directory" ? -1 : 1;
  }
  return a.name.localeCompare(b.name, "zh-CN", { numeric: true, sensitivity: "base" });
}

// server/db/online-url-store.ts
import crypto4 from "node:crypto";
var ONLINE_URL_STORE = "online_url_history";
function collection4() {
  return getCollection(ONLINE_URL_STORE);
}
async function touchOnlineUrlHistory(ownerUid, url, title) {
  const record = buildOnlineUrlRecord(ownerUid, url, title);
  try {
    await collection4().upsert(record);
    return record;
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(ONLINE_URL_STORE);
    const nextItems = [record, ...items.filter((item) => item.id !== record.id)].slice(0, 500);
    await writeJsonArray(ONLINE_URL_STORE, nextItems);
    return record;
  }
}
async function listOnlineUrlHistory(ownerUid, limit = 20) {
  try {
    const items = await collection4().find({ ownerUid }, { sort: ["-openedAt"] }).fetch();
    return items.slice(0, limit);
  } catch (error) {
    if (!canUseLocalMiniDBFallback(error)) {
      throw error;
    }
    const items = await readJsonArray(ONLINE_URL_STORE);
    return items.filter((item) => item.ownerUid === ownerUid).sort((left, right) => right.openedAt.localeCompare(left.openedAt)).slice(0, limit);
  }
}
function buildOnlineUrlRecord(ownerUid, url, title) {
  return {
    id: createOnlineUrlHistoryId(ownerUid, url),
    ownerUid,
    url,
    title,
    openedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createOnlineUrlHistoryId(ownerUid, url) {
  return crypto4.createHash("sha256").update(`${ownerUid}
${url}`).digest("hex").slice(0, 32);
}

// server/routes/online-url.ts
async function handleOnlineUrlHistory(request, response, config2) {
  const user = resolveRequestUser(request, config2);
  const items = await listOnlineUrlHistory(user.id);
  sendJson(response, 200, { items });
}
async function handleTouchOnlineUrlHistory(request, response, config2) {
  const user = resolveRequestUser(request, config2);
  const body = await readJsonBody(request);
  const url = body.url?.trim();
  if (!url) {
    throw new HttpError(400, "missing_online_url", "Missing online URL.");
  }
  const title = body.title?.trim() || resolveOnlineUrlTitle(url);
  const item = await touchOnlineUrlHistory(user.id, url, title);
  sendJson(response, 200, { item });
}
function resolveOnlineUrlTitle(input) {
  try {
    const url = new URL(input);
    const pathName = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
    const queryName = url.searchParams.get("filename") || url.searchParams.get("name") || "";
    return sanitizeOnlineUrlTitle(pathName || queryName || input);
  } catch {
    return sanitizeOnlineUrlTitle(input);
  }
}
function sanitizeOnlineUrlTitle(input) {
  const title = input.trim().replace(/[\\/:*?"<>|\0]/g, "_");
  return title || "\u5728\u7EBF\u6587\u6863";
}

// server/static.ts
import fs6 from "node:fs";
import path8 from "node:path";
var FRONTEND_DIST = path8.resolve(process.env.FRONTEND_DIST || "dist/frontend");
function serveStatic(urlPath, response) {
  const normalizedPath = urlPath === "/" ? "/index.html" : urlPath;
  const target = path8.resolve(FRONTEND_DIST, `.${normalizedPath}`);
  if (!target.startsWith(FRONTEND_DIST)) return false;
  if (!fs6.existsSync(target) || !fs6.statSync(target).isFile()) return false;
  response.writeHead(200, { "content-type": contentType(target) });
  fs6.createReadStream(target).pipe(response);
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
      if (request.method === "POST" && url.pathname.startsWith("/api/editor/session/") && url.pathname.endsWith("/release")) {
        const sessionId = decodeURIComponent(url.pathname.slice("/api/editor/session/".length, -"/release".length));
        return await handleReleaseEditorSession(sessionId, request, response);
      }
      if (request.method === "GET" && url.pathname === "/api/recent") {
        return await handleRecentFiles(request, response, config2);
      }
      if (request.method === "DELETE" && url.pathname === "/api/recent") {
        return await handleClearRecentFiles(request, response, config2);
      }
      if (request.method === "DELETE" && url.pathname.startsWith("/api/recent/")) {
        return await handleDeleteRecentFile(decodeURIComponent(url.pathname.slice("/api/recent/".length)), request, response, config2);
      }
      if (request.method === "GET" && url.pathname === "/api/favorites") {
        return await handleFavoriteItems(request, response, config2);
      }
      if (request.method === "POST" && url.pathname === "/api/favorites") {
        return await handleUpsertFavoriteItem(request, response, config2);
      }
      if (request.method === "DELETE" && url.pathname.startsWith("/api/favorites/")) {
        return await handleDeleteFavoriteItem(decodeURIComponent(url.pathname.slice("/api/favorites/".length)), request, response, config2);
      }
      if (request.method === "GET" && url.pathname === "/api/online-url/history") {
        return await handleOnlineUrlHistory(request, response, config2);
      }
      if (request.method === "POST" && url.pathname === "/api/online-url/history") {
        return await handleTouchOnlineUrlHistory(request, response, config2);
      }
      if (request.method === "GET" && url.pathname === "/api/drive/list") {
        return await handleDriveList(request, response, config2, url.searchParams.get("path") || "", url.searchParams.get("scope") || "all");
      }
      if (request.method === "GET" && url.pathname === "/api/fonts") {
        return await handleFontList(request, response, config2);
      }
      if (request.method === "POST" && url.pathname === "/api/fonts") {
        return await handleFontUpload(request, response, config2);
      }
      if (request.method === "POST" && url.pathname === "/api/fonts/refresh") {
        return await handleFontRefresh(request, response, config2);
      }
      if (request.method === "DELETE" && url.pathname.startsWith("/api/fonts/")) {
        return await handleFontDelete(decodeURIComponent(url.pathname.slice("/api/fonts/".length)), request, response, config2);
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
