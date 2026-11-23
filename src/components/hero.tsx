import Link from "next/link";
import { siteConfig } from "@/lib/site";

interface HeroProps {
  appCount: number;
  platformCount: number;
}

export function Hero({ appCount, platformCount }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(200,56,56,0.18),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(88,166,255,0.10),transparent_40%)]"
      />
      <div className="container-page relative py-14 sm:py-20">
        <div className="animate-fade-up flex flex-wrap items-center gap-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-hover">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
            {siteConfig.tagline}
          </p>
          {/* Contatore visite: badge SVG esterno, conta i caricamenti della pagina */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://visitor-badge.laobi.icu/badge?page_id=ip-tvsolution.online"
            alt="Contatore visite del sito"
            className="h-5 w-auto rounded"
            loading="lazy"
          />
        </div>

        <h1 className="mt-5 max-w-4xl text-balance font-display text-3xl leading-tight font-semibold text-fg sm:text-4xl lg:text-5xl">
          Player IPTV per Android, TV, Windows e Linux: guida all&apos;installazione
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-secondary sm:text-lg">
          Confronta {appCount} player legittimi, scegli la tua piattaforma e segui i passaggi
          ufficiali di installazione. Nessuna playlist, nessun abbonamento, nessuna credenziale:
          solo software da installare e configurare con le tue fonti autorizzate.
        </p>

        <div className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/#catalogo"
            className="tap-target inline-flex items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Sfoglia il catalogo
          </Link>
          <Link
            href="/guida/"
            className="tap-target inline-flex items-center justify-center rounded-xl border border-line bg-surface px-6 text-sm font-semibold text-fg transition hover:border-accent/50 hover:bg-surface-2"
          >
            Vai alle guide per piattaforma
          </Link>
        </div>

        <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
          {[
            { label: "Player verificati", value: String(appCount) },
            { label: "Piattaforme", value: String(platformCount) },
            { label: "Contenuti forniti", value: "0" },
          ].map((stat) => (
            <div key={stat.label} className="surface-card px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-muted">{stat.label}</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-fg">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex max-w-3xl items-start gap-3 rounded-xl border border-line bg-surface/70 p-4">
          <span aria-hidden="true" className="mt-0.5 text-warning">
            ⚠
          </span>
          <p className="text-xs leading-relaxed text-secondary sm:text-sm">
            <strong className="text-fg">Questo sito non fornisce contenuti IPTV.</strong>{" "}
            Pubblica esclusivamente informazioni sull&apos;installazione di player regolarmente
            distribuiti. Le fonti, le playlist e le credenziali restano responsabilità
            dell&apos;utente, che deve utilizzare solo servizi di cui possiede i diritti.
          </p>
        </div>
      </div>
    </section>
  );
}
