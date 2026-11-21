import rawApps from "@/data/apps.json";
import type {
  AppRecord,
  CatalogApp,
  CatalogFilters,
  InstallOption,
  LicenseModel,
  PlatformId,
  SortKey,
} from "@/types/app";

/** Catalogo completo, ordinato per campo `order` e poi per nome. */
export const apps: AppRecord[] = [...(rawApps as unknown as AppRecord[])].sort(
  (a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name, "it")
);

export const catalogApps: CatalogApp[] = apps.map(toCatalogApp);

export function toCatalogApp(app: AppRecord): CatalogApp {
  return {
    slug: app.slug,
    name: app.name,
    tagline: app.tagline,
    platforms: app.platforms,
    licenseModel: app.licenseModel,
    logo: app.logo,
    bestFor: app.bestFor,
    featured: app.featured,
    order: app.order,
    install: app.install.map((install) => ({
      platform: install.platform,
      method: install.method,
      label: install.label,
      url: install.url,
      downloaderCode: install.downloaderCode ?? null,
      steps: install.steps,
      note: install.note,
      verified: install.verified,
    })),
  };
}

export function getAppBySlug(slug: string): AppRecord | undefined {
  return apps.find((app) => app.slug === slug);
}

export function getFeaturedApps(count = 6): AppRecord[] {
  const featured = apps.filter((app) => app.featured);
  return (featured.length > 0 ? featured : apps).slice(0, count);
}

export function getAppsByPlatform(platform: PlatformId): AppRecord[] {
  return apps.filter((app) => app.platforms.includes(platform));
}

export function getInstallForPlatform(
  app: AppRecord,
  platform: PlatformId
): InstallOption | undefined {
  return app.install.find((install) => install.platform === platform);
}

export function getRelatedApps(app: AppRecord, count = 3): AppRecord[] {
  return apps
    .filter((candidate) => candidate.slug !== app.slug)
    .map((candidate) => ({
      candidate,
      score: candidate.platforms.filter((platform) => app.platforms.includes(platform)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (a.candidate.order ?? 99) - (b.candidate.order ?? 99))
    .slice(0, count)
    .map((entry) => entry.candidate);
}

export function getDownloaderCode(app: AppRecord): string | null {
  const install = app.install.find((item) => item.downloaderCode);
  return install?.downloaderCode ?? null;
}

/** Normalizza per una ricerca tollerante ad accenti, maiuscole e spazi doppi. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const licenseLabels: Record<LicenseModel, string> = {
  free: "Gratuito",
  freemium: "Freemium",
  paid: "A pagamento",
};

export function licenseLabel(license: LicenseModel): string {
  return licenseLabels[license];
}

function appMatchesQuery(app: AppRecord | CatalogApp, query: string): boolean {
  if (!query) return true;
  const haystack = normalize(
    [
      app.name,
      app.tagline,
      "bestFor" in app ? app.bestFor ?? "" : "",
      app.platforms.join(" "),
      licenseLabel(app.licenseModel),
      "description" in app ? app.description : "",
      "features" in app ? (app.features ?? []).join(" ") : "",
    ].join(" ")
  );
  const terms = normalize(query).split(" ").filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}

export function filterAndSortApps<T extends AppRecord | CatalogApp>(
  source: T[],
  filters: CatalogFilters
): T[] {
  const filtered = source.filter((app) => {
    if (filters.platform !== "all" && !app.platforms.includes(filters.platform)) return false;
    if (filters.license !== "all" && app.licenseModel !== filters.license) return false;
    return appMatchesQuery(app, filters.query);
  });

  return sortApps(filtered, filters.sort);
}

export function sortApps<T extends AppRecord | CatalogApp>(source: T[], sort: SortKey): T[] {
  const copy = [...source];
  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "it"));
    case "free-first": {
      const weight = (app: T) =>
        app.licenseModel === "free" ? 0 : app.licenseModel === "freemium" ? 1 : 2;
      return copy.sort((a, b) => weight(a) - weight(b) || a.name.localeCompare(b.name, "it"));
    }
    case "verified-first": {
      const verified = (app: T) =>
        app.install.some((install: { verified: boolean }) => install.verified) ? 0 : 1;
      return copy.sort((a, b) => verified(a) - verified(b) || a.name.localeCompare(b.name, "it"));
    }
    case "relevance":
    default:
      return copy.sort(
        (a, b) =>
          Number(Boolean("featured" in b && b.featured)) -
            Number(Boolean("featured" in a && a.featured)) ||
          (a.order ?? 99) - (b.order ?? 99) ||
          a.name.localeCompare(b.name, "it")
      );
  }
}

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Rilevanza" },
  { value: "name", label: "Nome A-Z" },
  { value: "free-first", label: "Gratuiti prima" },
  { value: "verified-first", label: "Verificati prima" },
];

export const licenseOptions: { value: LicenseModel; label: string }[] = [
  { value: "free", label: "Gratuito" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "A pagamento" },
];
