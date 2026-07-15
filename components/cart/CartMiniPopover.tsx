"use client";

/**
 * CartMiniPopover (variant C2) — header-anchored popover cart.
 *
 * A compact dropdown that opens from the CartIcon in the header. Lists the
 * current items in a tight 1-line-per-item layout, with a subtotal and a
 * single "Checkout" CTA routing to /checkout (where Checkout.tsx handles
 * details + POST).
 *
 * Best for small catalogs (≈5–15 SKUs), boutique retail, gift shops, and
 * any site where pulling out a full drawer feels like overkill.
 *
 * Replaces CartDrawer.tsx for variant C2. Mount once at app level inside
 * <CartProvider>.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { useCart } from "./CartContext";

export function CartMiniPopover() {
  const { items, isOpen, closeDrawer, removeItem, updateQty, subtotalCents, formatPrice } = useCart();
  const popRef = useRef<HTMLDivElement | null>(null);

  // Click outside closes the popover
  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        // Don't close if the click was on the cart icon button (it toggles)
        const target = e.target as HTMLElement;
        if (target.closest("[data-cart-trigger]")) return;
        closeDrawer();
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  return (
    <div
      ref={popRef}
      role="dialog"
      aria-label="Cart"
      className="fixed sm:absolute right-3 sm:right-6 top-16 sm:top-14 z-50 w-[calc(100vw-1.5rem)] sm:w-[380px] bg-[var(--color-card,var(--color-bg,#141416))] border border-[var(--color-border,rgba(255,255,255,0.14))] rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border,rgba(255,255,255,0.14))]">
        <h2 className="text-sm font-medium text-[var(--color-text,#f4f4f5)]">Your cart</h2>
        <button onClick={closeDrawer} aria-label="Close" className="p-1 rounded-md hover:bg-[rgba(255,255,255,0.1)]">
          <X size={16} className="text-[var(--color-text-secondary,rgba(244,244,245,0.65))]" />
        </button>
      </header>

      {items.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center mb-3">
            <ShoppingBag size={16} className="text-[var(--color-text-secondary,rgba(244,244,245,0.65))]" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary,rgba(244,244,245,0.65))] mb-3">Your cart is empty.</p>
          <Link href="/shop" onClick={closeDrawer} className="text-sm text-[var(--color-text,#f4f4f5)] underline underline-offset-4">
            Browse the shop
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 overflow-y-auto divide-y divide-[var(--color-border,rgba(255,255,255,0.14))]">
            {items.map((item) => (
              <li key={`${item.id}::${item.variant ?? ""}`} className="flex gap-3 px-4 py-3">
                {item.imageUrl ? (
                  <Link href={item.href ?? "#"} onClick={closeDrawer} className="block w-14 h-14 flex-shrink-0 overflow-hidden rounded-md bg-[rgba(255,255,255,0.06)]">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  </Link>
                ) : (
                  <div className="w-14 h-14 flex-shrink-0 rounded-md bg-[rgba(255,255,255,0.06)]" aria-hidden />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={item.href ?? "#"} onClick={closeDrawer} className="text-sm font-medium text-[var(--color-text,#f4f4f5)] leading-snug truncate hover:text-[var(--color-primary,#c9a876)] transition-colors">
                      {item.name}
                    </Link>
                    <p className="text-sm text-[var(--color-text,#f4f4f5)] whitespace-nowrap">{formatPrice(item.priceCents * item.quantity)}</p>
                  </div>
                  {item.variant && <p className="text-[11px] text-[var(--color-text-secondary,rgba(244,244,245,0.65))] mt-0.5">{item.variant}</p>}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="inline-flex items-center border border-[var(--color-border,rgba(255,255,255,0.14))] rounded-md">
                      <button onClick={() => updateQty(item.id, item.variant, item.quantity - 1)} aria-label="Decrease" className="w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary,rgba(244,244,245,0.65))] hover:text-[var(--color-text,#f4f4f5)] transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-xs text-[var(--color-text,#f4f4f5)]">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.variant, item.quantity + 1)} aria-label="Increase" className="w-6 h-6 flex items-center justify-center text-[var(--color-text-secondary,rgba(244,244,245,0.65))] hover:text-[var(--color-text,#f4f4f5)] transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id, item.variant)} className="text-[11px] text-[var(--color-text-secondary,rgba(244,244,245,0.65))] hover:text-[var(--color-text,#f4f4f5)] underline-offset-2 hover:underline transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <footer className="border-t border-[var(--color-border,rgba(255,255,255,0.14))] px-4 py-3 space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[11px] uppercase tracking-widest text-[var(--color-text-secondary,rgba(244,244,245,0.65))]">Subtotal</span>
              <span className="font-medium text-[var(--color-text,#f4f4f5)]">{formatPrice(subtotalCents)}</span>
            </div>
            <Link href="/checkout" onClick={closeDrawer} className="block w-full text-center bg-[var(--color-primary,#c9a876)] text-[var(--color-bg,#141416)] py-2.5 rounded-md text-sm font-medium tracking-wide hover:brightness-110 transition-colors">
              Checkout
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}
