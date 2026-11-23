import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppCard } from "@/components/app-card";
import { InstallSteps } from "@/components/install-steps";
import { ModelBadge } from "@/components/model-badge";
import { PlatformBadge } from "@/components/platform-badge";
import { ProsConsList } from "@/components/pros-cons-list";
import { getPlatformName, platformMap } from "@/data/platforms";
import { apps, getAppBySlug, getRelatedApps, licenseLabel, toCatalogApp } from "@/lib/apps";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd, softwareApplicationJsonLd } from "@/lib/seo";

interface AppPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return apps.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({ params }: AppPageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  if (!app) {
    return buildMetadata({
      title: "Player non trovato",
      description: "La scheda richiesta non è disponibile.",
      path: `/app/${slug}/`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: app.seo?.title ?? `${app.name}: installazione e guida`,
    description:
      app.seo?.description ??
      `${app.tagline} Requisiti, piattaforme supportate e passaggi di installazione ufficiali per ${app.name}.`,
    path: `/app/${app.slug}/`,
    keywords: app.seo?.keywords ?? [app.name, "installare " + app.name],
    type: "article",
  });
}

const methodLabels: Record<string, string> = {
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

export default async function AppPage({ params }: AppPageProps) {
  const { slug } = await params;
  const app = getAppBySlug(slug);

  if (!app) notFound();

  const related = getRelatedApps(app, 3).map(toCatalogApp);
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Catalogo", path: "/#catalogo" },
    { name: app.name, path: `/app/${app.slug}/` },
  ];

  // FAQ specifiche generate solo dai dati verificati della scheda.
  const playerFaqs = [
    {
      question: `Dove si scarica ${app.name}?`,
      answer: `Scarica ${app.name} esclusivamente dal canale ufficiale indicato in questa scheda (${app.officialUrl}). Il portale non ospita file di installazione.`,
    },
    {
      question: `Su quali piattaforme funziona ${app.name}?`,
      answer: `${app.name} è disponibile per ${app.platforms.map((platform) => getPlatformName(platform)).join(", ")}. I metodi di installazione supportati sono descritti nella sezione dedicata.`,
    },
    {
      question: `${app.name} include canali o playlist IPTV?`,
      answer: `No. ${app.name} è un player multimediale: non include canali, playlist, abbonamenti o credenziali. Va configurato con fonti di cui possiedi i diritti.`,
    },
    {
      question: `Come si installa ${app.name}?`,
      answer: `Segui i ${app.install.length} ${app.install.length === 1 ? "passaggio documentato" : "passaggi documentati"} nella sezione "Come installarlo": ogni metodo rimanda al sito ufficiale del progetto.`,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd(app)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(playerFaqs)) }}
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
              <li>
                <Link href="/#catalogo" className="transition hover:text-fg">
                  Catalogo
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-secondary">
                {app.name}
              </li>
            </ol>
          </nav>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={app.logo.src}
                alt={app.logo.alt}
                width={80}
                height={80}
                className="h-full w-full object-contain"
              />
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-fg sm:text-4xl">{app.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
                {app.tagline}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <ModelBadge license={app.licenseModel} size="md" />
                {app.project ? (
                  <span className="rounded-full border border-accent/45 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-hover">
                    Nostro player{app.version ? ` · v${app.version}` : ""}
                  </span>
                ) : null}
                {app.platforms.map((platform) => (
                  <PlatformBadge key={platform} platform={platform} size="md" />
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={app.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
                >
                  Sito ufficiale
                  <span aria-hidden="true">↗</span>
                </a>
                <Link
                  href="/#catalogo"
                  className="tap-target inline-flex items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg transition hover:border-accent/50"
                >
                  Torna al catalogo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-14">
        <div className="min-w-0">
          <section aria-labelledby="descrizione-titolo">
            <h2 id="descrizione-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
              Che cos&apos;è {app.name}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary sm:text-base">
              {app.description}
            </p>

            {app.bestFor ? (
              <p className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-secondary">
                <strong className="text-fg">Ideale per:</strong> {app.bestFor}
              </p>
            ) : null}
          </section>

          <section className="mt-10" aria-labelledby="installazione-titolo">
            <h2 id="installazione-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
              Come installarlo
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              {app.install.length}{" "}
              {app.install.length === 1 ? "canale di installazione" : "canali di installazione"}{" "}
              documentati. Apri il link ufficiale e segui i passaggi: il portale non ospita alcun
              file.
            </p>

            <div className="mt-5 space-y-4">
              {app.install.map((install) => (
                <article
                  key={`${install.platform}-${install.method}-${install.label}`}
                  className="surface-card p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <PlatformBadge platform={install.platform} />
                    <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-muted">
                      {methodLabels[install.method] ?? install.method}
                    </span>
                    {install.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] text-success">
                        <span aria-hidden="true">✓</span> link verificato
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] text-warning">
                        <span aria-hidden="true">!</span> da verificare
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-fg">
                    {getPlatformName(install.platform)} · {install.label}
                  </h3>

                  {install.devices && install.devices.length > 0 ? (
                    <p className="mt-1 text-xs text-muted">
                      Dispositivi: {install.devices.join(", ")}
                    </p>
                  ) : null}

                  <div className="mt-4">
                    <InstallSteps steps={install.steps} />
                  </div>

                  {install.note ? (
                    <p className="mt-4 rounded-lg border border-warning/25 bg-warning/5 p-3 text-xs leading-relaxed text-secondary">
                      <span aria-hidden="true" className="mr-1 text-warning">
                        ⚠
                      </span>
                      {install.note}
                    </p>
                  ) : null}

                  <a
                    href={install.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface-2 px-4 text-sm font-medium text-fg transition hover:border-accent/50"
                  >
                    Apri {install.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))}
            </div>
          </section>

          {app.features && app.features.length > 0 ? (
            <section className="mt-10" aria-labelledby="funzioni-titolo">
              <h2 id="funzioni-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
                Funzioni principali
              </h2>
              <ul className="mt-4 grid list-none gap-2 sm:grid-cols-2">
                {app.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex gap-2 rounded-lg border border-line bg-surface p-3 text-sm text-secondary"
                  >
                    <span aria-hidden="true" className="text-accent">
                      ▪
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-10" aria-labelledby="pro-contro-titolo">
            <h2 id="pro-contro-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
              Punti di forza e limiti
            </h2>
            <ProsConsList pros={app.pros} cons={app.cons} className="mt-4" />
          </section>

          <section className="mt-10" aria-labelledby="faq-player-titolo">
            <h2 id="faq-player-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
              Domande frequenti su {app.name}
            </h2>
            <div className="mt-4 space-y-2">
              {playerFaqs.map((faq) => (
                <details key={faq.question} className="surface-card p-4">
                  <summary className="cursor-pointer text-sm font-medium text-fg">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {related.length > 0 ? (
            <section className="mt-10" aria-labelledby="alternativi-titolo">
              <h2 id="alternativi-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
                Alternative compatibili
              </h2>
              <ul className="mt-4 grid list-none gap-4 sm:grid-cols-2">
                {related.map((candidate) => (
                  <li key={candidate.slug}>
                    <AppCard app={candidate} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="surface-card p-5" aria-labelledby="scheda-rapida">
            <h2 id="scheda-rapida" className="text-sm font-semibold text-fg">
              Scheda rapida
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Sviluppatore</dt>
                <dd className="text-right text-fg">{app.developer ?? "Non indicato"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Licenza</dt>
                <dd className="text-right text-fg">{licenseLabel(app.licenseModel)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Piattaforme</dt>
                <dd className="text-right text-fg">{app.platforms.length}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Verificato il</dt>
                <dd className="text-right text-fg">{app.verifiedAt ?? "—"}</dd>
              </div>
            </dl>

            {app.requirements && app.requirements.length > 0 ? (
              <div className="mt-4 border-t border-line pt-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Requisiti
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-secondary">
                  {app.requirements.map((requirement) => (
                    <li key={requirement}>· {requirement}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-warning/25 bg-warning/5 p-4">
            <h2 className="text-sm font-semibold text-warning">Nessun contenuto incluso</h2>
            <p className="mt-2 text-xs leading-relaxed text-secondary">
              {app.name} è solo un player. Questo portale non distribuisce canali, playlist,
              abbonamenti o credenziali: configura l&apos;app esclusivamente con fonti di cui
              possiedi i diritti.
            </p>
          </section>

          <nav aria-label="Piattaforme del player" className="surface-card p-5">
            <h2 className="text-sm font-semibold text-fg">Piattaforme supportate</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {app.platforms.map((platform) => (
                <li key={platform}>
                  <Link
                    href={`/piattaforma/${platformMap.get(platform)?.slug ?? platform}/`}
                    className="inline-flex items-center rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[11px] text-secondary transition hover:border-accent/50 hover:text-fg"
                  >
                    {getPlatformName(platform)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}
