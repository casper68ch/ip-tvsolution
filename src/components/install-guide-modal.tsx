"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { InstallSteps } from "@/components/install-steps";
import { getPlatformName } from "@/data/platforms";
import type { CatalogInstall, InstallMethod } from "@/types/app";

const methodLabels: Record<InstallMethod, string> = {
  store: "Store ufficiale",
  apk: "Pacchetto APK",
  downloader: "Downloader",
  appstore: "App Store",
  exe: "Installer desktop",
  dmg: "Immagine DMG",
  flatpak: "Flatpak",
  snap: "Snap",
  repo: "Repository",
  web: "Web app",
};

interface InstallGuideModalProps {
  appName: string;
  appSlug: string;
  install: CatalogInstall;
  onClose: () => void;
}

export function InstallGuideModal({ appName, appSlug, install, onClose }: InstallGuideModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((node) => node.offsetParent !== null || node === closeRef.current);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
        aria-describedby="install-guide-platform"
        className="animate-scale-in max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-card sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Guida rapida</p>
            <h2 id="install-guide-title" className="mt-1 text-lg font-semibold text-fg">
              Installare {appName}
            </h2>
            <p id="install-guide-platform" className="mt-1 text-xs text-secondary">
              {getPlatformName(install.platform)} · {methodLabels[install.method]}
              {install.verified ? (
                <span className="ml-2 text-success">verificato</span>
              ) : (
                <span className="ml-2 text-warning">da verificare</span>
              )}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Chiudi la guida"
            className="tap-target -mr-1 -mt-1 inline-flex items-center justify-center rounded-lg border border-line bg-surface-2 px-3 text-secondary transition hover:text-fg"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="mt-5">
          <InstallSteps steps={install.steps} compact />
        </div>

        {install.note ? (
          <p className="mt-4 rounded-lg border border-warning/25 bg-warning/5 p-3 text-xs leading-relaxed text-secondary">
            <span aria-hidden="true" className="mr-1 text-warning">
              ⚠
            </span>
            {install.note}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a
            href={install.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target inline-flex flex-1 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Apri {install.label}
            <span aria-hidden="true" className="ml-2 text-xs">
              ↗
            </span>
          </a>
          <Link
            href={`/app/${appSlug}/`}
            className="tap-target inline-flex flex-1 items-center justify-center rounded-lg border border-line bg-surface-2 px-4 text-sm font-medium text-fg transition hover:border-accent/50"
          >
            Scheda completa
          </Link>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted">
          Il pulsante apre il sito ufficiale del produttore o lo store. Nessun contenuto viene
          scaricato da questo portale.
        </p>
      </div>
    </div>
  );
}
