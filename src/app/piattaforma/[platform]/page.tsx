import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppCard } from "@/components/app-card";
import { InstallSteps } from "@/components/install-steps";
import { getPlatformBySlug, platforms } from "@/data/platforms";
import { getAppsByPlatform, toCatalogApp } from "@/lib/apps";
import { breadcrumbJsonLd, buildMetadata, itemListJsonLd } from "@/lib/seo";

interface PlatformPageProps {
  params: Promise<{ platform: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return platforms.map((platform) => ({ platform: platform.slug }));
}

export async function generateMetadata({ params }: PlatformPageProps): Promise<Metadata> {
  const { platform: slug } = await params;
  const platform = getPlatformBySlug(slug);

  if (!platform) {
    return buildMetadata({
      title: "Piattaforma non trovata",
      description: "La piattaforma richiesta non è disponibile.",
      path: `/piattaforma/${slug}/`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `Player IPTV per ${platform.name}: installazione e guide`,
    description: `${platform.description} Player compatibili, metodi di installazione ufficiali e limiti da conoscere.`,
    path: `/piattaforma/${platform.slug}/`,
    keywords: [`player IPTV ${platform.name}`, `installare IPTV ${platform.name}`],
  });
}

export default async function PlatformPage({ params }: PlatformPageProps) {
  const { platform: slug } = await params;
  const platform = getPlatformBySlug(slug);

  if (!platform) notFound();

  const compatible = getAppsByPlatform(platform.id).map(toCatalogApp);
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Piattaforme", path: "/#piattaforme" },
    { name: platform.name, path: `/piattaforma/${platform.slug}/` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      {compatible.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              itemListJsonLd(
                compatible.map((app) => ({ name: app.name, path: `/app/${app.slug}/` })),
                `Player IPTV compatibili con ${platform.name}`
              )
            ),
          }}
        />
      ) : null}

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
              <li>
                <Link href="/#piattaforme" className="transition hover:text-fg">
                  Piattaforme
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-secondary">
                {platform.name}
              </li>
            </ol>
          </nav>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-accent">
            Piattaforma
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-fg sm:text-4xl">
            Player IPTV per {platform.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">
            {platform.description}
          </p>

          <ul className="mt-5 flex flex-wrap gap-1.5">
            {platform.devices.map((device) => (
              <li
                key={device}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] text-secondary"
              >
                {device}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-14">
        <div className="min-w-0">
          <section aria-labelledby="metodi-titolo">
            <h2 id="metodi-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
              Metodi di installazione su {platform.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              {platform.guide.length} procedure documentate, dalle più semplici a quelle riservate
              agli sviluppatori. Segui solo i canali ufficiali indicati dal produttore del player.
            </p>

            <div className="mt-5 space-y-4">
              {platform.guide.map((section) => (
                <article key={section.title} className="surface-card p-5">
                  <h3 className="text-base font-semibold text-fg">{section.title}</h3>
                  {section.intro ? (
                    <p className="mt-2 text-sm leading-relaxed text-secondary">{section.intro}</p>
                  ) : null}
                  <div className="mt-4">
                    <InstallSteps steps={section.steps} />
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

          <section className="mt-10" aria-labelledby="player-compatibili">
            <h2 id="player-compatibili" className="text-xl font-semibold text-fg sm:text-2xl">
              Player compatibili con {platform.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              {compatible.length} player del catalogo dichiarano il supporto a questa piattaforma.
              Apri la scheda per requisiti e passaggi specifici.
            </p>

            {compatible.length > 0 ? (
              <ul className="mt-5 grid list-none gap-4 sm:grid-cols-2">
                {compatible.map((app) => (
                  <li key={app.slug}>
                    <AppCard app={app} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm text-secondary">
                Nessun player del catalogo supporta ancora questa piattaforma in modo verificato.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold text-fg">Altre piattaforme</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {platforms
                .filter((candidate) => candidate.id !== platform.id)
                .map((candidate) => (
                  <li key={candidate.id}>
                    <Link
                      href={`/piattaforma/${candidate.slug}/`}
                      className="tap-target inline-flex w-full items-center justify-between rounded-lg px-2 text-secondary transition hover:bg-surface-2 hover:text-fg"
                    >
                      {candidate.name}
                      <span aria-hidden="true" className="text-muted">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>

          <section className="rounded-xl border border-warning/25 bg-warning/5 p-4">
            <h2 className="text-sm font-semibold text-warning">Promemoria</h2>
            <p className="mt-2 text-xs leading-relaxed text-secondary">
              Le modalità sviluppatore di LG e Samsung hanno scadenze e possono essere disattivate
              dagli aggiornamenti firmware. Preferisci sempre le app disponibili nello store
              ufficiale del televisore.
            </p>
          </section>

          <Link
            href="/guida/"
            className="tap-target flex items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Guida completa per piattaforma
          </Link>
        </aside>
      </div>
    </>
  );
}
