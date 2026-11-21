"use client";

import { sortOptions } from "@/lib/apps";
import type { SortKey } from "@/types/app";

interface SortSelectProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div>
      <label htmlFor="sort-select" className="sr-only">
        Ordina i risultati
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(event) => onChange(event.target.value as SortKey)}
        className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            Ordina: {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
