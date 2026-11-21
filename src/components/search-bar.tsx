"use client";

import { useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      const isSlash = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey;
      const isCommandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);

      if ((isSlash && !isTyping) || isCommandK) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative">
      <label htmlFor="player-search" className="sr-only">
        Cerca un player per nome, piattaforma o funzione
      </label>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      >
        ⌕
      </span>
      <input
        ref={inputRef}
        id="player-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onChange("");
            inputRef.current?.blur();
          }
        }}
        placeholder="Cerca VLC, TiviMate, Android TV…"
        autoComplete="off"
        spellCheck={false}
        aria-describedby="player-search-hint"
        className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-24 text-sm text-fg placeholder:text-muted focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      />
      <span
        id="player-search-hint"
        className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5"
      >
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Cancella la ricerca"
            className="tap-target -mr-1 inline-flex items-center justify-center rounded-lg px-2 text-sm text-muted transition hover:text-fg"
          >
            ✕
          </button>
        ) : (
          <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-sans text-[10px] text-muted">
            /
          </kbd>
        )}
      </span>
    </div>
  );
}
