"use client";

import { licenseOptions } from "@/lib/apps";
import type { LicenseFilterValue } from "@/types/app";

interface ModelFilterProps {
  value: LicenseFilterValue;
  onChange: (value: LicenseFilterValue) => void;
}

/** Filtro "modello": gratuito, freemium o a pagamento. */
export function ModelFilter({ value, onChange }: ModelFilterProps) {
  return (
    <div>
      <label htmlFor="model-filter" className="sr-only">
        Filtra per modello di licenza
      </label>
      <select
        id="model-filter"
        value={value}
        onChange={(event) => onChange(event.target.value as LicenseFilterValue)}
        className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
      >
        <option value="all">Tutti i modelli</option>
        {licenseOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
