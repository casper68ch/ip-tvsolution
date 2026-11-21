"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { AppCard } from "@/components/app-card";
import { AppCardSkeleton } from "@/components/app-card-skeleton";
import { EmptyState } from "@/components/empty-state";
import { ModelFilter } from "@/components/model-filter";
import { PlatformFilter } from "@/components/platform-filter";
import { SearchBar } from "@/components/search-bar";
import { SortSelect } from "@/components/sort-select";
import { filterAndSortApps } from "@/lib/apps";
import type {
  CatalogApp,
  LicenseFilterValue,
  PlatformFilterValue,
  SortKey,
} from "@/types/app";

interface CatalogSectionProps {
  apps: CatalogApp[];
}

export function CatalogSection({ apps }: CatalogSectionProps) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<PlatformFilterValue>("all");
  const [license, setLicense] = useState<LicenseFilterValue>("all");
  const [sort, setSort] = useState<SortKey>("relevance");

  const deferredQuery = useDeferredValue(query);
  const isStale = deferredQuery !== query;

  const results = useMemo(
    () =>
      filterAndSortApps(apps, {
        query: deferredQuery,
        platform,
        license,
        sort,
      }),
    [apps, deferredQuery, platform, license, sort]
  );

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: apps.length };
    for (const app of apps) {
      for (const id of app.platforms) {
        base[id] = (base[id] ?? 0) + 1;
      }
    }
    return base;
  }, [apps]);

  const hasActiveFilters =
    query.trim().length > 0 || platform !== "all" || license !== "all" || sort !== "relevance";

  const resetFilters = () => {
    setQuery("");
    setPlatform("all");
    setLicense("all");
    setSort("relevance");
  };

  return (
    <section id="catalogo" className="scroll-mt-20 py-12 sm:py-16" aria-labelledby="catalogo-titolo">
      <div className="container-page">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Catalogo</p>
            <h2 id="catalogo-titolo" className="mt-1 text-2xl font-semibold text-fg sm:text-3xl">
              Scegli il player, poi la piattaforma
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary">
              Ricerca istantanea con <kbd className="rounded border border-line bg-surface px-1 text-[11px]">/</kbd>{" "}
              o <kbd className="rounded border border-line bg-surface px-1 text-[11px]">Ctrl K</kbd>.
              I filtri lavorano su piattaforma e modello di licenza, senza mai proporre contenuti.
            </p>
          </div>
          <p className="text-xs text-muted">
            {apps.length} player · 8 piattaforme · 0 contenuti
          </p>
        </div>

        <div className="sticky top-16 z-30 mt-6 rounded-2xl border border-line bg-bg/90 p-3 backdrop-blur-xl sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <SearchBar value={query} onChange={setQuery} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <ModelFilter value={license} onChange={setLicense} />
              <SortSelect value={sort} onChange={setSort} />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            <PlatformFilter value={platform} onChange={setPlatform} counts={counts} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p role="status" aria-live="polite" className="text-xs text-secondary">
                <strong className="text-fg">{results.length}</strong>{" "}
                {results.length === 1 ? "player trovato" : "player trovati"}
                {platform !== "all" ? ` · ${platform}` : ""}
                {license !== "all" ? ` · ${license}` : ""}
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="tap-target inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-secondary transition hover:border-accent/50 hover:text-fg"
                >
                  <span aria-hidden="true">↺</span>
                  Azzera filtri
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isStale ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <AppCardSkeleton key={index} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((app) => (
                <li key={app.slug} className="animate-fade-up">
                  <AppCard app={app} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState onReset={resetFilters} />
          )}
        </div>
      </div>
    </section>
  );
}
