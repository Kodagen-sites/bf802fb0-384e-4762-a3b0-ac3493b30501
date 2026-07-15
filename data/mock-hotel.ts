import { siteConfig } from "@/content/site-config";
import assetManifest from "@/content/asset-manifest.json";

const heroImg =
  (assetManifest as { images?: Record<string, string> })?.images?.["section-hero"] ?? "";

export const mockHotelConfig = {
  businessName: siteConfig.company.name,
  hero: {
    backgroundImage: heroImg,
  },
  theme: {
    primaryColor: siteConfig.brand.primary,
    accentColor: siteConfig.brand.accent,
    fontHeading: siteConfig.typography.display,
  },
};
