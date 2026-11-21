import Link from "next/link";
import { InstallSteps } from "@/components/install-steps";
import { platforms } from "@/data/platforms";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Guida all'installazione dei player IPTV per ogni piattaforma",
  description:
    "Procedure passo passo per installare player IPTV legittimi su Android e Fire TV, Android TV, Windows, web, LG webOS, Samsung Tizen, Apple e Linux: store, APK, Downloader, modalità sviluppatore, Flatpak e Snap.",
  path: "/guida/",
  keywords: ["guida installazione player IPTV", "sideload Android", "Developer Mode LG", "sdb Tizen"],
});

export default function GuidaPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Guida", path: "/guida/" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />

      <div className="border-b border-line bg-surface/30">
        <div className="container-page py-10 sm:py-14">
          <nav aria-label="Percorso di navigazione" className="text-xs text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="transition hover:text-fg">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-secondary">
                Guida
              </li>
            </ol>
          </nav>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-accent">
            Manuale
          </p>
          <h1 className="mt-1 max-w-3xl text-2xl font-semibold text-fg sm:text-4xl">
            Guida all&apos;installazione, piattaforma per piattaforma
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">
            Ogni sistema ha canali di installazione diversi: store, pacchetti firmati, modalità
            sviluppatore o repository. Le procedure qui sotto riportano solo metodi documentati dai
            produttori e non richiedono mai di disattivare le protezioni di sicurezza in modo
            permanente.
          </p>

          <nav aria-label="Indice delle guide" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <li key={platform.id}>
                  <a
                    href={`#${platform.slug}`}
                    className="tap-target inline-flex items-center rounded-full border border-line bg-surface px-3 text-xs text-secondary transition hover:border-accent/50 hover:text-fg"
                  >
                    {platform.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="container-page py-10 sm:py-14">
        <div className="space-y-12">
          {platforms.map((platform) => (
            <section
              key={platform.id}
              id={platform.slug}
              className="scroll-mt-24"
              aria-labelledby={`${platform.slug}-titolo`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 id={`${platform.slug}-titolo`} className="text-xl font-semibold text-fg sm:text-2xl">
                    {platform.name}
                  </h2>
                  <p className="mt-1 text-sm text-secondary">{platform.tagline}</p>
                </div>
                <Link
                  href={`/piattaforma/${platform.slug}/`}
                  className="text-xs font-medium text-accent-hover transition hover:text-accent"
                >
                  Scheda piattaforma →
                </Link>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary">
                {platform.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {platform.devices.map((device) => (
                  <span
                    key={device}
                    className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-muted"
                  >
                    {device}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {platform.guide.map((section) => (
                  <article key={section.title} className="surface-card p-5">
                    <h3 className="text-base font-semibold text-fg">{section.title}</h3>
                    {section.intro ? (
                      <p className="mt-2 text-sm leading-relaxed text-secondary">{section.intro}</p>
                    ) : null}
                    <div className="mt-4">
                      <InstallSteps steps={section.steps} compact />
                    </div>
                    {section.note ? (
                      <p className="mt-4 rounded-lg border border-warning/25 bg-warning/5 p-3 text-xs leading-relaxed text-secondary">
                        <span aria-hidden="true" className="mr-1 text-warning">
                          ⚠
                        </span>
                        {section.note}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-line bg-surface p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-semibold text-fg">Hai già scelto il player?</p>
            <p className="mt-1 text-xs leading-relaxed text-secondary">
              Apri la scheda per i requisiti, i punti di forza e i limiti prima di installare.
            </p>
          </div>
          <Link
            href="/#catalogo"
            className="tap-target mt-3 inline-flex items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover sm:mt-0"
          >
            Vai al catalogo
          </Link>
        </div>
      </div>
    </>
  );
}
