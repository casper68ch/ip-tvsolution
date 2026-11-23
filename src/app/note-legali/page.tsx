import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Note legali e avvertenze",
  description:
    "Natura del servizio, assenza di contenuti, uso dei marchi, link esterni, responsabilità dell'utente e trattamento dei dati su IP-TVSOLUTION.",
  path: "/note-legali/",
});

const sections = [
  {
    title: "1. Natura del servizio",
    body: [
      "IP-TVSOLUTION è un portale informativo indipendente dedicato all'installazione di player IPTV legittimi. Il sito non è un servizio di diffusione televisiva e non offre alcun tipo di abbonamento, lista di canali o accesso a contenuti.",
      "Le informazioni pubblicate hanno finalità divulgative e tecniche: descrivono canali di installazione ufficiali, requisiti dei dispositivi e limiti noti delle piattaforme.",
    ],
  },
  {
    title: "2. Nessun contenuto, nessuna playlist, nessuna credenziale",
    body: [
      "Il sito non ospita, non trasmette e non distribuisce file multimediali, playlist, elenchi di canali, credenziali o chiavi di accesso. Non è presente alcuna area di download di contenuti e nessun file di questo tipo è pubblicato nella cartella pubblica del sito.",
      "I player descritti sono programmi di riproduzione: al primo avvio non contengono canali. La configurazione di una fonte è un'operazione dell'utente, che deve utilizzare esclusivamente servizi di cui possiede i diritti o che sono autorizzati nel proprio paese.",
    ],
  },
  {
    title: "3. Marchi e loghi",
    body: [
      "I nomi dei prodotti, i marchi e i loghi citati appartengono ai rispettivi proprietari. Sono utilizzati esclusivamente a scopo identificativo e informativo, senza intento di confusione o associazione commerciale.",
      "I loghi presenti nel catalogo sono segnaposto grafici originali ispirati ai colori dei prodotti e non riproducono i marchi registrati.",
    ],
  },
  {
    title: "4. Link esterni",
    body: [
      "Le schede contengono collegamenti a siti di produttori, store e repository ufficiali. Non abbiamo controllo su questi siti e non rispondiamo del loro contenuto, delle loro condizioni d'uso o delle loro pratiche sulla privacy.",
      "Prima di installare qualsiasi software verifica sempre il dominio, la firma digitale del pacchetto e le condizioni di licenza del produttore.",
    ],
  },
  {
    title: "5. Codici Downloader e informazioni non verificate",
    body: [
      "I codici Downloader vengono pubblicati solo quando esiste una verifica documentata. In assenza di certezza il campo resta vuoto e l'installazione è segnalata come da verificare. Non troverai codici inventati o copiati da fonti non attendibili.",
      "Alcune schede indicano store o listing che possono cambiare nel tempo: la dicitura da verificare segnala proprio questa incertezza.",
    ],
  },
  {
    title: "6. Responsabilità dell'utente",
    body: [
      "L'utente è l'unico responsabile dell'uso dei player e delle fonti che decide di configurare. Deve rispettare la normativa sul diritto d'autore, i termini di servizio dei provider e le regole delle piattaforme utilizzate.",
      "Il portale non fornisce assistenza per l'accesso a servizi non autorizzati e non suggerisce metodi per eludere protezioni, restrizioni geografiche o sistemi di pagamento.",
    ],
  },
  {
    title: "7. Dati e cookie",
    body: [
      "Il sito è statico e non utilizza cookie di profilazione, strumenti pubblicitari o analytics di terze parti. I filtri del catalogo restano nella memoria della pagina e non vengono trasmessi a server esterni.",
      "Eventuali messaggi di posta inviati all'indirizzo di contatto vengono trattati esclusivamente per rispondere alla richiesta.",
    ],
  },
  {
    title: "8. Aggiornamenti",
    body: [
      "Le schede riportano la data dell'ultima verifica dei link. Store, pacchetti e modalità sviluppatore cambiano frequentemente: se noti un collegamento non più valido puoi segnalarlo all'indirizzo di contatto.",
      "Queste note possono essere aggiornate in qualsiasi momento; la versione vigente è quella pubblicata su questa pagina.",
    ],
  },
];

export default function NoteLegaliPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Note legali", path: "/note-legali/" },
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
                Note legali
              </li>
            </ol>
          </nav>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-accent">
            Informazioni legali
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-fg sm:text-4xl">Note legali</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-secondary sm:text-base">
            Ultimo aggiornamento: 21 novembre 2026. Questa pagina descrive la natura del portale,
            i limiti del servizio e le responsabilità dell&apos;utente.
          </p>
        </div>
      </div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-14">
        <article className="min-w-0 space-y-8">
          <div className="rounded-xl border border-warning/25 bg-warning/5 p-5">
            <h2 className="text-sm font-semibold text-warning">Avvertenza sintetica</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">{siteConfig.disclaimer}</p>
          </div>

          {sections.map((section) => (
            <section key={section.title} aria-labelledby={section.title.replace(/\s+/g, "-")}>
              <h2
                id={section.title.replace(/\s+/g, "-")}
                className="text-lg font-semibold text-fg sm:text-xl"
              >
                {section.title}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-secondary">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section aria-labelledby="contatti">
            <h2 id="contatti" className="text-lg font-semibold text-fg sm:text-xl">
              9. Contatti
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary">
              Per segnalazioni su link non aggiornati o richieste di rimozione di contenuti
              informativi scrivi a{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-accent-hover underline underline-offset-4"
              >
                {siteConfig.email}
              </a>
              .
            </p>
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold text-fg">In breve</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-secondary">
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-success">
                  ✓
                </span>
                Solo informazioni sull&apos;installazione dei player
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-success">
                  ✓
                </span>
                Link ai canali ufficiali dei produttori
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-success">
                  ✓
                </span>
                Nessun tracciamento pubblicitario
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-warning">
                  !
                </span>
                Nessun contenuto, playlist o credenziale
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-warning">
                  !
                </span>
                Nessuna assistenza per servizi non autorizzati
              </li>
            </ul>
          </section>

          <Link
            href="/faq/"
            className="tap-target flex items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg transition hover:border-accent/50"
          >
            Leggi le domande frequenti
          </Link>
        </aside>
      </div>
    </>
  );
}
