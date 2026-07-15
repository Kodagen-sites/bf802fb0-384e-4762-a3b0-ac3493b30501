import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/content/site-config";
import assetManifest from "@/content/asset-manifest.json";
import PageHero from "@/components/PageHero";
import { FadeUp, StaggerChildren } from "@/components/motion";

const img = (slot: string, fallback = ""): string =>
  ((assetManifest as any)?.images?.[slot] as string) || fallback;

export const metadata: Metadata = {
  title: `Shop — ${siteConfig.company.name}`,
  description: `Browse every current drop from ${siteConfig.company.name}. Streetwear, denim, dresses, caps and limited pieces shipped from Lagos.`,
};

export default function ShopPage() {
  const products = siteConfig.products;
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="bg-bg">
      <PageHero
        eyebrow="Everything in stock"
        title={<>All drops. <span className="italic text-primary">One page.</span></>}
        image={img("section-drops")}
        intro="Every piece cut, sewn and screened in Lagos. Filter by collection above or scroll the full grid."
      />

      {/* Category chips */}
      <section className="px-6 py-8 border-b border-white/5 sticky top-16 z-30 bg-bg/85 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto flex gap-2 md:gap-3 overflow-x-auto no-scrollbar">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase px-4 py-2 rounded-full border border-primary text-primary bg-primary/10">
            All ({products.length})
          </span>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/services/${c}`}
              className="font-mono text-[10px] tracking-[0.3em] uppercase px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-colors whitespace-nowrap"
            >
              {c.replace("-", " ")}
            </Link>
          ))}
        </div>
      </section>

      {/* Product grid */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto">
          <StaggerChildren
            staggerDelay={0.06}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {products.map((p) => (
              <Link key={p.slug} href={`/shop/${p.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] mb-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700"
                  />
                  <div className="absolute top-3 left-3 font-mono text-[9px] tracking-[0.3em] uppercase text-white/70 bg-bg/60 backdrop-blur-md px-2 py-1 rounded">
                    {p.category.replace("-", " ")}
                  </div>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className="font-display text-white text-sm md:text-lg group-hover:text-primary transition-colors leading-tight">
                    {p.name}
                  </h3>
                  <div className="font-mono text-xs text-white/70 whitespace-nowrap">
                    ₦{p.price.toLocaleString()}
                  </div>
                </div>
                <div className="mt-1 font-mono text-[10px] text-white/40 uppercase tracking-wider">
                  {p.sizes.length > 1 ? `${p.sizes.length} sizes` : p.sizes[0]}
                </div>
              </Link>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {siteConfig.whyUs.items.map((it, i) => (
            <FadeUp key={i} delay={i * 0.05}>
              <div className="border-l-2 border-primary pl-4">
                <div className="font-display text-white text-lg mb-1">{it.title}</div>
                <div className="text-white/60 text-sm">{it.description}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>
    </div>
  );
}
