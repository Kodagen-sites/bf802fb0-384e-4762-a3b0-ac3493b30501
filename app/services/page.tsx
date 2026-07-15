import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/content/site-config";
import assetManifest from "@/content/asset-manifest.json";
import PageHero from "@/components/PageHero";
import { StaggerChildren, FadeUp } from "@/components/motion";

const img = (slot: string, fallback = ""): string =>
  ((assetManifest as any)?.images?.[slot] as string) || fallback;

export const metadata: Metadata = {
  title: `Collections — ${siteConfig.company.name}`,
  description: `Browse every collection at ${siteConfig.company.name}: streetwear tees, dresses, denim, caps, limited drops and thrift finds.`,
};

export default function CollectionsPage() {
  return (
    <div className="bg-bg">
      <PageHero
        eyebrow="Six collections"
        title={<>{siteConfig.servicesHeading}<span className="italic text-primary">.</span></>}
        image={img("section-lookbook")}
        intro="Streetwear, denim, dresses, caps, drops and thrift. Each collection is small on purpose."
      />

      <section className="px-6 py-24 md:py-32">
        <div className="max-w-[1280px] mx-auto">
          <StaggerChildren
            staggerDelay={0.08}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {siteConfig.services.map((svc) => (
              <Link
                key={svc.slug}
                href={`/services/${svc.slug}`}
                className="group relative block rounded-2xl overflow-hidden aspect-[4/5] border border-white/10 hover:border-primary/50 transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-white/5 to-accent/20">
                  <img
                    src={img(`service-${svc.slug}`)}
                    alt={svc.name}
                    className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-700 ease-out"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary/90 mb-3">
                    Collection
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl text-white leading-tight mb-3 font-light">
                    {svc.name}
                  </h3>
                  <p className="text-white/70 text-sm leading-snug mb-3">
                    {svc.description}
                  </p>
                  <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-primary group-hover:text-white transition-colors">
                    View collection →
                  </div>
                </div>
                <div className="absolute top-0 left-0 h-0.5 bg-primary w-0 group-hover:w-full transition-all duration-700 ease-out" />
              </Link>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Process */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-12">
            <FadeUp>
              <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-3">
                How this works
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="font-display text-3xl md:text-5xl text-white font-light">
                Four steps. No hidden bit.
              </h2>
            </FadeUp>
          </div>
          <StaggerChildren
            staggerDelay={0.08}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {siteConfig.process.map((p) => (
              <div key={p.step} className="border-l-2 border-primary pl-4">
                <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-2">
                  Step 0{p.step}
                </div>
                <h3 className="font-display text-xl text-white mb-2">{p.title}</h3>
                <p className="text-white/60 text-sm leading-snug">{p.description}</p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>
    </div>
  );
}
