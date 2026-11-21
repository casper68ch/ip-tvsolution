interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export function EmptyState({
  title = "Nessun player corrisponde ai filtri",
  description = "Prova a rimuovere una piattaforma, cambiare modello di licenza o cercare un nome diverso.",
  onReset,
}: EmptyStateProps) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface-2 text-xl text-muted"
      >
        ⌕
      </span>
      <h3 className="text-lg text-fg">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-secondary">{description}</p>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="tap-target mt-2 inline-flex items-center justify-center rounded-lg border border-accent/40 bg-accent-soft px-4 text-sm font-semibold text-accent-hover transition hover:bg-accent hover:text-white"
        >
          Azzera filtri
        </button>
      ) : null}
    </div>
  );
}
