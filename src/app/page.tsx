import Link from "next/link";
import { CatalogSection } from "@/components/catalog-section";
import { Hero } from "@/components/hero";
import { platforms } from "@/data/platforms";
import { apps, catalogApps } from "@/lib/apps";
import { buildMetadata, itemListJsonLd, websiteJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Player IPTV per Android, TV, Windows e Linux: guida all'installazione",
  description:
    "Catalogo italiano di player IPTV legittimi con guide di installazione verificate per Android, Android TV, Windows, web, LG webOS, Samsung Tizen, Apple e Linux. Nessun contenuto, nessuna playlist, nessuna credenziale.",
  path: "/",
  keywords: ["catalogo player IPTV", "installare player IPTV", "player IPTV legittimi"],
});

const steps = [
  {
    title: "Scegli il player",
    body: "Filtra il catalogo per piattaforma e modello di licenza. Ogni scheda indica sviluppatore, requisiti e canali di installazione ufficiali.",
  },
  {
    title: "Installa dal canale ufficiale",
    body: "Store del produttore, pacchetto firmato o repository: trovi il link diretto e i passaggi, senza file ospitati da questo sito.",
  },
  {
    title: "Configura la tua fonte",
    body: "Il player non contiene canali. Apri le impostazioni e inserisci il servizio di cui possiedi i diritti, nel rispetto dei termini d'uso.",
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd(
              apps.map((app) => ({ name: app.name, path: `/app/${app.slug}/` })),
              "Catalogo player IPTV legittimi"
            )
          ),
        }}
      />

      <Hero appCount={apps.length} platformCount={platforms.length} />

      <CatalogSection apps={catalogApps} />

      <section
        id="piattaforme"
        className="scroll-mt-20 border-y border-line bg-surface/30 py-12 sm:py-16"
        aria-labelledby="piattaforme-titolo"
      >
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Piattaforme</p>
          <h2 id="piattaforme-titolo" className="mt-1 text-2xl font-semibold text-fg sm:text-3xl">
            Una guida per ogni dispositivo
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary">
            Ogni piattaforma ha regole diverse per store, sideload e modalità sviluppatore.
            Apri la scheda per vedere metodi supportati, limiti e passaggi verificati.
          </p>

          <ul className="mt-6 grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {platforms.map((platform) => {
              const count = apps.filter((app) => app.platforms.includes(platform.id)).length;
              return (
                <li key={platform.id}>
                  <Link
                    href={`/piattaforma/${platform.slug}/`}
                    className="surface-card group flex h-full flex-col p-4 transition hover:border-accent/45"
                  >
                    <span className="font-display text-base font-semibold text-fg group-hover:text-accent-hover">
                      {platform.name}
                    </span>
                    <span className="mt-1 text-xs leading-relaxed text-secondary">
                      {platform.tagline}
                    </span>
                    <span className="mt-3 text-[11px] uppercase tracking-wider text-muted">
                      {count} {count === 1 ? "player" : "player"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="py-12 sm:py-16" aria-labelledby="come-funziona">
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Come funziona</p>
          <h2 id="come-funziona" className="mt-1 text-2xl font-semibold text-fg sm:text-3xl">
            Tre passaggi, nessun contenuto fornito
          </h2>

          <ol className="mt-6 grid list-none gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="surface-card p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 bg-accent-soft font-display text-sm font-semibold text-accent-hover">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-base font-semibold text-fg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-fg">Hai dubbi su store, APK o modalità sviluppatore?</p>
              <p className="mt-1 text-xs text-secondary">
                Le guide spiegano limiti e scadenze di ogni metodo, senza scorciatoie non ufficiali.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/guida/"
                className="tap-target inline-flex items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
              >
                Leggi le guide
              </Link>
              <Link
                href="/faq/"
                className="tap-target inline-flex items-center justify-center rounded-lg border border-line bg-surface-2 px-4 text-sm font-medium text-fg transition hover:border-accent/50"
              >
                Domande frequenti
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
