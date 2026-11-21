#!/usr/bin/env node
/**
 * Server statico minimale per la cartella `out/` generata da `next build`.
 * `next start` non è utilizzabile con `output: "export"`: questo script lo sostituisce
 * sia su Windows (sviluppo) sia su Linux (produzione), rispettando `trailingSlash`.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "out");
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

if (!existsSync(join(root, "index.html"))) {
  console.error("Cartella out/ non trovata: esegui prima `npm run build`.");
  process.exit(1);
}

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const target = join(root, normalize(clean));
  if (!target.startsWith(root + sep) && target !== root) return null;
  if (existsSync(target) && statSync(target).isDirectory()) {
    const index = join(target, "index.html");
    return existsSync(index) ? index : null;
  }
  return existsSync(target) && statSync(target).isFile() ? target : null;
}

createServer((request, response) => {
  const file = resolveFile(request.url ?? "/");
  if (!file) {
    const notFound = join(root, "404.html");
    if (existsSync(notFound)) {
      response.writeHead(404, { "content-type": mimeTypes[".html"] });
      createReadStream(notFound).pipe(response);
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("404 — Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": mimeTypes[extname(file).toLowerCase()] ?? "application/octet-stream",
    "cache-control": file.endsWith(".html") ? "no-cache" : "public, max-age=31536000, immutable",
  });
  createReadStream(file).pipe(response);
}).listen(port, host, () => {
  console.log(`Sito statico su http://${host}:${port}/ (cartella out/)`);
});
