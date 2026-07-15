import type { SiteConfig } from "@/lib/types";

export type Industry =
  | "hospitality"
  | "restaurant"
  | "beauty"
  | "fitness"
  | "medical"
  | "auto"
  | "education"
  | "construction"
  | "law"
  | "security"
  | "professional"
  | "fashion"
  | "cleaning"
  | "consulting"
  | "oilgas"
  | "travel"
  | "tech"
  | "realestate"
  | "vodi";

export type Section =
  | "hero"
  | "about"
  | "services"
  | "contact"
  | "testimonials"
  | "gallery"
  | "stats"
  | "portfolio"
  | "team"
  | "clients";

export type Feature =
  | "parallax"
  | "scroll-mosaic"
  | "typewriter"
  | "video-bg"
  | "gradient-text"
  | "animated-counter"
  | "kanban"
  | "timeline"
  | "3d-tilt"
  | "scroll-reveal"
  | "marquee";

export type Style =
  | "modern"
  | "classic"
  | "bold"
  | "elegant"
  | "editorial"
  | "technical";

export type ColorMood =
  | "dark"
  | "light"
  | "warm"
  | "cool"
  | "neon"
  | "earthy";

export type MotionLevel = "none" | "subtle" | "moderate" | "heavy";

export type Audience =
  | "b2c"
  | "b2b"
  | "luxury"
  | "mass-market"
  | "premium"
  | "budget";

export type Engine = "booking" | "catalog" | "crm" | "tickets" | "none";

export type TemplateMeta = {
  /** Must match SiteConfig["templateId"] exactly (e.g. "hospitality-v1"). */
  id: SiteConfig["templateId"];
  /** Human-readable name for admin UIs and the Design Director picker. */
  name: string;
  industry: Industry;
  version: number;

  style: Style;
  colorMood: ColorMood;
  /** Drives the self-serve "animated vs static" filter. */
  motionLevel: MotionLevel;
  /** Free-form descriptive tags for fuzzy matching. */
  vibe: string[];

  /** Sections this template actually renders. */
  sections: Section[];
  /** Optional overlays (e.g. booking, fitting, assessment modals). */
  modals?: string[];
  features: Feature[];

  /** Business types this template suits. */
  bestFor: string[];
  /** Business types this template should NOT be picked for. */
  avoidFor?: string[];
  audience?: Audience[];

  /** SiteConfig keys whose copy must be generated for this template. */
  copySlots: (keyof SiteConfig)[];
  assets: {
    heroImage: boolean;
    heroVideo?: boolean;
    galleryCount?: number;
    logoRequired?: boolean;
  };

  /** Backend binding — determines which engine migrations to run. */
  engine: Engine;
  /**
   * Sections AI is allowed to regenerate code variants of.
   * NEVER includes sections hosting engine-wired forms (e.g. booking form, cart checkout).
   * See feedback_ai_never_writes_logic.md for the pattern/variant boundary.
   */
  variantableSections: Section[];
  /**
   * Engine service names each section consumes (for the variant generator's narrow brief).
   * Optional — filled in during Phase B as engines get wired.
   */
  sectionPatterns?: Partial<Record<Section, string[]>>;

  /**
   * How the factory turns this template into a customer site.
   *
   * - "compose" (default) — scaffold generates flat subroute pages that
   *   compose the declared `sections` via home-view.tsx. Works for every
   *   template that follows the fashion-v1 flat-section convention.
   *
   * - "preview-copy" — scaffold copies the entire `src/app/preview/<id>/**`
   *   tree into the output's `src/app/**` and uses the preview's layout.tsx
   *   as the root layout. Used for premium/cinematic templates whose full
   *   experience lives in the preview pages (e.g. the 4 universal-editorial
   *   templates). The flat section files still exist for subroute
   *   generation in case the preview doesn't cover every route.
   */
  factoryMode?: "compose" | "preview-copy";
};

/**
 * Per-section metadata — enumerates every section variant a template
 * exposes (nav, hero, about, services, gallery, testimonials, contact,
 * footer) so the section director can mix-and-match across templates.
 *
 * Each template's `meta.ts` exports a `sectionMetas: SectionMeta[]`
 * alongside its main `meta: TemplateMeta`. The factory's
 * load-registry.mjs walks every template folder and unions them into
 * the SECTION_REGISTRY that pickComposition() picks from.
 */
export type SectionMeta = {
  /** Unique id within the registry, convention: `<templateId>-<slot>`. */
  id: string;
  /** templateId this section belongs to (matches a TemplateMeta.id). */
  templateId: TemplateMeta["id"];
  /** Which home-page slot this section fills. */
  type: "nav" | "hero" | "about" | "services" | "gallery" | "testimonials" | "contact" | "footer" | "stats" | "portfolio" | "team" | "clients";
  /** Import path relative to src/, WITHOUT the .tsx extension. */
  importPath: string;
  /** Human-readable name for admin UIs + Design Director rationale. */
  name: string;
  style: Style;
  colorMood: ColorMood;
  motionLevel: MotionLevel;
  vibe: string[];
  features?: Feature[];
  copySlots: string[];
  /** Optional asset requirements for this section. */
  assetNeeds?: {
    heroImage?: boolean;
    heroVideo?: boolean;
    galleryCount?: number;
  };
  engine?: Engine;
};
