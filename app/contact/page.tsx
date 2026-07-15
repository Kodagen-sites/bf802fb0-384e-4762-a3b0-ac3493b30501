import type { Metadata } from "next";
import { Mail, Phone, MapPin, Instagram } from "lucide-react";
import { siteConfig } from "@/content/site-config";
import assetManifest from "@/content/asset-manifest.json";
import PageHero from "@/components/PageHero";
import { FadeUp } from "@/components/motion";
import ContactForm from "./ContactForm";

const img = (slot: string, fallback = ""): string =>
  ((assetManifest as any)?.images?.[slot] as string) || fallback;

export const metadata: Metadata = {
  title: `Contact — ${siteConfig.company.name}`,
  description: `Get in touch with ${siteConfig.company.name}. Wholesale, press, custom orders and studio visits.`,
};

export default function ContactPage() {
  return (
    <div className="bg-bg">
      <PageHero
        eyebrow="Say hi"
        title={<>Studio&rsquo;s in <span className="italic text-primary">Yaba</span>.</>}
        image={img("section-drops")}
        intro="Wholesale, custom orders, press, or just a hello — everything comes to hello@ekothreads.ng, or drop a note below."
      />

      <section className="px-6 py-24 md:py-32">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <FadeUp>
              <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-4">
                Reach us
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="font-display text-3xl md:text-5xl text-white font-light mb-10 leading-[1.05]">
                Fastest reply is Instagram DM.
              </h2>
            </FadeUp>

            <div className="space-y-6">
              <a
                href={`mailto:${siteConfig.company.email}`}
                className="flex items-start gap-4 group"
              >
                <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1">
                    Email
                  </div>
                  <div className="font-display text-white text-lg group-hover:text-primary transition-colors">
                    {siteConfig.company.email}
                  </div>
                </div>
              </a>

              <a
                href={`tel:${siteConfig.company.phone.replace(/\s/g, "")}`}
                className="flex items-start gap-4 group"
              >
                <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1">
                    Phone / WhatsApp
                  </div>
                  <div className="font-display text-white text-lg group-hover:text-primary transition-colors">
                    {siteConfig.company.phone}
                  </div>
                </div>
              </a>

              <a
                href={siteConfig.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 group"
              >
                <Instagram className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1">
                    Instagram
                  </div>
                  <div className="font-display text-white text-lg group-hover:text-primary transition-colors">
                    @ekothreads
                  </div>
                </div>
              </a>

              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1">
                    Studio
                  </div>
                  <div className="font-display text-white text-lg">
                    {siteConfig.seo.structuredData.address.streetAddress}
                    <br />
                    {siteConfig.seo.structuredData.address.addressLocality},{" "}
                    {siteConfig.seo.structuredData.address.addressRegion}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4">
                Studio hours
              </div>
              <div className="space-y-2 text-white/80 text-sm">
                {siteConfig.seo.structuredData.hours.map((h, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{h.days.join(", ")}</span>
                    <span className="font-mono text-white/60">
                      {h.opens} – {h.closes}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-white/50">
                  <span>Sunday</span>
                  <span className="font-mono">Closed</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <FadeUp>
              <ContactForm />
            </FadeUp>
          </div>
        </div>
      </section>
    </div>
  );
}
