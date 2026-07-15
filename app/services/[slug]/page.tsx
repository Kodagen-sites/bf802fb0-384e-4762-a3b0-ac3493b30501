import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/content/site-config";
import assetManifest from "@/content/asset-manifest.json";
import PageHero from "@/components/PageHero";
import { FadeUp, StaggerChildren } from "@/components/motion";

const img = (slot: string, fallback = ""): string =>
  ((assetManifest as any)?.images?.[slot] as string) || fallback;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return siteConfig.services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const svc = siteConfig.services.find((s) => s.slug === slug);
  if (!svc) return { title: "Not found" };
  return {
    title: `${svc.name} — ${siteConfig.company.name}`,
    description: svc.description,
    openGraph: {
      title: `${svc.name} · ${siteConfig.company.name}`,
      description: svc.description,
      images: [{ url: img(`service-${svc.slug}`) }],
    },
  };
}

export default async function CollectionDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const svc = siteConfig.services.find((s) => s.slug === slug);
  if (!svc) return notFound();

  const products = siteConfig.products.filter((p) => p.category === slug);
  const other = siteConfig.services.filter((s) => s.slug !== slug).slice(0, 3);

  return (
    <div className="bg-bg">
      <PageHero
        eyebrow="Collection"
        title={<>{svc.name}<span className="italic text-primary">.</span></>}
        image={img(`service-${svc.slug}`, img("section-lookbook"))}
        intro={svc.description}
      />

      {/* Highlights */}
      <section className="px-6 py-16 md:py-20 border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <StaggerChildren
            staggerDelay={0.08}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {svc.highlights.map((h, i) => (
              <div
                key={i}
                className="border border-white/10 rounded-2xl p-6 hover:border-primary/40 transition-colors"
              >
                <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-primary mb-3">
                  0{i + 1}
                </div>
                <div className="font-display text-xl text-white">{h}</div>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Products in this collection */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <FadeUp>
                <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-3">
                  In this collection
                </div>
              </FadeUp>
              <FadeUp delay={0.1}>
                <h2 className="font-display text-3xl md:text-5xl text-white font-light">
                  {products.length > 0
                    ? `${products.length} piece${products.length === 1 ? "" : "s"} in stock`
                    : "New pieces drop weekly"}
                </h2>
              </FadeUp>
            </div>
          </div>

          {products.length > 0 ? (
            <StaggerChildren
              staggerDelay={0.06}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {products.map((p) => (
                <Link key={p.slug} href={`/shop/${p.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 mb-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700"
                    />
                  </div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-display text-white text-base group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    <div className="font-mono text-xs text-white/60">
                      ₦{p.price.toLocaleString()}
                    </div>
                  </div>
                </Link>
              ))}
            </StaggerChildren>
          ) : (
            <div className="border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-white/60">
                Nothing in this collection is in stock right now. The drop list is
                where restocks get announced first.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-full bg-primary text-bg font-display font-medium hover:brightness-110 transition-all"
              >
                Join the drop list
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Other collections */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <FadeUp>
            <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-3">
              Also browse
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl text-white font-light mb-10">
              Other collections
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {other.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group relative block rounded-xl overflow-hidden aspect-[4/5] border border-white/10 hover:border-primary/40 transition-colors"
              >
                <img
                  src={img(`service-${s.slug}`)}
                  alt={s.name}
                  className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-display text-xl text-white">{s.name}</h3>
                  <div className="mt-2 font-mono text-[10px] tracking-[0.25em] uppercase text-primary">
                    View →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
