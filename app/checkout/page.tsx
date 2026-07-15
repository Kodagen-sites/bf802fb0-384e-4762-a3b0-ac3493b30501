"use client";

/**
 * Checkout page
 * Collects customer details and POSTs to `/api/orders` (the Next.js API
 * route the skill ships alongside this template).
 *
 * Default flow (no payment keys configured):
 *   - POST cart + customer details to /api/orders
 *   - Server saves the row into Supabase `customer_orders` (or queues it
 *     if Supabase isn't wired yet) and returns `{ ok: true, orderId }`
 *   - Redirect to /order-confirmation?id={orderId}
 *
 * Optional flow (Stripe/Paystack configured + apiBaseUrl set):
 *   - Same POST, server responds with provider redirect URL
 *   - Checkout follows the redirect
 *
 * Drop this into app/checkout/page.tsx. Restyle Tailwind to match the
 * brand — keep the field set + validation behavior.
 */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartContext';

type OrderResponse =
  | { ok: true; orderId: string; redirect?: string }
  | { ok: false; error: string };

export default function Checkout() {
  const router = useRouter();
  const { items, subtotalCents, formatPrice, currency, apiBaseUrl, brandSlug, clear } = useCart();

  const [form, setForm] = useState({
    full_name: '',
    email:     '',
    phone:     '',
    address:   '',
    city:      '',
    postcode:  '',
    country:   '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg,#141416)]">
        <div className="text-center max-w-sm">
          <p className="text-[var(--color-text-secondary,rgba(244,244,245,0.65))] mb-4">Your cart is empty.</p>
          <Link href="/shop" className="text-[var(--color-text,#f4f4f5)] underline underline-offset-4">
            Browse the collection
          </Link>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Default to the same-origin /api/orders route the skill ships with the
    // build. apiBaseUrl is reserved for sites that route to a separate
    // payments service (Paystack/Stripe), in which case the route handler
    // returns { redirect } and we follow it.
    const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/orders` : '/api/orders';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug:     brandSlug,
          currency,
          items: items.map((i) => ({
            product_id: i.id,
            name:       i.name,
            price_cents: i.priceCents,
            quantity:    i.quantity,
            variant:     i.variant,
            image_url:   i.imageUrl,
          })),
          customer: {
            full_name: form.full_name,
            email:     form.email,
            phone:     form.phone,
            address: {
              line1:    form.address,
              city:     form.city,
              postcode: form.postcode,
              country:  form.country,
            },
          },
          subtotal_cents: subtotalCents,
        }),
      });

      const data = (await res.json()) as OrderResponse;

      if (!data.ok) {
        throw new Error(data.error || 'Order failed');
      }

      // If the server returned an external redirect (Paystack/Stripe), follow it.
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      // Admin builds (NEXT_PUBLIC_DB_MODE set): when the owner has configured
      // a payment gateway in /admin/integrations, hand the customer to the
      // hosted payment page. /api/payments/initialize responds 400 when no
      // provider is configured — fall through to the plain confirmation.
      if (process.env.NEXT_PUBLIC_DB_MODE) {
        try {
          const payEndpoint = apiBaseUrl
            ? `${apiBaseUrl}/api/payments/initialize`
            : '/api/payments/initialize';
          const payRes = await fetch(payEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: brandSlug, orderId: data.orderId }),
          });
          const pay = (await payRes.json()) as { ok?: boolean; authorization_url?: string };
          if (pay?.ok && pay.authorization_url) {
            clear();
            window.location.href = pay.authorization_url;
            return;
          }
        } catch { /* no gateway / network hiccup — order is still recorded */ }
      }

      // Cache the order client-side so the confirmation page works even when
      // the backend hasn't been wired to Supabase yet — the API's in-memory
      // fallback doesn't survive across serverless function instances.
      try {
        window.localStorage.setItem(
          `kodagen-order:${data.orderId}`,
          JSON.stringify({
            id: data.orderId,
            status: 'placed',
            customer: { full_name: form.full_name, email: form.email },
            items: items.map((i) => ({ name: i.name, quantity: i.quantity, variant: i.variant })),
            subtotal_cents: subtotalCents,
            currency,
            created_at: new Date().toISOString(),
          }),
        );
      } catch { /* quota or private-mode — fall back to server fetch */ }

      // Default path: order saved, go to the confirmation page. Admin builds
      // ship the canonical /order/confirmed server page (payment-verify lane);
      // scaffold-only builds use the client-side /order-confirmation drop-in.
      clear();
      router.push(
        process.env.NEXT_PUBLIC_DB_MODE
          ? `/order/confirmed?ref=${encodeURIComponent(data.orderId)}`
          : `/order-confirmation?id=${encodeURIComponent(data.orderId)}`,
      );
    } catch (err: any) {
      setError(err?.message ?? 'Could not place the order. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg,#141416)] py-16 lg:py-24">
      <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
        <div className="mb-10">
          <Link href="/shop" className="text-xs uppercase tracking-widest text-[var(--color-text-secondary,rgba(244,244,245,0.65))] hover:text-[var(--color-text,#f4f4f5)]">
            ← Continue browsing
          </Link>
          <h1 className="mt-3 font-display font-light text-[var(--color-text,#f4f4f5)] text-3xl lg:text-4xl">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-20">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <Section title="Contact">
              <Field label="Full name" required value={form.full_name}
                onChange={(v) => setForm({ ...form, full_name: v })} />
              <Field label="Email" required type="email" value={form.email}
                onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Phone" type="tel" value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })} />
            </Section>

            <Section title="Shipping">
              <Field label="Address" required value={form.address}
                onChange={(v) => setForm({ ...form, address: v })} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" required value={form.city}
                  onChange={(v) => setForm({ ...form, city: v })} />
                <Field label="Postcode" required value={form.postcode}
                  onChange={(v) => setForm({ ...form, postcode: v })} />
              </div>
              <Field label="Country" required value={form.country}
                onChange={(v) => setForm({ ...form, country: v })} />
            </Section>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-3 rounded-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[var(--color-primary,#c9a876)] text-[var(--color-bg,#141416)] py-4 rounded-sm font-medium tracking-wide hover:brightness-110 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Processing…' : `Place order · ${formatPrice(subtotalCents)}`}
            </button>
          </form>

          {/* Order summary */}
          <aside className="bg-[rgba(255,255,255,0.06)] rounded-sm p-6 h-fit">
            <h2 className="text-xs uppercase tracking-widest text-[var(--color-text-secondary,rgba(244,244,245,0.65))] mb-5">Order</h2>
            <ul className="space-y-4 mb-6">
              {items.map((i) => (
                <li key={`${i.id}::${i.variant ?? ''}`} className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text,#f4f4f5)] leading-snug">{i.name}</p>
                    {i.variant && <p className="text-xs text-[var(--color-text-secondary,rgba(244,244,245,0.65))] mt-0.5">{i.variant}</p>}
                    <p className="text-xs text-[var(--color-text-secondary,rgba(244,244,245,0.65))] mt-0.5">Qty {i.quantity}</p>
                  </div>
                  <p className="text-sm text-[var(--color-text,#f4f4f5)] whitespace-nowrap">
                    {formatPrice(i.priceCents * i.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-[var(--color-border,rgba(255,255,255,0.14))] pt-4 flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-widest text-[var(--color-text-secondary,rgba(244,244,245,0.65))]">Subtotal</p>
              <p className="text-base font-medium text-[var(--color-text,#f4f4f5)]">{formatPrice(subtotalCents)}</p>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary,rgba(244,244,245,0.65))] mt-2">Taxes &amp; shipping calculated at order review.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-xs uppercase tracking-widest text-[var(--color-text-secondary,rgba(244,244,245,0.65))]">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-[var(--color-text-secondary,rgba(244,244,245,0.65))] mb-1">
        {label}{required && <span className="text-[var(--color-primary,#c9a876)]">*</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[rgba(255,255,255,0.06)] border border-[var(--color-border,rgba(255,255,255,0.14))] rounded-sm px-3 py-2.5 text-sm text-[var(--color-text,#f4f4f5)] focus:outline-none focus:border-[var(--color-primary,#c9a876)] transition-colors"
      />
    </label>
  );
}
