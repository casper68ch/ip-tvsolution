import type { MetadataRoute } from "next";
import { platforms } from "@/data/platforms";
import { apps } from "@/lib/apps";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-21");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/guida/"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/faq/"), lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/note-legali/"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];

  const platformRoutes: MetadataRoute.Sitemap = platforms.map((platform) => ({
    url: absoluteUrl(`/piattaforma/${platform.slug}/`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const appRoutes: MetadataRoute.Sitemap = apps.map((app) => ({
    url: absoluteUrl(`/app/${app.slug}/`),
    lastModified: new Date(app.verifiedAt ?? "2026-11-21"),
    changeFrequency: "monthly",
    priority: app.featured ? 0.7 : 0.5,
  }));

  return [...staticRoutes, ...platformRoutes, ...appRoutes];
}
