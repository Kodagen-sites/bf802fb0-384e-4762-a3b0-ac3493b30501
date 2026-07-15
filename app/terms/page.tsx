import type { Metadata } from "next";
import { siteConfig } from "@/content/site-config";

const company = siteConfig.company.name;
const email = siteConfig.company.email;
const jurisdiction = siteConfig.company.location;
const effectiveDate = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export const metadata: Metadata = {
  title: `Terms & Conditions — ${company}`,
  description: `The terms that govern your use of the ${company} website and shop.`,
};

export default function TermsPage() {
  return (
    <main className="bg-bg text-white">
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 md:px-8 md:pt-40">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
          Legal
        </p>
        <h1 className="mt-4 font-display text-4xl font-light tracking-tight md:text-5xl">
          Terms &amp; Conditions
        </h1>
        <p className="mt-3 text-sm text-white/60">Effective {effectiveDate}</p>

        <div className="mt-12 space-y-8 leading-relaxed [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-medium [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-white/75 [&_li]:text-white/75 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
          <p>
            These Terms &amp; Conditions govern your use of the {company} website
            and shop. By accessing or using this site, you agree to these terms.
          </p>

          <div>
            <h2>Orders and payment</h2>
            <p>
              All orders are subject to acceptance and availability. Payment is
              processed by Paystack — we accept card, bank transfer, USSD, and
              mobile money. Prices are in Nigerian Naira (₦) and include VAT where
              applicable.
            </p>
          </div>

          <div>
            <h2>Shipping</h2>
            <p>
              We ship same-day within Lagos for orders placed before 3pm, and via
              GIG Logistics for the rest of Nigeria (3–5 working days). Delivery
              fees are calculated at checkout.
            </p>
          </div>

          <div>
            <h2>Returns and exchanges</h2>
            <p>
              We accept returns within 7 days of delivery for unworn items in
              original packaging. Sale items and limited drops are final sale.
              Contact{" "}
              <a className="underline hover:text-primary" href={`mailto:${email}`}>
                {email}
              </a>{" "}
              to initiate a return.
            </p>
          </div>

          <div>
            <h2>Use of the website</h2>
            <p>
              You may use this website for lawful purposes only. You agree not to
              use it in any way that damages, disables, or impairs the site.
            </p>
          </div>

          <div>
            <h2>Intellectual property</h2>
            <p>
              All content on this website — text, graphics, logos, images, and
              design — is owned by {company} or its licensors. You may not
              reproduce, distribute, or create derivative works without our written
              permission.
            </p>
          </div>

          <div>
            <h2>No warranties</h2>
            <p>
              This website is provided &ldquo;as is&rdquo; without warranties of
              any kind. We do not guarantee that the site will be uninterrupted or
              error-free.
            </p>
          </div>

          <div>
            <h2>Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, {company} is not liable for
              any indirect, incidental, or consequential damages arising from your
              use of this website.
            </p>
          </div>

          <div>
            <h2>Governing law</h2>
            <p>
              These terms are governed by the laws of the Federal Republic of
              Nigeria. Any dispute will be resolved in the courts of Lagos State.
            </p>
          </div>

          <div>
            <h2>Contact us</h2>
            <p>
              Questions about these terms? Email{" "}
              <a className="underline hover:text-primary" href={`mailto:${email}`}>
                {email}
              </a>
              . Registered in {jurisdiction}.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
