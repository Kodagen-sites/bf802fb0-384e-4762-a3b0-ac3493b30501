import Link from "next/link";
import { siteConfig } from "@/content/site-config";
import assetManifest from "@/content/asset-manifest.json";
import { getSiteContent } from "@/lib/site-content";
import {
  FadeUp,
  StaggerChildren,
  TextReveal,
  ImageRevealMask,
  MagneticButton,
  Marquee,
} from "@/components/motion";

const img = (slot: string, fallback = ""): string =>
  ((assetManifest as any)?.images?.[slot] as string) || fallback;

export default async function Home() {
  // Blend baked siteConfig with any CMS overrides written from /admin/content.
  // Failure returns null and pages render the static copy unchanged.
  await getSiteContent();

  return (
    <div className="relative">
      <HeroSection />
      <MarqueeStrip />
      <LookbookFeature />
      <BigTypeManifesto />
      <FeaturedDrops />
      <CollectionsGrid />
      <StoryStrip />
      <FinalCTA />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[100svh] bg-bg flex items-end px-6 pb-16 md:pb-24 overflow-hidden">
      <img
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        src={siteConfig.scrollHero.imageUrl}
        alt=""
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-bg/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg/60 via-transparent to-transparent" />

      <div className="relative max-w-[1280px] mx-auto w-full">
        <div className="font-mono text-[11px] tracking-[0.4em] text-primary uppercase mb-6">
          {siteConfig.company.tagline}
        </div>
        <h1 className="font-display text-6xl md:text-8xl lg:text-[10rem] font-light leading-[0.9] text-white max-w-[14ch]">
          {siteConfig.hero.h1.map((line, i) => (
            <span
              key={i}
              className={`block ${line.accent ? "italic text-primary" : ""}`}
            >
              {line.text}
            </span>
          ))}
        </h1>
        <p className="mt-8 text-base md:text-lg text-white/80 max-w-xl">
          {siteConfig.company.description}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <MagneticButton
            as="a"
            href="/shop"
            className="min-h-[52px] px-8 py-4 rounded-full bg-primary text-bg font-display font-medium text-sm hover:brightness-110 transition-all"
          >
            {siteConfig.cta.primary}
          </MagneticButton>
          <Link
            href="/services"
            className="min-h-[52px] px-8 py-4 rounded-full border border-white/20 bg-white/5 text-white font-display font-medium text-sm backdrop-blur-md hover:bg-white/10 inline-flex items-center justify-center"
          >
            {siteConfig.cta.secondary}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 font-mono text-[10px] tracking-[0.4em] text-white/60 uppercase">
        Est. Yaba · 2022
      </div>
    </section>
  );
}

function MarqueeStrip() {
  const items = siteConfig.trustBar;
  return (
    <section className="border-y border-white/10 bg-bg py-4 overflow-hidden">
      <Marquee speed={40}>
        <div className="flex items-center gap-12 font-mono text-[11px] tracking-[0.3em] text-white/60 uppercase pr-12">
          {items.concat(items).map((item, i) => (
            <span key={i} className="flex items-center gap-12">
              <span className="w-1 h-1 rounded-full bg-primary" />
              {item}
            </span>
          ))}
        </div>
      </Marquee>
    </section>
  );
}

function LookbookFeature() {
  return (
    <section className="relative bg-bg py-24 md:py-32 px-6 border-t border-white/5 overflow-hidden">
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div>
          <FadeUp>
            <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-4">
              The Studio
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="font-display text-4xl md:text-6xl text-white font-light leading-[1.02] mb-6">
              {siteConfig.aboutHeading}
            </h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-lg text-white/70 leading-relaxed mb-8">
              {siteConfig.aboutStory.split(". ").slice(0, 2).join(". ") + "."}
            </p>
          </FadeUp>
          <StaggerChildren staggerDelay={0.08} initialDelay={0.3} className="space-y-3 mb-8">
            {siteConfig.features.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                <div>
                  <div className="font-display text-white text-sm">{f.title}</div>
                  <div className="text-white/60 text-sm mt-0.5">{f.description}</div>
                </div>
              </div>
            ))}
          </StaggerChildren>
          <FadeUp delay={0.55}>
            <Link
              href="/about"
              className="font-mono text-xs tracking-[0.25em] text-primary hover:text-white uppercase inline-flex items-center gap-2 transition-colors"
            >
              Read the story <span>→</span>
            </Link>
          </FadeUp>
        </div>

        <div>
          <ImageRevealMask
            src={img("section-mockup")}
            alt="Eko Threads studio piece"
            aspectClass="aspect-[4/5]"
            className="rounded-2xl border border-white/10"
          />
        </div>
      </div>
    </section>
  );
}

