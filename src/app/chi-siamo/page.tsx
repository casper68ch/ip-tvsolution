import Link from "next/link";
import { organizationJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Chi siamo e contatti",
  description:
    "Chi è IP-TVSOLUTION: portale italiano indipendente per l'installazione di player IPTV legittimi. Scopri il progetto, le piattaforme supportate e come contattarci.",
  path: "/chi-siamo/",
  keywords: ["chi siamo IP-TVSOLUTION", "contatti IP-TVSOLUTION", "progetto player IPTV"],
});

const platformLinks = [
  { name: "Android e Android TV", href: "/piattaforma/android/" },
  { name: "Windows", href: "/piattaforma/windows/" },
  { name: "Web / Chrome", href: "/piattaforma/web/" },
  { name: "LG webOS", href: "/piattaforma/lg-webos/" },
  { name: "Samsung Tizen", href: "/piattaforma/samsung-tizen/" },
  { name: "Apple", href: "/piattaforma/apple/" },
  { name: "Linux", href: "/piattaforma/linux/" },
];

export default function ChiSiamoPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Chi siamo", path: "/chi-siamo/" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
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
                Chi siamo
              </li>
            </ol>
          </nav>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/iptv-solution-text.svg"
              alt="Logo IP-TVSOLUTION"
              className="h-16 w-auto object-contain"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Il progetto
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-fg sm:text-4xl">
                Chi siamo e contatti
              </h1>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">
            {siteConfig.description}
          </p>
        </div>
      </div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-14">
        <article className="min-w-0 space-y-8">
          <section aria-labelledby="chi-siamo-titolo">
            <h2 id="chi-siamo-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
              Chi è IP-TVSOLUTION
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary sm:text-base">
              IP-TVSOLUTION è un progetto indipendente italiano nato per aiutare gli utenti a
              installare player IPTV legittimi su qualsiasi dispositivo. Il portale raccoglie guide
              verificate, link ufficiali ai canali di distribuzione dei produttori e informazioni
              chiare sui limiti di ogni piattaforma.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-secondary sm:text-base">
              Accanto al portale, il progetto distribuisce cinque edizioni proprie del player —
              Windows, Web/Chrome, Smart TV, Android e iPhone PWA — alla versione 1.9, con
              registrazione utente, attivazione e aggiornamenti automatici di playlist, EPG e
              loghi. Ogni utente configura la propria linea: nei pacchetti non sono inclusi né
              playlist né credenziali.
            </p>
          </section>

          <section aria-labelledby="cosa-facciamo-titolo">
            <h2 id="cosa-facciamo-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
              Cosa facciamo
            </h2>
            <ul className="mt-4 grid list-none gap-2 sm:grid-cols-2">
              {[
                "Guide di installazione passo passo per 8 piattaforme",
                "Catalogo di 21 player, di cui 5 del progetto",
                "Link verificati ai siti ufficiali dei produttori",
                "Aggiornamenti automatici di versione, EPG e loghi",
                "Attivazione utente con codice inviato via email",
                "Assistenza sulle procedure di installazione",
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-line bg-surface p-3 text-sm text-secondary"
                >
                  <span aria-hidden="true" className="mr-2 text-accent">
                    ▪
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="cosa-non-facciamo-titolo">
            <h2 id="cosa-non-facciamo-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
              Cosa non facciamo
            </h2>
            <div className="mt-4 rounded-xl border border-warning/25 bg-warning/5 p-5">
              <p className="text-sm leading-relaxed text-secondary">{siteConfig.disclaimer}</p>
            </div>
          </section>

          <section aria-labelledby="contatti-titolo">
            <h2 id="contatti-titolo" className="text-xl font-semibold text-fg sm:text-2xl">
              Contatti
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary sm:text-base">
              Per domande sulle guide, segnalazioni di link non aggiornati o richieste di
              informazioni sul progetto scrivi all&apos;indirizzo ufficiale:
            </p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="tap-target mt-4 inline-flex items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              {siteConfig.email}
            </a>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Rispondiamo alle richieste relative al portale e alle procedure di installazione. Non
              forniamo assistenza per servizi IPTV non autorizzati.
            </p>
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="surface-card p-5" aria-labelledby="scheda-progetto">
            <h2 id="scheda-progetto" className="text-sm font-semibold text-fg">
              Scheda del progetto
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Nome</dt>
                <dd className="text-right text-fg">{siteConfig.name}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Versione player</dt>
                <dd className="text-right text-fg">1.9</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Lingua</dt>
                <dd className="text-right text-fg">Italiano</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Sito</dt>
                <dd className="text-right text-fg">ip-tvsolution.online</dd>
              </div>
            </dl>
          </section>

          <nav aria-label="Piattaforme supportate" className="surface-card p-5">
            <h2 className="text-sm font-semibold text-fg">Piattaforme</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {platformLinks.map((platform) => (
                <li key={platform.href}>
                  <Link
                    href={platform.href}
                    className="text-secondary transition hover:text-fg hover:underline"
                  >
                    {platform.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link
            href="/note-legali/"
            className="tap-target flex items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg transition hover:border-accent/50"
          >
            Note legali
          </Link>
        </aside>
      </div>
    </>
  );
}
