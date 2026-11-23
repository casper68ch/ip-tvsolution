import type { Metadata } from "next";
import { getPlatformName } from "@/data/platforms";
import { siteConfig, absoluteUrl } from "@/lib/site";
import type { AppRecord } from "@/types/app";

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  noIndex?: boolean;
}

/** Immagine condivisa Open Graph/Twitter (1200x630) generata per il dominio ufficiale. */
const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "IP-TVSOLUTION — Solo player IPTV, nessun contenuto",
};

/** Metadata Open Graph/Twitter coerenti per tutte le pagine statiche. */
export function buildMetadata({
  title,
  description,
  path,
  keywords = [],
  type = "website",
  noIndex = false,
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: { canonical: path },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: siteConfig.twitter,
      images: [OG_IMAGE.url],
    },
  };
}

/** JSON-LD SoftwareApplication: nessuna valutazione aggregata, nessun contenuto inventato. */
export function softwareApplicationJsonLd(app: AppRecord) {
  const free = app.licenseModel === "free";
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": absoluteUrl(`/app/${app.slug}/#software`),
    name: app.name,
    description: app.description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: app.platforms.map((platform) => getPlatformName(platform)).join(", "),
    url: absoluteUrl(`/app/${app.slug}/`),
    downloadUrl: app.officialUrl,
    ...(free
      ? {
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: app.officialUrl,
          },
        }
      : {}),
    ...(app.developer
      ? {
          author: { "@type": "Organization", name: app.developer },
          publisher: { "@type": "Organization", name: app.developer },
        }
      : {}),
    inLanguage: "it-IT",
    isAccessibleForFree: free,
    ...(app.features?.length ? { featureList: app.features } : {}),
    ...(app.requirements?.length ? { softwareRequirements: app.requirements.join("; ") } : {}),
    ...(app.version ? { softwareVersion: app.version } : {}),
    image: absoluteUrl(app.logo.src),
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "it-IT",
    description: siteConfig.description,
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

/** Organization con contatto e logo: rafforza l'entità del sito nei risultati di ricerca. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.email,
    logo: absoluteUrl("/logos/iptv-solution-text.svg"),
  };
}

export function itemListJsonLd(
  items: { name: string; path: string }[],
  name = "Catalogo player IPTV"
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}
