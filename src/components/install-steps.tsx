interface InstallStepsProps {
  steps: string[];
  compact?: boolean;
}

export function InstallSteps({ steps, compact = false }: InstallStepsProps) {
  return (
    <ol className={compact ? "space-y-2.5" : "space-y-3.5"}>
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3">
          <span
            aria-hidden="true"
            className={[
              "flex shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent-soft font-display font-semibold text-accent-hover",
              compact ? "h-6 w-6 text-[11px]" : "h-7 w-7 text-xs",
            ].join(" ")}
          >
            {index + 1}
          </span>
          <p className={compact ? "text-sm leading-relaxed text-secondary" : "text-sm leading-relaxed text-secondary sm:text-base"}>
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}
