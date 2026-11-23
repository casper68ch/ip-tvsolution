/**
 * Tipi condivisi del catalogo player.
 *
 * Regole di prodotto:
 * - il portale descrive SOLO player legittimi, mai contenuti, playlist o credenziali;
 * - nessun codice Downloader viene inventato: se non verificato vale `null`;
 * - nessun punteggio/recensione aggregata viene mostrato o dichiarato nel JSON-LD.
 */

export type LicenseModel = "free" | "freemium" | "paid";

export type PlatformId =
  | "android"
  | "android-tv"
  | "windows"
  | "web"
  | "lg-webos"
  | "samsung-tizen"
  | "apple"
  | "linux";

export type InstallMethod =
  | "store"
  | "apk"
  | "downloader"
  | "appstore"
  | "exe"
  | "dmg"
  | "flatpak"
  | "snap"
  | "repo"
  | "web";

export interface InstallOption {
  platform: PlatformId;
  method: InstallMethod;
  /** Etichetta breve mostrata sul pulsante, es. "Google Play". */
  label: string;
  /** URL ufficiale https del produttore o dello store. */
  url: string;
  devices?: string[];
  storeId?: string;
  packageId?: string;
  /** Codice Downloader solo se verificato, altrimenti null. */
  downloaderCode?: string | null;
  steps: string[];
  note?: string;
  verified: boolean;
  verifiedAt?: string;
}

export interface AppLogo {
  src: string;
  alt: string;
}

export interface AppSeo {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface AppRecord {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  officialUrl: string;
  developer?: string;
  licenseModel: LicenseModel;
  platforms: PlatformId[];
  install: InstallOption[];
  pros: string[];
  cons: string[];
  logo: AppLogo;
  bestFor?: string;
  features?: string[];
  requirements?: string[];
  seo?: AppSeo;
  featured?: boolean;
  order?: number;
  verifiedAt?: string;
  /** True per i player del progetto IP-TVSOLUTION. */
  project?: boolean;
  /** Versione del progetto mostrata come badge (es. "1.9"). */
  version?: string;
}

/** Sottoinsieme serializzabile passato ai componenti client del catalogo. */
export interface CatalogInstall {
  platform: PlatformId;
  method: InstallMethod;
  label: string;
  url: string;
  downloaderCode?: string | null;
  steps: string[];
  note?: string;
  verified: boolean;
}

export interface CatalogApp {
  slug: string;
  name: string;
  tagline: string;
  platforms: PlatformId[];
  licenseModel: LicenseModel;
  logo: AppLogo;
  install: CatalogInstall[];
  bestFor?: string;
  featured?: boolean;
  order?: number;
  project?: boolean;
  version?: string;
}

export type SortKey = "relevance" | "name" | "free-first" | "verified-first";

export type PlatformFilterValue = PlatformId | "all";
export type LicenseFilterValue = LicenseModel | "all";

/** Filtri "modello": licenza e tipo di installazione. */
export interface CatalogFilters {
  query: string;
  platform: PlatformFilterValue;
  license: LicenseFilterValue;
  sort: SortKey;
}

export interface GuideSection {
  title: string;
  intro?: string;
  steps: string[];
  note?: string;
}

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  shortName: string;
  slug: string;
  tagline: string;
  description: string;
  devices: string[];
  guide: GuideSection[];
}
