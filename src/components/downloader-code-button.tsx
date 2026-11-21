"use client";

import { showToast } from "@/components/toast";

interface DownloaderCodeButtonProps {
  code?: string | null;
  appName: string;
  className?: string;
}

/**
 * Copia il codice Downloader solo quando è verificato.
 * Se il codice non è certo il pulsante non viene mostrato: nessun valore inventato.
 */
export function DownloaderCodeButton({ code, appName, className = "" }: DownloaderCodeButtonProps) {
  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Codice ${code} copiato per ${appName}`);
    } catch {
      showToast(`Copia manuale del codice: ${code}`);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={[
        "tap-target inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-xs font-medium text-secondary transition hover:border-accent/50 hover:text-fg",
        className,
      ].join(" ")}
      aria-label={`Copia il codice Downloader ${code} per ${appName}`}
    >
      <span aria-hidden="true">⧉</span>
      Codice: <span className="font-mono text-fg">{code}</span>
    </button>
  );
}
