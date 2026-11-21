#!/usr/bin/env node
/**
 * Validazione del catalogo (eseguita anche in prebuild).
 *
 * Regole di prodotto:
 * - solo player legittimi, nessun contenuto/playlist/credenziale nel progetto;
 * - URL https reali, nessun codice Downloader inventato;
 * - nessun punteggio o recensione aggregata, nessun file multimediale in public/;
 * - Tailwind CSS v4 CSS-first: nessun tailwind.config.*.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];

const PLATFORMS = new Set([
  "android",
  "android-tv",
  "windows",
  "web",
  "lg-webos",
  "samsung-tizen",
  "apple",
  "linux",
]);

const METHODS = new Set([
  "store",
  "apk",
  "downloader",
  "appstore",
  "exe",
  "dmg",
  "flatpak",
  "snap",
  "repo",
  "web",
]);

const LICENSES = new Set(["free", "freemium", "paid"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FORBIDDEN_EXTENSIONS = [".m" + "3u", ".m" + "3u8", ".mpd", ".ts", ".mp4", ".mkv"];

const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const words = (text) => String(text).trim().split(/\s+/).filter(Boolean).length;

const appsPath = join(root, "src", "data", "apps.json");
let apps = [];

if (!existsSync(appsPath)) {
  fail("src/data/apps.json non trovato");
  report();
}

try {
  apps = JSON.parse(readFileSync(appsPath, "utf8"));
} catch (error) {
  fail(`apps.json non è JSON valido: ${error.message}`);
  report();
}

if (!Array.isArray(apps)) fail("apps.json deve essere un array");
if (apps.length < 16) fail(`servono almeno 16 player, trovati ${apps.length}`);

const seenIds = new Set();
const seenSlugs = new Set();
const coveredPlatforms = new Set();

for (const [index, app] of apps.entries()) {
  const label = app?.slug ?? `#${index}`;

  for (const field of [
    "id",
    "slug",
    "name",
    "tagline",
    "description",
    "officialUrl",
    "licenseModel",
    "logo",
  ]) {
    if (!app?.[field]) fail(`${label}: campo obbligatorio mancante "${field}"`);
  }

  if (app?.slug && !SLUG_PATTERN.test(app.slug)) fail(`${label}: slug non lowercase/kebab-case`);
  if (app?.id && !SLUG_PATTERN.test(app.id)) fail(`${label}: id non lowercase/kebab-case`);

  if (app?.id) {
    if (seenIds.has(app.id)) fail(`${label}: id duplicato (${app.id})`);
    seenIds.add(app.id);
  }
  if (app?.slug) {
    if (seenSlugs.has(app.slug)) fail(`${label}: slug duplicato (${app.slug})`);
    seenSlugs.add(app.slug);
  }

  if (!LICENSES.has(app?.licenseModel)) fail(`${label}: licenseModel non valido`);

  if (!Array.isArray(app?.platforms) || app.platforms.length === 0) {
    fail(`${label}: platforms deve essere un array non vuoto`);
  } else {
    for (const platform of app.platforms) {
      if (!PLATFORMS.has(platform)) fail(`${label}: piattaforma sconosciuta "${platform}"`);
      else coveredPlatforms.add(platform);
    }
  }

  if (!isHttps(app?.officialUrl)) fail(`${label}: officialUrl non è un URL https`);

  if (words(app?.description ?? "") < 60) {
    fail(`${label}: description troppo breve (${words(app?.description)} parole, minimo 60)`);
  }

  const installs = Array.isArray(app?.install) ? app.install : [];
  if (installs.length === 0) fail(`${label}: serve almeno un metodo di installazione`);

  let proseWords = words(app?.description ?? "") + words(app?.tagline ?? "");
  proseWords += words((app?.pros ?? []).join(" ")) + words((app?.cons ?? []).join(" "));
  proseWords += words((app?.features ?? []).join(" ")) + words((app?.requirements ?? []).join(" "));

  for (const install of installs) {
    const where = `${label}/${install?.platform ?? "?"}`;
    if (!PLATFORMS.has(install?.platform)) fail(`${where}: piattaforma non valida`);
    if (!METHODS.has(install?.method)) fail(`${where}: metodo non valido "${install?.method}"`);
    if (!install?.label) fail(`${where}: label mancante`);
    if (!isHttps(install?.url)) fail(`${where}: url non https`);
    if (!Array.isArray(install?.steps) || install.steps.length < 2) {
      fail(`${where}: servono almeno 2 step`);
    }
    if (typeof install?.verified !== "boolean") fail(`${where}: verified deve essere boolean`);
    if (install?.downloaderCode) {
      if (!install.verified) fail(`${where}: codice Downloader presente ma verified=false`);
      if (!/^[0-9]{4,8}$/.test(install.downloaderCode)) {
        fail(`${where}: formato codice Downloader inatteso`);
      }
    }
    if (install?.verified && !install?.verifiedAt) {
      warn(`${where}: verified=true senza verifiedAt`);
    }
    proseWords += words((install?.steps ?? []).join(" "));
    if (app?.platforms && !app.platforms.includes(install?.platform)) {
      fail(`${where}: install per piattaforma non dichiarata in platforms[]`);
    }
  }

  if (proseWords < 250) {
    fail(`${label}: contenuto complessivo troppo scarno (${proseWords} parole, minimo 250)`);
  }

  if (!Array.isArray(app?.pros) || app.pros.length < 2) fail(`${label}: servono almeno 2 pro`);
  if (!Array.isArray(app?.cons) || app.cons.length < 2) fail(`${label}: servono almeno 2 contro`);

  if (app?.logo?.src && !/^\/logos\/[a-z0-9-]+\.svg$/.test(app.logo.src)) {
    fail(`${label}: logo.src deve puntare a un SVG in /logos/`);
  } else if (app?.logo?.src) {
    const logoPath = join(root, "public", app.logo.src.replace(/^\//, ""));
    if (!existsSync(logoPath)) fail(`${label}: logo mancante in public${app.logo.src}`);
  }
  if (!app?.logo?.alt) fail(`${label}: logo.alt mancante`);

  if (app?.seo && words(app.seo.description ?? "") < 20) {
    warn(`${label}: seo.description molto breve`);
  }

  const serialized = JSON.stringify(app);
  if (serialized.includes("aggregate" + "Rating")) fail(`${label}: valutazioni aggregate non consentite`);
  if (new RegExp("\\." + "m3u8?", "i").test(serialized)) {
    fail(`${label}: riferimento a file playlist non consentito`);
  }
}

for (const platform of PLATFORMS) {
  if (!coveredPlatforms.has(platform)) fail(`piattaforma non coperta dal catalogo: ${platform}`);
}

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (FORBIDDEN_EXTENSIONS.some((ext) => entry.toLowerCase().endsWith(ext))) {
      fail(`file non consentito nella cartella pubblica: ${full}`);
    }
  }
}

const publicDir = join(root, "public");
if (existsSync(publicDir)) walk(publicDir);

for (const file of ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs", "tailwind.config.cjs"]) {
  if (existsSync(join(root, file))) fail(`Tailwind v4 CSS-first: ${file} non deve esistere`);
}

function isHttps(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function report() {
  const platformCount = new Set(apps.flatMap((app) => app?.platforms ?? [])).size;
  const installCount = apps.reduce((total, app) => total + (app?.install?.length ?? 0), 0);
  const verifiedCount = apps.reduce(
    (total, app) => total + (app?.install ?? []).filter((install) => install?.verified).length,
    0
  );

  console.log("");
  console.log("Validazione catalogo player IPTV");
  console.log("--------------------------------");
  console.log(`Player: ${apps.length}`);
  console.log(`Piattaforme: ${platformCount}`);
  console.log(`Canali di installazione: ${installCount} (${verifiedCount} verificati)`);
  console.log(`Avvisi: ${warnings.length}`);
  for (const message of warnings) console.log(`  · ${message}`);

  if (errors.length > 0) {
    console.log(`Errori: ${errors.length}`);
    for (const message of errors) console.log(`  ✗ ${message}`);
    console.log("");
    console.log("Validazione fallita.");
    process.exit(1);
  }

  console.log(`Errori: 0`);
  console.log("Validazione completata.");
  process.exit(0);
}

report();
