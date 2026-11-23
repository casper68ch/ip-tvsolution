import Link from "next/link";
import { platforms } from "@/data/platforms";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-line bg-surface/40">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/iptv-solution-text.svg"
              alt="IP-Tv.Solution"
              className="h-9 w-auto object-contain"
            />
            <p className="mt-3 max-w-md text-sm leading-relaxed text-secondary">
              Il portale italiano per installare player IPTV legittimi su ogni dispositivo.
              Guide passo passo, link ufficiali e nessun contenuto fornito dal sito.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
              Solo player. Nessun contenuto.
            </p>
          </div>

          <nav aria-label="Link del sito">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Sito</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { label: "Catalogo player", href: "/#catalogo" },
                { label: "Guida all'installazione", href: "/guida/" },
                { label: "Domande frequenti", href: "/faq/" },
                { label: "Chi siamo", href: "/chi-siamo/" },
                { label: "Note legali", href: "/note-legali/" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-secondary transition hover:text-fg">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Piattaforme">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Piattaforme
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {platforms.slice(0, 6).map((platform) => (
                <li key={platform.id}>
                  <Link
                    href={`/piattaforma/${platform.slug}/`}
                    className="text-secondary transition hover:text-fg"
                  >
                    {platform.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 rounded-xl border border-warning/25 bg-warning/5 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-warning">
            <span aria-hidden="true">⚠</span>
            Avvertenza legale
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-secondary">
            {siteConfig.disclaimer} I marchi e i loghi citati appartengono ai rispettivi
            proprietari e sono utilizzati a solo scopo informativo. Nessun file multimediale,
            playlist o credenziale è ospitato su questo sito.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. Tutti i diritti riservati.
          </p>
          <p>
            Contatti:{" "}
            <a className="text-secondary underline-offset-4 hover:underline" href={`mailto:${siteConfig.email}`}>
              {siteConfig.email}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
