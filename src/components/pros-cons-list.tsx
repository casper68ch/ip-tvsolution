interface ProsConsListProps {
  pros: string[];
  cons: string[];
  className?: string;
}

export function ProsConsList({ pros, cons, className = "" }: ProsConsListProps) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      <section className="surface-card p-5" aria-labelledby="pros-heading">
        <h3 id="pros-heading" className="flex items-center gap-2 text-sm font-semibold text-fg">
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-[11px] text-success"
          >
            ✓
          </span>
          Punti di forza
        </h3>
        <ul className="mt-3 space-y-2">
          {pros.map((pro) => (
            <li key={pro} className="flex gap-2 text-sm leading-relaxed text-secondary">
              <span aria-hidden="true" className="mt-0.5 text-success">
                +
              </span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card p-5" aria-labelledby="cons-heading">
        <h3 id="cons-heading" className="flex items-center gap-2 text-sm font-semibold text-fg">
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/15 text-[11px] text-warning"
          >
            !
          </span>
          Limiti da conoscere
        </h3>
        <ul className="mt-3 space-y-2">
          {cons.map((con) => (
            <li key={con} className="flex gap-2 text-sm leading-relaxed text-secondary">
              <span aria-hidden="true" className="mt-0.5 text-warning">
                −
              </span>
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
