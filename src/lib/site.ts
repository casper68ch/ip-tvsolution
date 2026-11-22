import type { Metadata } from "next";

export const siteConfig = {
  name: "IP-Tv.Solution",
  shortName: "IP-Tv.Solution",
  legalName: "IP-Tv.Solution",
  tagline: "Solo player. Nessun contenuto.",
  description:
    "Portale italiano dedicato all'installazione di player IPTV legittimi su Android, Android TV, Windows, web, LG webOS, Samsung Tizen, Apple e Linux. Guide verificate, nessun contenuto e nessuna playlist.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ip-tvsolution.online").replace(/\/+$/, ""),
  locale: "it_IT",
  lang: "it",
  email: "ip.tv-solution@tutamail.com",
  twitter: "@iptvsolution",
  keywords: [
    "player IPTV",
    "installare player IPTV",
    "IPTV Android TV",
    "IPTV Windows",
    "LG webOS IPTV",
    "Samsung Tizen IPTV",
    "Linux IPTV",
    "guida installazione player",
  ],
  nav: [
    { label: "Catalogo", href: "/#catalogo" },
    { label: "Piattaforme", href: "/#piattaforme" },
    { label: "Guida", href: "/guida/" },
    { label: "FAQ", href: "/faq/" },
    { label: "Note legali", href: "/note-legali/" },
  ],
  disclaimer:
    "IP-Tv.Solution non fornisce, ospita né distribuisce contenuti, playlist, abbonamenti o credenziali IPTV. Il sito pubblica esclusivamente informazioni sull'installazione di player legittimi: ogni utente configura il proprio player con fonti di cui possiede i diritti.",
} as const;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function staticMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    ...overrides,
  };
}
