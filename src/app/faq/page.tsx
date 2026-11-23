import Link from "next/link";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd, type FaqItem } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Domande frequenti su player IPTV e installazione",
  description:
    "Risposte chiare su player IPTV legittimi: differenza tra gratuiti e freemium, installazione su Fire TV, codici Downloader verificati, scadenze della Developer Mode LG e Samsung, sicurezza degli APK.",
  path: "/faq/",
  keywords: ["FAQ player IPTV", "codice Downloader", "Developer Mode LG", "APK sicuro"],
});

const faqs: FaqItem[] = [
  {
    question: "Questo sito fornisce canali, playlist o abbonamenti IPTV?",
    answer:
      "No. IP-TVSOLUTION non ospita, non vende e non distribuisce contenuti, liste di canali, abbonamenti o credenziali. Il portale pubblica esclusivamente informazioni sull'installazione di player regolarmente distribuiti dai produttori. Ogni utente configura il proprio player con fonti di cui possiede i diritti.",
  },
  {
    question: "I player del catalogo includono già dei contenuti?",
    answer:
      "No. VLC, Kodi, TiviMate e gli altri player sono programmi di riproduzione: al primo avvio la lista è vuota o contiene solo esempi pubblici. Serve una fonte configurata dall'utente, nel rispetto dei termini d'uso del servizio e della normativa vigente.",
  },
  {
    question: "Che differenza c'è tra gratuito, freemium e a pagamento?",
    answer:
      "Gratuito significa che il player è utilizzabile senza costi, spesso con codice open source. Freemium indica una versione base gratuita con funzioni avanzate a pagamento, in genere tramite acquisto in-app. A pagamento significa che serve una licenza per usare l'app, come nel caso di Smart IPTV dopo il periodo di prova.",
  },
  {
    question: "Posso installare un player su Fire TV senza Google Play?",
    answer:
      "Sì, se il produttore distribuisce un pacchetto compatibile. Il metodo documentato da Amazon usa l'app Downloader: si abilitano le app sconosciute per Downloader, si inserisce l'URL ufficiale del produttore e si installa il file. Non pubblichiamo codici Downloader non verificati: se la scheda del player non riporta un codice, usa l'indirizzo del sito ufficiale.",
  },
  {
    question: "Perché alcune schede non mostrano il codice Downloader?",
    answer:
      "Perché non abbiamo la certezza che il codice appartenga al produttore. In questi casi il campo resta vuoto e l'installazione viene indicata come da verificare. Preferiamo un'informazione mancante a un codice inventato che potrebbe portare a un pacchetto modificato.",
  },
  {
    question: "La Developer Mode di LG scade davvero?",
    answer:
      "Sì. La sessione di sviluppo dei televisori LG webOS dura circa 1000 ore e va rinnovata. Alla scadenza le app installate con ares-install possono smettere di avviarsi. Per un uso quotidiano conviene scegliere un player disponibile nel LG Content Store.",
  },
  {
    question: "Perché la procedura Samsung parla del PIN 12345?",
    answer:
      "È il PIN predefinito della Developer Mode sui televisori Samsung Tizen. Serve solo per abilitare la modalità sviluppo e collegare il TV a Tizen Studio tramite sdb. Se il firmware permette di cambiarlo, fallo, e disattiva la modalità al termine dei test.",
  },
  {
    question: "Installare un APK fuori dallo store è sicuro?",
    answer:
      "Solo se il file proviene dal dominio ufficiale del produttore e la firma è coerente con le versioni precedenti. I pacchetti modificati sono la principale fonte di malware in questo segmento: evitano controlli, includono pubblicità invasiva o rubano credenziali. Se non riesci a verificare la fonte, usa lo store ufficiale o un player alternativo.",
  },
  {
    question: "Su Windows conviene il Microsoft Store o l'installer classico?",
    answer:
      "Il Microsoft Store è più semplice e aggiorna le app automaticamente, ma offre meno player. L'installer classico dà accesso a programmi come VLC, mpv o Kodi con tutte le funzioni desktop. In entrambi i casi scarica solo dal sito del produttore e controlla la firma digitale del file.",
  },
  {
    question: "Posso usare lo stesso player su più dispositivi?",
    answer:
      "Dipende dalla licenza del player e dalla fonte che configuri. Alcuni player gratuiti non pongono limiti, altri legano la licenza al singolo dispositivo o alla famiglia. Verifica sempre le condizioni del produttore: questo portale non vende né gestisce licenze.",
  },
  {
    question: "Il sito usa cookie di profilazione o analytics?",
    answer:
      "No. Il portale è statico e non include strumenti di tracciamento pubblicitario. Le preferenze dei filtri restano nella memoria della pagina e non vengono inviate a server esterni.",
  },
  {
    question: "Come posso contattare IP-TVSOLUTION per informazioni o assistenza?",
    answer:
      "Scrivi a ip.tv-solution@tutamail.com: è l'indirizzo ufficiale per informazioni, segnalazioni e richieste di attivazione. Trovi lo stesso indirizzo anche in fondo a ogni pagina. Rispondiamo con indicazioni sull'installazione dei player e sul flusso di registrazione; ricorda che il sito non fornisce contenuti, playlist o credenziali.",
  },
];

export default function FaqPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "FAQ", path: "/faq/" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
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
                FAQ
              </li>
            </ol>
          </nav>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-accent">FAQ</p>
          <h1 className="mt-1 text-2xl font-semibold text-fg sm:text-4xl">Domande frequenti</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
            Le risposte rapide ai dubbi più comuni su player, store, sideload e limiti delle
            piattaforme televisive.
          </p>
        </div>
      </div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-14">
        <div className="min-w-0 space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className="surface-card group p-0 [&_summary::-webkit-details-marker]:hidden"
              open={index === 0}
            >
              <summary className="tap-target flex cursor-pointer list-none items-start justify-between gap-4 p-5 text-sm font-semibold text-fg">
                <span>{faq.question}</span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-muted transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="border-t border-line px-5 py-4">
                <p className="text-sm leading-relaxed text-secondary">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold text-fg">Non trovi la risposta?</h2>
            <p className="mt-2 text-xs leading-relaxed text-secondary">
              La guida per piattaforma contiene i passaggi completi, incluse le modalità
              sviluppatore di LG e Samsung.
            </p>
            <Link
              href="/guida/"
              className="tap-target mt-3 inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Apri la guida
            </Link>
          </section>

          <section className="rounded-xl border border-warning/25 bg-warning/5 p-4">
            <h2 className="text-sm font-semibold text-warning">Ricorda</h2>
            <p className="mt-2 text-xs leading-relaxed text-secondary">
              Nessun player del catalogo fornisce contenuti. Se un sito promette canali inclusi
              nell&apos;app, non è un player legittimo: è un servizio non autorizzato.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
