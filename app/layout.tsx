import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/headers/Header";
import Footer from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { FilmGrain, Vignette, ScrollProgress } from "@/components/motion";
import { CartProvider } from "@/components/cart/CartContext";
import { CartFlow } from "@/components/cart/CartFlow";
import EditorBridge from "@/components/__kodagen/EditorBridge";
import { siteConfig } from "@/content/site-config";

export const metadata: Metadata = {
  title: siteConfig.seo.defaultTitle,
  description: siteConfig.seo.defaultDescription,
  metadataBase: new URL(siteConfig.seo.siteUrl),
  openGraph: {
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    url: siteConfig.seo.siteUrl,
    siteName: siteConfig.company.name,
    locale: siteConfig.seo.locale,
    type: "website",
    images: [{ url: siteConfig.seo.defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    site: siteConfig.seo.twitterHandle,
    images: [siteConfig.seo.defaultOgImage],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={siteConfig.seo.htmlLang}>
      <body className="bg-bg text-ink font-body overflow-x-clip">
        <CartProvider brandSlug="eko-threads" currency="NGN">
          <ScrollProgress />
          <Header />
          <main className="relative">{children}</main>
          <Footer />
          <CartFlow />
          <FilmGrain />
          <Vignette color={siteConfig.brand.bg} />
          <CookieConsent />
          <EditorBridge />
        </CartProvider>
      </body>
    </html>
  );
}
