import type { PlatformId } from "@/types/app";
import { getPlatformName } from "@/data/platforms";

const platformColors: Record<PlatformId, string> = {
  android: "#3DDC84",
  "android-tv": "#7EE787",
  windows: "#58A6FF",
  web: "#A371F7",
  "lg-webos": "#E14A4A",
  "samsung-tizen": "#4AA8E1",
  apple: "#E6EDF3",
  linux: "#D29922",
};

interface PlatformBadgeProps {
  platform: PlatformId;
  size?: "sm" | "md";
}

export function PlatformBadge({ platform, size = "sm" }: PlatformBadgeProps) {
  const color = platformColors[platform];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2/80 font-medium text-secondary",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {getPlatformName(platform)}
    </span>
  );
}

export { platformColors };
