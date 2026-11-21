import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-6xl font-semibold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-fg">Pagina non trovata</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">
        La scheda o la guida che cerchi non esiste, oppure il player è stato rimosso dal catalogo.
        Prova a tornare alla home o a sfogliare i player disponibili.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/"
          className="tap-target inline-flex items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Torna alla home
        </Link>
        <Link
          href="/#catalogo"
          className="tap-target inline-flex items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-medium text-fg transition hover:border-accent/50"
        >
          Apri il catalogo
        </Link>
      </div>
    </div>
  );
}
