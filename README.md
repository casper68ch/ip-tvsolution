# IP-Tv.Solution — Portale player IPTV

Portale statico in italiano per l'installazione di **player IPTV legittimi** su Android,
Android TV, Windows, web, LG webOS, Samsung Tizen, Apple e Linux.

> **Solo player. Nessun contenuto.** Il sito non ospita né distribuisce canali, playlist,
> abbonamenti o credenziali. Ogni utente configura il proprio player con fonti di cui
> possiede i diritti.

## Stack

- **Next.js 15** App Router, TypeScript strict, export statico (`output: "export"`)
- **Tailwind CSS v4** CSS-first: i token vivono in `@theme` dentro `src/app/globals.css`,
  nessun `tailwind.config.js`
- **npm** come package manager, `.nvmrc` a Node 22
- `.gitattributes` con `eol=lf` per compatibilità Windows (sviluppo) / Linux (produzione)

## Comandi

```bash
npm install
npm run dev          # sviluppo su Windows
npm run typecheck    # tsc --noEmit
npm run validate     # controlli sul catalogo
npm run build        # prebuild + next build, genera out/
npm run start        # server statico minimale su out/ (PORT, HOST)
```

La build statica finisce in `out/`: pubblicala su nginx/Apache con `trailingSlash: true`,
quindi ogni URL termina con `/`. Imposta `NEXT_PUBLIC_SITE_URL` in produzione per sitemap,
canonical e JSON-LD. `npm run lint` usa `next lint`: richiede ESLint, non incluso tra le
dipendenze per mantenere il pacchetto leggero. Il build dei font (`next/font/google`) richiede
accesso a Google Fonts la prima volta.

## Struttura

```text
src/
  app/
    layout.tsx                 metadataBase, Sora + Manrope, header/footer, skip link
    page.tsx                   hero, ricerca, filtri, griglia card
    globals.css                @theme con i token (nessun config JS)
    app/[slug]/page.tsx        scheda player, SSG, JSON-LD SoftwareApplication + Breadcrumb
    piattaforma/[platform]/    landing per piattaforma
    guida/page.tsx             manuale completo per le 8 piattaforme
    faq/page.tsx               FAQ + FAQPage JSON-LD
    note-legali/page.tsx       avvertenze e natura del servizio
    sitemap.ts robots.ts manifest.ts
  components/                  header, hero, catalogo, card, badge, modale, toast…
  data/apps.json               16 player reali con metodi di installazione
  data/platforms.ts            8 piattaforme + guide
  lib/                         apps.ts (filtri), seo.ts (metadata/JSON-LD), site.ts
  types/app.ts                 tipi del catalogo
scripts/validate-apps.mjs      validazione prebuild
public/logos/                  segnaposto SVG (nessun file multimediale)
```

## Catalogo e regole di redazione

- 16 player: VLC, Kodi, mpv, IINA, Hypnotix, TiviMate, IPTV Smarters Pro, Televizo,
  OTT Navigator, Perfect Player, ProgTV, MyIPTV Player, GSE Smart IPTV, SS IPTV,
  OttPlayer, Smart IPTV.
- Ogni voce ha `id`/`slug` lowercase, copy unica, URL `https` ufficiali e passaggi verificabili.
- **Nessun codice Downloader inventato**: se non è certo il campo è `null` e `verified: false`.
  Il componente `DownloaderCodeButton` mostra il pulsante solo quando il codice esiste.
- **Nessun punteggio aggregato** nel JSON-LD: non inventiamo valutazioni.
- **Nessun file di playlist** in `public/` (controllato dallo script di validazione).
- I loghi in `public/logos/` sono segnaposto grafici originali, non marchi registrati.

## Design token

| Token | Valore | Uso |
| --- | --- | --- |
| `bg` | `#0B0F14` | sfondo pagina |
| `surface` | `#151A21` | card e pannelli |
| `surface-2` | `#1B222B` | elementi interni |
| `line` | `#232A35` | bordi |
| `accent` / `accent-hover` | `#C83838` / `#E14A4A` | accento, CTA |
| `accent-soft` | `rgba(200,56,56,.12)` | chip attive |
| `fg` / `secondary` / `muted` | `#F2F5F8` / `#9BA6B4` / `#7C8898` | testo |
| `success` / `warning` / `info` | `#3FB950` / `#D29922` / `#58A6FF` | stati |

Font: **Sora** per titoli e **Manrope** per il testo, caricati con `next/font/google`.

## Accessibilità

- skip link, landmark espliciti, `aria-live` sul contatore dei risultati
- ricerca istantanea con `/` e `Ctrl/⌘ K`, chiusura con `Esc`
- modale guida con focus trap, `aria-modal`, blocco dello scroll e ripristino del focus
- touch target da 44px, focus ring bianco, rispetto di `prefers-reduced-motion`

## Nota legale

Marchi e nomi appartengono ai rispettivi proprietari. Il portale non fornisce assistenza per
servizi non autorizzati e non suggerisce metodi per eludere restrizioni o protezioni.
