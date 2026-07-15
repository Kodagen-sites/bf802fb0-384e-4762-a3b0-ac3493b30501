import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.seo.siteUrl.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = ["", "/about", "/shop", "/services", "/work", "/contact", "/privacy", "/terms"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: (path === "" || path === "/shop" ? "daily" : "weekly") as
        | "daily"
        | "weekly",
      priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.7,
    })
  );

  const productRoutes = siteConfig.products.map((p) => ({
    url: `${base}/shop/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const collectionRoutes = siteConfig.services.map((s) => ({
    url: `${base}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...collectionRoutes];
}
