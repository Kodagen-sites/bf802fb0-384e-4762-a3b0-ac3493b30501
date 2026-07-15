import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/content/site-config";
import { FadeUp } from "@/components/motion";
import ProductSelector from "./ProductSelector";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return siteConfig.products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = siteConfig.products.find((p) => p.slug === slug);
  if (!product) return { title: "Not found" };
  return {
    title: `${product.name} — ${siteConfig.company.name}`,
    description: product.description,
    openGraph: {
      title: `${product.name} · ₦${product.price.toLocaleString()}`,
      description: product.description,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = siteConfig.products.find((p) => p.slug === slug);
  if (!product) return notFound();

  const category = siteConfig.services.find((s) => s.slug === product.category);
  const related = siteConfig.products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, 3);

  return (
    <div className="bg-bg">
      <div className="pt-28 md:pt-32 px-6">
        <div className="max-w-[1280px] mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8 font-mono text-[11px] tracking-[0.25em] uppercase text-white/50">
            <Link href="/shop" className="hover:text-primary transition-colors">
              Shop
            </Link>
            <span className="mx-2 text-white/30">/</span>
            {category && (
              <>
                <Link
                  href={`/services/${category.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {category.name}
                </Link>
                <span className="mx-2 text-white/30">/</span>
              </>
            )}
            <span className="text-white/80">{product.name}</span>
          </nav>

          {/* Product hero */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 mb-24">
            <FadeUp>
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="md:pt-8">
                {category && (
                  <Link
                    href={`/services/${category.slug}`}
                    className="font-mono text-[11px] tracking-[0.3em] uppercase text-primary hover:text-white transition-colors mb-4 inline-block"
                  >
                    {category.name}
                  </Link>
                )}
                <h1 className="font-display text-4xl md:text-6xl text-white font-light leading-[1.02] mb-4">
                  {product.name}
                </h1>
                <div className="font-display text-2xl text-white/90 mb-8">
                  ₦{product.price.toLocaleString()}
                </div>

                <p className="text-white/70 leading-relaxed mb-10 text-lg">
                  {product.description}
                </p>

                <ProductSelector product={product} />

                <div className="mt-10 pt-8 border-t border-white/10 space-y-3 text-sm">
                  <div className="flex justify-between text-white/70">
                    <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/50">
                      Shipping
                    </span>
                    <span>Same-day Lagos · 3-5d nationwide</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/50">
                      Returns
                    </span>
                    <span>7 days, free within Lagos</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/50">
                      Made in
                    </span>
                    <span>Yaba, Lagos</span>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="border-t border-white/5 pt-16 md:pt-24 pb-24">
              <div className="mb-10">
                <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-3">
                  More in this collection
                </div>
                <h2 className="font-display text-3xl md:text-5xl text-white font-light">
                  Pair it with.
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/shop/${p.slug}`}
                    className="group block"
                  >
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
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