function BigTypeManifesto() {
  return (
    <section
      className="relative min-h-[80vh] flex items-center overflow-hidden px-6 md:px-12 py-24"
      style={{ background: siteConfig.brand.primary }}
    >
      <div className="max-w-[1280px] mx-auto w-full">
        <FadeUp>
          <div
            className="font-mono text-xs tracking-[0.4em] uppercase mb-6 opacity-80"
            style={{ color: siteConfig.brand.bg }}
          >
            Manifesto
          </div>
        </FadeUp>

        <TextReveal
          as="h2"
          className="font-display font-light text-[80px] sm:text-[140px] md:text-[220px] lg:text-[280px] leading-[0.88] tracking-tight break-words"
          stagger={0.08}
        >
          {siteConfig.sectionThemeWord}
        </TextReveal>

        <FadeUp delay={0.4}>
          <p
            className="mt-10 max-w-2xl text-lg md:text-2xl font-display leading-snug"
            style={{ color: siteConfig.brand.bg }}
          >
            {siteConfig.manifesto}
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

function FeaturedDrops() {
  const featured = siteConfig.products.slice(0, 4);
  return (
    <section className="relative bg-bg py-24 md:py-32 px-6 border-t border-white/5">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <FadeUp>
              <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-3">
                Currently in stock
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="font-display text-4xl md:text-6xl text-white font-light leading-[1.02]">
                This week&rsquo;s drops.
              </h2>
            </FadeUp>
          </div>
          <FadeUp delay={0.2}>
            <Link
              href="/shop"
              className="font-mono text-xs tracking-[0.25em] text-white/70 hover:text-primary uppercase inline-flex items-center gap-2 transition-colors"
            >
              Shop all →
            </Link>
          </FadeUp>
        </div>

        <StaggerChildren
          staggerDelay={0.08}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {featured.map((p) => (
            <Link
              key={p.slug}
              href={`/shop/${p.slug}`}
              className="group block"
            >
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
              <div className="flex justify-between items-baseline">
                <h3 className="font-display text-white text-base md:text-lg group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
                <div className="font-mono text-xs text-white/60">
                  ₦{p.price.toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

function CollectionsGrid() {
  return (
    <section className="relative bg-bg py-24 md:py-32 px-6 border-t border-white/5">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-12">
          <FadeUp>
            <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-3">
              Categories
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="font-display text-4xl md:text-6xl text-white font-light">
              {siteConfig.servicesHeading}
            </h2>
          </FadeUp>
        </div>

        <StaggerChildren
          staggerDelay={0.08}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {siteConfig.services.map((svc) => (
            <Link
              key={svc.slug}
              href={`/services/${svc.slug}`}
              className="group relative block rounded-xl overflow-hidden aspect-[4/5] border border-white/10 hover:border-primary/50 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-white/5 to-accent/20">
                <img
                  src={img(`service-${svc.slug}`)}
                  alt={svc.name}
                  className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-700 ease-out"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary/80 mb-2">
                  Collection
                </div>
                <h3 className="font-display text-xl md:text-2xl text-white leading-tight mb-2">
                  {svc.name}
                </h3>
                <p className="text-white/70 text-xs md:text-sm leading-snug line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  {svc.description}
                </p>
              </div>
              <div className="absolute top-0 left-0 h-0.5 bg-primary w-0 group-hover:w-full transition-all duration-700 ease-out" />
            </Link>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

function StoryStrip() {
  return (
    <section className="relative bg-bg py-24 md:py-32 px-6 border-t border-white/5">
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <img
            src={img("section-lookbook")}
            alt="Lookbook editorial"
            className="w-full aspect-[4/5] object-cover rounded-2xl border border-white/10"
          />
        </div>
        <div className="order-1 md:order-2">
          <FadeUp>
            <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-4">
              Numbers
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl text-white font-light leading-[1.05] mb-10">
              Small on purpose. Loud on delivery.
            </h2>
          </FadeUp>
          <StaggerChildren staggerDelay={0.08} className="grid grid-cols-2 gap-6">
            {siteConfig.stats.map((s, i) => (
              <div key={i} className="border-l-2 border-primary pl-4">
                <div className="font-display text-3xl md:text-4xl text-white font-light">
                  {s.value}
                </div>
                <div className="text-white/60 text-xs md:text-sm mt-1 font-mono uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-32 px-6 border-t border-white/5 overflow-hidden">
      <img
        src={img("section-cta")}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/80 to-bg" />
      <div className="relative max-w-3xl mx-auto text-center">
        <FadeUp>
          <div className="font-mono text-[11px] tracking-[0.4em] text-primary uppercase mb-6">
            Drop list
          </div>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h2 className="font-display text-5xl md:text-7xl text-white font-light leading-[1.0] mb-6">
            {siteConfig.ctaBlock.heading}
          </h2>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
            {siteConfig.ctaBlock.description}
          </p>
        </FadeUp>
        <FadeUp delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <MagneticButton
              as="a"
              href="/shop"
              className="min-h-[52px] px-8 py-4 rounded-full bg-primary text-bg font-display font-medium hover:brightness-110"
            >
              {siteConfig.cta.primary}
            </MagneticButton>
            <a
              href={`mailto:${siteConfig.company.email}`}
              className="min-h-[52px] px-8 py-4 rounded-full border border-white/20 text-white font-display font-medium hover:bg-white/5 inline-flex items-center justify-center"
            >
              hello@ekothreads.ng
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
