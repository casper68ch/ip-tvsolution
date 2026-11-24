import Link from "next/link";
import { apps } from "@/lib/apps";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Download IP-TVSOLUTION v1.9 — tutte le app",
  description:
    "Scarica IP-TVSOLUTION v1.9 per Windows, Web/Chrome, Smart TV LG e Samsung, Android e iPhone PWA. Tutti i download ufficiali in un'unica pagina. Solo player: nessuna playlist o credenziale inclusa.",
  path: "/download/",
  keywords: [
    "download IP-TVSOLUTION",
    "IP-TVSOLUTION Windows",
    "IP-TVSOLUTION Android",
    "IP-TVSOLUTION Web Chrome",
    "IP-TVSOLUTION Smart TV",
    "IP-TVSOLUTION iPhone PWA",
  ],
});

const ownApps = apps.filter((app) => app.project);

export default function DownloadPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Download", path: "/download/" },
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
                Download
              </li>
            </ol>
          </nav>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/iptv-solution-text.svg"
              alt="Logo IP-TVSOLUTION: puzzle rosso con la scritta IP-TVSOLUTION"
              width={240}
              height={55}
              className="h-auto w-60 shrink-0"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Download ufficiali
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold text-fg sm:text-4xl">
                Tutte le app IP-TVSOLUTION v1.9
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary">
                Cinque edizioni del progetto: Windows, Web/Chrome, Smart TV, Android e iPhone.
                Scegli la tua piattaforma, scarica il pacchetto e registra il tuo account con nome,
                password ed email. Riceverai il codice di attivazione via email.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/web-app/"
                  className="tap-target inline-flex items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
                >
                  Apri la Web App nel browser <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/guida/"
                  className="tap-target inline-flex items-center rounded-lg border border-line bg-surface px-4 text-sm text-secondary transition hover:border-accent/50 hover:text-fg"
                >
                  Guida all&apos;installazione
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page py-10 sm:py-14">
        <div className="rounded-xl border border-warning/25 bg-warning/5 p-4 text-xs leading-relaxed text-secondary">
          <span aria-hidden="true" className="mr-1 font-semibold text-warning">
            ⚠
          </span>
          I file vengono scaricati direttamente da download.ip-tvsolution.online, il dominio
          ufficiale IP-TVSOLUTION. I link sono verificati e ufficiali. <strong>Nessuna playlist,
          credenziale o abbonamento IPTV è incluso</strong>: configuri la tua linea nelle
          impostazioni dell&apos;app.
        </div>

        <div className="mt-8 grid list-none gap-4 sm:grid-cols-2">
          {ownApps.map((app) => (
            <section
              key={app.slug}
              id={app.slug}
              className="surface-card scroll-mt-20 flex h-full flex-col p-5"
              aria-labelledby={`${app.slug}-titolo`}
            >
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={app.logo.src}
                  alt={app.logo.alt}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <h2
                    id={`${app.slug}-titolo`}
                    className="font-display text-lg font-semibold text-fg"
                  >
                    {app.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    v{app.version ?? "1.9"} · {app.platforms.join(" / ")}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-secondary">{app.tagline}</p>

              <div className="mt-4 flex flex-col gap-2">
                {app.install.map((install) => (
                  <a
                    key={`${install.platform}-${install.label}`}
                    href={install.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target inline-flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg transition hover:border-accent/50"
                  >
                    <span className="min-w-0 truncate">{install.label}</span>
                    <span aria-hidden="true" className="shrink-0 text-accent-hover">
                      ↓
                    </span>
                  </a>
                ))}
              </div>

              <div className="mt-auto pt-4">
                <Link
                  href={`/app/${app.slug}/`}
                  className="tap-target inline-flex items-center text-xs font-medium text-secondary transition hover:text-fg"
                >
                  Scheda e guida di installazione
                  <span aria-hidden="true" className="ml-1">
                    →
                  </span>
                </Link>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 border-t border-line pt-8" aria-labelledby="attivazione-titolo">
          <h2 id="attivazione-titolo" className="font-display text-xl font-semibold text-fg">
            Come funziona l&apos;attivazione
          </h2>
          <ol className="mt-4 grid list-none gap-3 text-sm text-secondary sm:grid-cols-3">
            <li className="rounded-lg border border-line bg-surface/40 p-4">
              <span className="font-semibold text-accent-hover">1. Registrati</span>
              <p className="mt-1 text-xs leading-relaxed">
                All&apos;primo avvio inserisci nome utente, password ed email.
              </p>
            </li>
            <li className="rounded-lg border border-line bg-surface/40 p-4">
              <span className="font-semibold text-accent-hover">2. Ricevi il codice</span>
              <p className="mt-1 text-xs leading-relaxed">
                Il proprietario approva la richiesta e ti invia il codice IPTV-XXXXXXXX via email.
              </p>
            </li>
            <li className="rounded-lg border border-line bg-surface/40 p-4">
              <span className="font-semibold text-accent-hover">3. Attiva l&apos;app</span>
              <p className="mt-1 text-xs leading-relaxed">
                Inserisci il codice nell&apos;app e configura la tua linea IPTV nella sezione sorgenti.
              </p>
            </li>
          </ol>
          <p className="mt-5 text-xs text-muted">
            Assistenza e informazioni:{" "}
            <a href={`mailto:${siteConfig.email}`} className="text-accent-hover hover:underline">
              {siteConfig.email}
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
