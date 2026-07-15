import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/content/site-config";
import assetManifest from "@/content/asset-manifest.json";
import PageHero from "@/components/PageHero";
import { FadeUp, StaggerChildren, TextReveal } from "@/components/motion";

const img = (slot: string, fallback = ""): string =>
  ((assetManifest as any)?.images?.[slot] as string) || fallback;

export const metadata: Metadata = {
  title: `About — ${siteConfig.company.name}`,
  description: siteConfig.aboutStory.slice(0, 155),
};

export default function AboutPage() {
  return (
    <div className="bg-bg">
      <PageHero
        eyebrow="Our story"
        title={siteConfig.aboutHeading}
        image={img("section-founder")}
        intro="Two designers, one seamstress, one silkscreen table on a balcony in Yaba. Three years later, still the same idea."
      />

      {/* Story column */}
      <section className="px-6 py-24 md:py-32 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <FadeUp>
            <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-6">
              The long version
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              {siteConfig.aboutStory}
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Manifesto */}
      <section
        className="px-6 py-24 md:py-32 border-t border-white/5"
        style={{ background: siteConfig.brand.primary }}
      >
        <div className="max-w-[1280px] mx-auto">
          <FadeUp>
            <div
              className="font-mono text-[11px] tracking-[0.4em] uppercase mb-6 opacity-80"
              style={{ color: siteConfig.brand.bg }}
            >
              What we tell ourselves
            </div>
          </FadeUp>
          <TextReveal
            as="h2"
            className="font-display font-light text-[56px] sm:text-[96px] md:text-[128px] leading-[0.92] tracking-tight"
            stagger={0.08}
          >
            {siteConfig.manifesto}
          </TextReveal>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-24 md:py-32 border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-14">
            <FadeUp>
              <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-4">
                What we won&rsquo;t compromise
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="font-display text-4xl md:text-6xl text-white font-light">
                Four rules.
              </h2>
            </FadeUp>
          </div>
          <StaggerChildren
            staggerDelay={0.08}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {siteConfig.values.map((v, i) => (
              <div
                key={i}
                className="border border-white/10 rounded-2xl p-8 hover:border-primary/40 transition-colors"
              >
                <div className="font-mono text-[11px] text-primary tracking-[0.3em] uppercase mb-3">
                  0{i + 1}
                </div>
                <h3 className="font-display text-2xl md:text-3xl text-white font-light mb-3">
                  {v.title}
                </h3>
                <p className="text-white/70">{v.description}</p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <StaggerChildren
            staggerDelay={0.08}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {siteConfig.stats.map((s, i) => (
              <div key={i} className="border-l-2 border-primary pl-4">
                <div className="font-display text-4xl md:text-6xl text-white font-light">
                  {s.value}
                </div>
                <div className="text-white/60 text-xs md:text-sm mt-2 font-mono uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 md:py-32 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <FadeUp>
            <h2 className="font-display text-4xl md:text-6xl text-white font-light mb-6">
              Come see what&rsquo;s in stock.
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center min-h-[52px] px-8 py-4 rounded-full bg-primary text-bg font-display font-medium hover:brightness-110 transition-all"
            >
              Shop the drops
            </Link>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
