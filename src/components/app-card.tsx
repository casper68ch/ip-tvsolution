"use client";

import { useState } from "react";
import Link from "next/link";
import { DownloaderCodeButton } from "@/components/downloader-code-button";
import { InstallGuideModal } from "@/components/install-guide-modal";
import { ModelBadge } from "@/components/model-badge";
import { PlatformBadge } from "@/components/platform-badge";
import type { CatalogApp, CatalogInstall } from "@/types/app";

interface AppCardProps {
  app: CatalogApp;
}

export function AppCard({ app }: AppCardProps) {
  const [guide, setGuide] = useState<CatalogInstall | null>(null);
  const primary = app.install[0];
  const downloaderCode = app.install.find((install) => install.downloaderCode)?.downloaderCode ?? null;
  const visiblePlatforms = app.platforms.slice(0, 3);
  const extraPlatforms = app.platforms.length - visiblePlatforms.length;

  return (
    <>
      <article className="surface-card group flex h-full flex-col p-5 transition-colors hover:border-accent/45 focus-within:border-accent/45">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={app.logo.src}
              alt={app.logo.alt}
              width={48}
              height={48}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-semibold text-fg">
              <Link
                href={`/app/${app.slug}/`}
                className="rounded transition hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {app.name}
              </Link>
            </h3>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-secondary">
              {app.tagline}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <ModelBadge license={app.licenseModel} />
          {visiblePlatforms.map((platform) => (
            <PlatformBadge key={platform} platform={platform} />
          ))}
          {extraPlatforms > 0 ? (
            <span className="rounded-full border border-line bg-surface-2 px-2 py-1 text-[11px] text-muted">
              +{extraPlatforms}
            </span>
          ) : null}
        </div>

        {app.bestFor ? (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
            <span className="text-secondary">Ideale per:</span> {app.bestFor}
          </p>
        ) : null}

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap gap-2">
            {primary ? (
              <a
                href={primary.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-xs font-semibold text-white transition hover:bg-accent-hover"
              >
                <span className="truncate">{primary.label}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ) : null}
            {primary ? (
              <button
                type="button"
                onClick={() => setGuide(primary)}
                className="tap-target inline-flex items-center justify-center rounded-lg border border-line bg-surface-2 px-3 text-xs font-medium text-fg transition hover:border-accent/50"
                aria-label={`Apri la guida di installazione per ${app.name}`}
              >
                Guida
              </button>
            ) : null}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <Link
              href={`/app/${app.slug}/`}
              className="tap-target inline-flex items-center text-xs font-medium text-secondary transition hover:text-fg"
            >
              Scheda completa
              <span aria-hidden="true" className="ml-1">
                →
              </span>
            </Link>
            {downloaderCode ? (
              <DownloaderCodeButton code={downloaderCode} appName={app.name} />
            ) : primary?.verified ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-success">
                <span aria-hidden="true">✓</span> link verificato
              </span>
            ) : null}
          </div>
        </div>
      </article>

      {guide ? (
        <InstallGuideModal
          appName={app.name}
          appSlug={app.slug}
          install={guide}
          onClose={() => setGuide(null)}
        />
      ) : null}
    </>
  );
}
