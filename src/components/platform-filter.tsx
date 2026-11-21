"use client";

import { platforms } from "@/data/platforms";
import type { PlatformFilterValue } from "@/types/app";

interface PlatformFilterProps {
  value: PlatformFilterValue;
  onChange: (value: PlatformFilterValue) => void;
  counts: Record<string, number>;
}

const baseChip =
  "tap-target inline-flex items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-white sm:text-sm";

export function PlatformFilter({ value, onChange, counts }: PlatformFilterProps) {
  const options: { id: PlatformFilterValue; label: string }[] = [
    { id: "all", label: "Tutte" },
    ...platforms.map((platform) => ({ id: platform.id as PlatformFilterValue, label: platform.shortName })),
  ];

  return (
    <div role="group" aria-label="Filtra per piattaforma" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.id;
        const count = counts[option.id] ?? 0;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={[
              baseChip,
              active
                ? "border-accent/60 bg-accent-soft text-accent-hover"
                : "border-line bg-surface text-secondary hover:border-accent/40 hover:text-fg",
            ].join(" ")}
          >
            {option.label}
            <span
              className={[
                "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                active ? "bg-accent/20 text-accent-hover" : "bg-surface-2 text-muted",
              ].join(" ")}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
