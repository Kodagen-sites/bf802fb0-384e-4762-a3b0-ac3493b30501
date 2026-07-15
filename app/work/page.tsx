import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/content/site-config";
import assetManifest from "@/content/asset-manifest.json";
import PageHero from "@/components/PageHero";
import { FadeUp, StaggerChildren } from "@/components/motion";

const img = (slot: string, fallback = ""): string =>
  ((assetManifest as any)?.images?.[slot] as string) || fallback;

export const metadata: Metadata = {
  title: `Lookbook — ${siteConfig.company.name}`,
  description: `Recent drops, collabs and pop-up moments from ${siteConfig.company.name}, shot in Lagos.`,
};

export default function LookbookPage() {
  const gallery = siteConfig.gallery;
  const work = siteConfig.work;

  return (
    <div className="bg-bg">
      <PageHero
        eyebrow="Lookbook & press"
        title={<>Shot in <span className="italic text-primary">Lagos</span>.</>}
        image={img("section-lookbook")}
        intro="Recent drops, campaign frames, collabs and pop-ups — everything you'd see if you walked into the studio on a Tuesday."
      />

      {/* Editorial gallery */}
      <section className="px-6 py-24">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {gallery.map((g, i) => (
            <FadeUp key={i} delay={(i % 3) * 0.05}>
              <div
                className={`relative overflow-hidden rounded-xl border border-white/10 group ${
                  i % 5 === 0 ? "col-span-2 aspect-[4/3]" : "aspect-[4/5]"
                }`}
              >
                <img
                  src={g.src}
                  alt={g.alt}
                  className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.25em] uppercase text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {g.alt}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* Work index — table style */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-12">
            <FadeUp>
              <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-3">
                Selected work
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="font-display text-3xl md:text-5xl text-white font-light">
                Drops, collabs, activations.
              </h2>
            </FadeUp>
          </div>

          <StaggerChildren
            staggerDelay={0.05}
            className="border-t border-white/10"
          >
            {work.map((w, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-4 py-6 border-b border-white/10 hover:bg-white/[0.02] transition-colors items-baseline"
              >
                <div className="col-span-12 md:col-span-4 font-display text-white text-lg md:text-xl">
                  {w.title}
                </div>
                <div className="col-span-6 md:col-span-3 text-white/60 text-sm">
                  {w.client}
                </div>
                <div className="col-span-6 md:col-span-3 font-mono text-[11px] tracking-wider uppercase text-white/50">
                  {w.service}
                </div>
                <div className="col-span-12 md:col-span-2 text-primary text-sm md:text-right">
                  {w.result}
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-white/5 text-center">
        <FadeUp>
          <h2 className="font-display text-3xl md:text-5xl text-white font-light mb-6 max-w-2xl mx-auto">
            Want to see what&rsquo;s currently in stock?
          </h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center min-h-[52px] px-8 py-4 rounded-full bg-primary text-bg font-display font-medium hover:brightness-110 transition-all"
          >
            Browse the shop
          </Link>
        </FadeUp>
      </section>
    </div>
  );
}
