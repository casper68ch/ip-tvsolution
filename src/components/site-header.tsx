"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/site";

const navItems = [
  { label: "Catalogo", href: "/#catalogo" },
  { label: "Piattaforme", href: "/#piattaforme" },
  { label: "Guida", href: "/guida/" },
  { label: "FAQ", href: "/faq/" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={[
        "sticky top-0 z-50 border-b border-line/80 backdrop-blur-xl transition-colors",
        scrolled ? "bg-bg/90" : "bg-bg/70",
      ].join(" ")}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          aria-label={`${siteConfig.name} — home`}
        >
          <img
            src="/logos/iptv-solution-text.svg"
            alt=""
            aria-hidden="true"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav aria-label="Navigazione principale" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="tap-target inline-flex items-center rounded-lg px-3 text-sm font-medium text-secondary transition hover:bg-surface hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/#catalogo"
            className="tap-target inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-secondary transition hover:border-accent/50 hover:text-fg"
          >
            <span aria-hidden="true">⌕</span>
            Cerca un player
            <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-sans text-[10px] text-muted">
              Ctrl K
            </kbd>
          </Link>
          <Link
            href="/guida/"
            className="tap-target inline-flex items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Guida installazione
          </Link>
        </div>

        <button
          type="button"
          className="tap-target inline-flex items-center justify-center rounded-lg border border-line bg-surface px-3 text-secondary md:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true" className="text-lg">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </div>

      <div
        id="menu-mobile"
        hidden={!open}
        className="border-t border-line bg-surface/95 md:hidden"
      >
        <nav aria-label="Navigazione mobile" className="container-page flex flex-col py-3">
          {[...navItems, { label: "Note legali", href: "/note-legali/" }].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="tap-target flex items-center rounded-lg px-2 text-sm font-medium text-secondary transition hover:bg-surface-2 hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/guida/"
            onClick={() => setOpen(false)}
            className="tap-target mt-2 inline-flex items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white"
          >
            Guida installazione
          </Link>
        </nav>
      </div>
    </header>
  );
}
