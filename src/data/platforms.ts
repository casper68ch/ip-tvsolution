import type { PlatformId, PlatformMeta } from "@/types/app";

/**
 * Le otto piattaforme coperte dal portale.
 * Le guide spiegano solo metodi di installazione ufficiali o documentati dal
 * produttore: nessuna fonte di contenuti viene suggerita o distribuita.
 */
export const platforms: PlatformMeta[] = [
  {
    id: "android",
    name: "Android",
    shortName: "Android",
    slug: "android",
    tagline: "Smartphone, tablet e box TV con Google Play.",
    description:
      "Android è la piattaforma più diffusa per i player IPTV: gli store ufficiali distribuiscono le app firmate dagli sviluppatori e gli aggiornamenti arrivano automaticamente. Quando un'app non è presente sul Play Store si installa il pacchetto APK pubblicato dal produttore, verificando sempre firma e provenienza. Questa sezione raccoglie i passaggi comuni a smartphone, tablet e dispositivi Android TV, comprese le TV box e i dispositivi Fire TV che usano il sistema Amazon.",
    devices: ["Smartphone Android", "Tablet Android", "TV box Android", "Fire TV Stick"],
    guide: [
      {
        title: "Installare un player da Google Play",
        intro:
          "È il metodo più sicuro: l'app è firmata, verificata e si aggiorna da sola. Prima di installare controlla sempre il nome dello sviluppatore nella scheda dello store.",
        steps: [
          "Apri Google Play sul dispositivo e cerca il nome del player.",
          "Confronta sviluppatore, icona e numero di download con la scheda presente sul sito ufficiale del produttore.",
          "Tocca Installa e attendi il completamento del download.",
          "Apri l'app e inserisci la fonte personale legittima nella sezione di configurazione.",
          "Concedi solo i permessi strettamente necessari alla riproduzione e alla rete locale."
        ],
        note:
          "Se l'app richiede l'accesso a foto o rubrica per funzionare, è un segnale sospetto: verifica la scheda dello store."
      },
      {
        title: "Installare un APK dal sito del produttore",
        intro:
          "Alcuni player non sono distribuiti su Google Play. In quel caso si scarica l'APK esclusivamente dal dominio ufficiale indicato nella scheda del player.",
        steps: [
          "Apri il browser del dispositivo e vai sul sito ufficiale del player.",
          "Scarica il file APK dalla sezione download, evitando mirror e portali di terze parti.",
          "Apri Impostazioni, Sicurezza e abilita temporaneamente l'installazione da origini sconosciute per il browser.",
          "Apri il file scaricato e conferma l'installazione.",
          "Disabilita di nuovo l'opzione origini sconosciute al termine."
        ],
        note:
          "Le app installate fuori dallo store non ricevono aggiornamenti automatici: controlla periodicamente il sito del produttore."
      },
      {
        title: "Fire TV: installazione tramite Downloader",
        intro:
          "I dispositivi Fire TV non hanno Google Play. Il metodo documentato da Amazon usa l'app Downloader per aprire l'indirizzo ufficiale del produttore e scaricare il pacchetto.",
        steps: [
          "Dal Fire TV apri Impostazioni, My Fire TV, Opzioni sviluppatore e abilita Installa app sconosciute per Downloader.",
          "Installa Downloader dallo store Amazon e avvialo.",
          "Digita nel campo URL l'indirizzo ufficiale del produttore del player, non un codice di terzi non verificato.",
          "Attendi il download e conferma l'installazione del pacchetto.",
          "Elimina il file scaricato dopo l'installazione per liberare spazio."
        ],
        note:
          "Non pubblichiamo codici Downloader non verificati: se la scheda del player non riporta un codice, usa l'URL ufficiale del produttore."
      }
    ]
  },
  {
    id: "android-tv",
    name: "Android TV",
    shortName: "Android TV",
    slug: "android-tv",
    tagline: "Interfaccia da salotto, telecomando e Google TV.",
    description:
      "Android TV e Google TV portano le app Android sul televisore con un'interfaccia pensata per il telecomando. L'installazione passa dal Play Store integrato oppure, sui modelli che non lo espongono, dal pacchetto APK ufficiale trasferito via USB o rete locale. I player ottimizzati per la TV gestiscono D-pad, guida programmi e tasti multimediali; le app pensate per il touch possono risultare scomode. Verifica sempre la compatibilità dichiarata dal produttore con la versione di Android TV del tuo dispositivo.",
    devices: ["Android TV", "Google TV", "Nvidia Shield", "Chromecast con Google TV"],
    guide: [
      {
        title: "Installare dal Play Store del televisore",
        steps: [
          "Dal launcher apri l'app Google Play.",
          "Cerca il player con la barra di ricerca usando il telecomando.",
          "Apri la scheda, verifica lo sviluppatore e seleziona Installa.",
          "Avvia l'app dal launcher e completa la configurazione guidata.",
          "Imposta la lingua italiana e la dimensione dei caratteri nelle preferenze."
        ],
        "note": "Su Google TV il Play Store si trova nella riga delle app o nel menu del profilo."
      },
      {
        title: "Installare un APK su Android TV",
        steps: [
          "Scarica l'APK ufficiale sul computer dal sito del produttore.",
          "Copialo su una chiavetta USB o invialo al TV con un'app di trasferimento file.",
          "Installa un file manager dal Play Store del televisore.",
          "Apri il file APK dal file manager e conferma l'installazione.",
          "Revoca il permesso di installazione da origini sconosciute al file manager al termine."
        ],
        "note": "Alcuni firmware bloccano l'installazione di APK: in quel caso l'unica via è lo store del produttore."
      }
    ]
  },
  {
    id: "windows",
    name: "Windows",
    shortName: "Windows",
    slug: "windows",
    tagline: "PC e HTPC con installer classici o Microsoft Store.",
    description:
      "Su Windows convivono tre canali di installazione: Microsoft Store per le app firmate e aggiornate dal sistema, installer EXE/MSI dal sito del produttore per i programmi desktop classici e winget per chi preferisce la riga di comando. Un HTPC collegato al televisore trae vantaggio dai player con interfaccia a schermo intero e supporto ai tasti multimediali. Evita i bundle scaricati da portali di download: contengono spesso adware e toolbar non richieste.",
    devices: ["Desktop Windows", "Notebook", "HTPC", "Mini PC"],
    guide: [
      {
        title: "Installare dal Microsoft Store",
        steps: [
          "Apri Microsoft Store e cerca il nome del player.",
          "Verifica lo sviluppatore indicato nella scheda del prodotto.",
          "Seleziona Installa e attendi il completamento.",
          "Avvia l'app dal menu Start e configura la fonte personale.",
          "Controlla gli aggiornamenti automatici nelle impostazioni dello Store."
        ],
        "note": "Le app dello Store non richiedono permessi di amministratore e si disinstallano dalla pagina App installate."
      },
      {
        title: "Installare un programma desktop (EXE)",
        steps: [
          "Scarica l'installer dal sito ufficiale del produttore, preferendo la versione a 64 bit.",
          "Fai clic con il tasto destro sul file, apri Proprietà e verifica la firma digitale nella scheda Dettagli.",
          "Avvia l'installer e completa la procedura, rifiutando componenti aggiuntivi non richiesti.",
          "Apri il player e inserisci la fonte legittima nella finestra di configurazione.",
          "Crea un collegamento sul desktop o aggiungi l'app all'avvio automatico se la usi come HTPC."
        ],
        "note": "Se Windows SmartScreen blocca un installer ufficiale e firmato, controlla prima l'hash pubblicato dal produttore."
      },
      {
        title: "Installare con winget",
        intro: "Winget è il gestore pacchetti integrato in Windows 10 e 11: installa e aggiorna i programmi da riga di comando.",
        steps: [
          "Apri PowerShell senza privilegi di amministratore.",
          "Cerca il pacchetto con winget search seguito dal nome del player.",
          "Verifica che l'ID corrisponda a quello pubblicato dal produttore.",
          "Esegui winget install con l'ID individuato.",
          "Aggiorna in futuro con winget upgrade."
        ],
        "note": "Winget attinge a un repository della comunità: confronta sempre l'ID con la documentazione ufficiale."
      }
    ]
  },
  {
    id: "web",
    name: "Web",
    shortName: "Web",
    slug: "web",
    tagline: "Browser e PWA, senza installare nulla.",
    description:
      "I player web funzionano in Chrome, Edge, Safari e Firefox recenti senza installazione. Sono utili su computer condivisi, su Chromebook e come alternativa quando lo store del dispositivo non è disponibile. Le web app possono essere installate come PWA dal browser, ottenendo un'icona e una finestra dedicata. La riproduzione dipende dal supporto del browser ai codec: se un flusso non parte, prova un altro browser prima di cambiare player.",
    devices: ["Chrome", "Edge", "Safari", "Firefox", "Chromebook"],
    guide: [
      {
        title: "Usare un player nel browser",
        steps: [
          "Apri il sito ufficiale del player nel browser.",
          "Accedi con le credenziali del servizio o inserisci la fonte personale dove previsto.",
          "Consenti la riproduzione audio con un clic, come richiesto dalle policy dei browser.",
          "Aggiungi il sito ai preferiti per ritrovarlo rapidamente.",
          "Se il video scatta, disattiva l'accelerazione hardware o prova un altro browser."
        ],
        "note": "I browser bloccano i contenuti misti: usa sempre indirizzi HTTPS ufficiali."
      },
      {
        title: "Installare la web app come PWA",
        steps: [
          "Apri il player nel browser.",
          "Nel menu del browser scegli Installa app o Aggiungi alla schermata Home.",
          "Conferma il nome e l'icona proposti.",
          "Avvia la PWA dalla scrivania o dal launcher: si apre in una finestra dedicata."
        ],
        "note": "La PWA non è disponibile se il sito non espone un manifest valido: in quel caso resta un normale segnalibro."
      }
    ]
  },
  {
    id: "lg-webos",
    name: "LG webOS",
    shortName: "LG webOS",
    slug: "lg-webos",
    tagline: "App native dal Content Store o installazione in Developer Mode.",
    description:
      "I televisori LG con webOS installano le app dal Content Store. Per i player non pubblicati nello store, LG documenta la Developer Mode: si abilita dalle impostazioni, si collega il TV a una rete e si installa il pacchetto IPK con gli strumenti webOS CLI. La sessione di sviluppo dura circa 1000 ore e va rinnovata periodicamente: è un ambiente pensato per test e sviluppo, non per un uso domestico stabile. Le app in Developer Mode possono scadere e smettere di funzionare, quindi valuta sempre le alternative presenti nello store ufficiale.",
    devices: ["TV LG webOS 3.0+", "TV LG OLED", "TV LG NanoCell"],
    guide: [
      {
        title: "Installare dal LG Content Store",
        steps: [
          "Premi il tasto Home sul telecomando e apri LG Content Store.",
          "Cerca il nome del player nella sezione App.",
          "Apri la scheda e seleziona Installa.",
          "Avvia l'app e completa la configurazione con il telecomando.",
          "Verifica nelle impostazioni del TV che l'app abbia accesso alla rete."
        ],
        "note": "La disponibilità delle app varia per paese e anno del modello."
      },
      {
        title: "Developer Mode e installazione di un pacchetto IPK",
        intro:
          "Procedura documentata da LG per sviluppatori: richiede un account LG Developer, la Developer Mode attiva sul TV e gli strumenti webOS CLI sul computer.",
        steps: [
          "Sul televisore apri LG Content Store, cerca l'app Developer Mode e installala.",
          "Avvia Developer Mode, accedi con l'account LG Developer e attiva la modalità con riavvio.",
          "Installa sul computer la webOS CLI seguendo la documentazione ufficiale LG.",
          "Collega TV e computer alla stessa rete e registra il dispositivo con ares-setup-device.",
          "Installa il pacchetto con ares-install nome-pacchetto.ipk scegliendo il device corretto.",
          "Avvia l'app dal launcher del televisore e verifica la riproduzione."
        ],
        "note":
          "La sessione Developer Mode dura circa 1000 ore e va rinnovata: le app installate in questo modo possono smettere di funzionare alla scadenza."
      }
    ]
  },
  {
    id: "samsung-tizen",
    name: "Samsung Tizen",
    shortName: "Samsung",
    slug: "samsung-tizen",
    tagline: "Samsung Apps, Developer Mode con PIN e pacchetti WGT.",
    description:
      "Sui televisori Samsung l'installazione ordinaria avviene da Samsung Apps. Per i player fuori store Samsung documenta la Developer Mode: si attiva dalla schermata App, si inserisce il PIN di sviluppo e si collega il TV a Tizen Studio via sdb. Il pacchetto WGT si installa dalla toolchain ufficiale dopo aver autorizzato il computer sul televisore. Come su LG, la modalità sviluppo è pensata per test e può essere disattivata dagli aggiornamenti firmware: verifica sempre che l'app sia disponibile anche nello store ufficiale.",
    devices: ["TV Samsung Tizen 2015+", "Serie QLED", "The Frame", "Serie Crystal UHD"],
    guide: [
      {
        title: "Installare da Samsung Apps",
        steps: [
          "Premi Home e apri l'app Samsung Apps.",
          "Cerca il nome del player e apri la scheda.",
          "Seleziona Installa e attendi il completamento.",
          "Avvia l'app dal launcher e inserisci la fonte personale.",
          "Controlla l'accesso alla rete nelle impostazioni del televisore."
        ],
        "note": "La disponibilità varia per paese, anno e modello: verifica prima dell'acquisto."
      },
      {
        title: "Developer Mode, sdb e installazione di un pacchetto WGT",
        intro:
          "Procedura riservata allo sviluppo, documentata da Samsung. Richiede Tizen Studio, il collegamento sdb e l'autorizzazione del computer sul televisore.",
        steps: [
          "Sul TV apri Samsung Apps, seleziona App personali e attiva Developer mode inserendo il PIN 12345.",
          "Riavvia il televisore e annota l'indirizzo IP mostrato nella schermata delle informazioni.",
          "Sul computer avvia Tizen Studio e apri Device Manager.",
          "Aggiungi il TV come dispositivo con sdb connect seguito dall'indirizzo IP.",
          "Conferma sul televisore la richiesta di autorizzazione del computer.",
          "Installa il pacchetto con sdb install percorso-del-file.wgt.",
          "Avvia l'app dal launcher e verifica la riproduzione."
        ],
        "note":
          "Il PIN 12345 è il valore predefinito della Developer Mode: cambialo se il firmware lo consente e disattiva la modalità al termine dei test."
      }
    ]
  },
  {
    id: "apple",
    name: "Apple",
    shortName: "Apple",
    slug: "apple",
    tagline: "iPhone, iPad, Apple TV e Mac.",
    description:
      "Su iPhone, iPad e Apple TV i player si installano dall'App Store; le versioni in prova si distribuiscono tramite TestFlight. Su Mac si aggiungono i pacchetti DMG firmati e notarizzati oppure Homebrew. Apple applica controlli stringenti: le app che promettono contenuti non autorizzati vengono rimosse, quindi conviene diffidare dei profili di configurazione che promettono app fuori store. Per l'uso IPTV legittimo scegli player presenti sull'App Store o distribuiti con TestFlight dal produttore.",
    devices: ["iPhone", "iPad", "Apple TV", "Mac"],
    guide: [
      {
        title: "Installare dall'App Store",
        steps: [
          "Apri l'App Store e cerca il nome del player.",
          "Controlla lo sviluppatore e le valutazioni della scheda.",
          "Tocca Ottieni o il prezzo indicato e conferma con Face ID o password.",
          "Apri l'app e inserisci la fonte personale legittima.",
          "Attiva gli aggiornamenti automatici per ricevere le correzioni di sicurezza."
        ],
        "note": "Se l'app non è più disponibile, significa che è stata rimossa: non cercare versioni alternative fuori dallo store."
      },
      {
        "title": "TestFlight per le versioni in prova",
        steps: [
          "Installa TestFlight dall'App Store.",
          "Apri il link di invito pubblicato dal produttore del player.",
          "Accetta l'invito e installa la build di prova.",
          "Segnala eventuali problemi direttamente da TestFlight."
        ],
        "note": "Le build TestFlight scadono dopo un periodo limitato: non sono una soluzione permanente."
      },
      {
        "title": "Installare un DMG notarizzato su Mac",
        steps: [
          "Scarica il DMG dal sito ufficiale del produttore.",
          "Apri l'immagine e trascina l'app nella cartella Applicazioni.",
          "Al primo avvio verifica in Impostazioni di Sistema, Privacy e sicurezza che l'app sia notarizzata.",
          "Apri il flusso dal menu File, voce Apri URL.",
          "Abilita gli aggiornamenti automatici se previsti dall'app."
        ],
        "note": "Non aggirare Gatekeeper con comandi forzati: un'app non notarizzata va considerata non sicura."
      }
    ]
  },
  {
    id: "linux",
    name: "Linux",
    shortName: "Linux",
    slug: "linux",
    tagline: "Flatpak, Snap, AppImage e repository della distribuzione.",
    description:
      "Su Linux l'installazione segue i canali della distribuzione: Flatpak e Snap isolano le applicazioni e semplificano gli aggiornamenti, i repository ufficiali garantiscono pacchetti firmati, mentre AppImage offre un eseguibile portatile senza installazione. I player IPTV disponibili sono per lo più open source e si integrano con ambienti GTK e KDE. Preferisci sempre Flatpak o i repository della tua distribuzione: gli script scaricati da forum e blog sono difficili da verificare e possono richiedere privilegi eccessivi.",
    devices: ["Ubuntu", "Fedora", "Debian", "Linux Mint", "Arch Linux"],
    guide: [
      {
        title: "Installare con Flatpak",
        steps: [
          "Installa Flatpak con il gestore pacchetti della distribuzione.",
          "Abilita Flathub con il comando indicato sul sito ufficiale.",
          "Cerca il player su Flathub e copia il comando di installazione.",
          "Esegui flatpak install flathub seguito dall'identificativo dell'app.",
          "Avvia il player dal menu applicazioni e configura la fonte personale."
        ],
        "note": "Con flatpak update mantieni aggiornati player e runtime."
      },
      {
        "title": "Installare con Snap",
        steps: [
          "Verifica che snapd sia installato e attivo.",
          "Cerca il player con snap find seguito dal nome.",
          "Installa con sudo snap install nome-pacchetto.",
          "Avvia l'app dal menu e completa la configurazione.",
          "Controlla i permessi con snap connections se l'app non accede alla rete."
        ],
        "note": "Non tutte le distribuzioni includono snapd: su Fedora e Arch è spesso necessario abilitarlo."
      },
      {
        "title": "Usare un AppImage",
        steps: [
          "Scarica l'AppImage dalla pagina release ufficiale del progetto.",
          "Rendilo eseguibile con chmod +x nome-file.AppImage.",
          "Avvialo con doppio clic o da terminale.",
          "Se mancano librerie, installa i pacchetti indicati dal messaggio di errore.",
          "Crea un file .desktop per integrarlo nel menu applicazioni."
        ],
        "note": "Gli AppImage non si aggiornano da soli: scarica una nuova versione quando il progetto la pubblica."
      }
    ]
  }
];

export const platformMap = new Map<PlatformId, PlatformMeta>(
  platforms.map((platform) => [platform.id, platform])
);

export function getPlatform(id: PlatformId): PlatformMeta | undefined {
  return platformMap.get(id);
}

export function getPlatformBySlug(slug: string): PlatformMeta | undefined {
  return platforms.find((platform) => platform.slug === slug);
}

export function getPlatformName(id: PlatformId): string {
  return platformMap.get(id)?.name ?? id;
}
