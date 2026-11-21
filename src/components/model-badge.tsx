import type { LicenseModel } from "@/types/app";
import { licenseLabel } from "@/lib/apps";

const licenseStyles: Record<LicenseModel, string> = {
  free: "border-success/35 bg-success/10 text-success",
  freemium: "border-info/35 bg-info/10 text-info",
  paid: "border-warning/35 bg-warning/10 text-warning",
};

const licenseDots: Record<LicenseModel, string> = {
  free: "#3FB950",
  freemium: "#58A6FF",
  paid: "#D29922",
};

interface ModelBadgeProps {
  license: LicenseModel;
  size?: "sm" | "md";
}

/** Badge del "modello" di licenza: gratuito, freemium o a pagamento. */
export function ModelBadge({ license, size = "sm" }: ModelBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        licenseStyles[license],
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: licenseDots[license] }}
      />
      {licenseLabel(license)}
    </span>
  );
}
