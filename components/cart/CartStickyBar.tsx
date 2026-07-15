"use client";

/**
 * CartStickyBar (variant C3) — fixed bottom-bar order tray.
 *
 * Always-visible compact tray pinned to the bottom of the viewport. Shows
 * item count + subtotal + a "Checkout" CTA. Hidden entirely when the cart
 * is empty.
 *
 * Best for mobile fast food, food delivery, anywhere checkout urgency
 * matters more than browsing comfort. Replaces CartDrawer.tsx for the C3
 * variant. Mount once at app level inside <CartProvider>.
 */

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartContext";

export function CartStickyBar() {
  const { count, subtotalCents, formatPrice } = useCart();

  if (count === 0) return null;

  return (
    <div
      id="cart-sticky-bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-[var(--color-primary,#c9a876)] text-[var(--color-bg,#141416)] shadow-2xl print:hidden"
    >
      <Link
        href="/checkout"
        className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3 group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(0,0,0,0.12)]">
            <ShoppingBag size={16} />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-bg,#141416)] text-[var(--color-primary,#c9a876)] text-[10px] font-semibold flex items-center justify-center">
              {count}
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-[color-mix(in_srgb,var(--color-bg,#141416)_65%,transparent)]">{count} {count === 1 ? "item" : "items"}</p>
            <p className="text-sm font-medium truncate">{formatPrice(subtotalCents)}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium tracking-wide group-hover:translate-x-0.5 transition-transform">
          Checkout →
        </span>
      </Link>
    </div>
  );
}
