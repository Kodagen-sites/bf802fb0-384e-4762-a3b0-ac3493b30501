"use client";

/**
 * CartDrawer
 * Slide-in panel with cart contents. Mount once at the App level (not per page).
 *
 * Visual design is intentionally neutral — copy this template into the build
 * and restyle Tailwind classes to match the brand's voice + color tokens.
 *
 * Next.js 16 App Router — uses next/link.
 */

import Link from 'next/link';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';
import { useCart } from './CartContext';

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeDrawer,
    removeItem,
    updateQty,
    subtotalCents,
    formatPrice,
  } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
        aria-hidden
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-[70] h-full w-full max-w-md bg-[var(--color-card,var(--color-bg,#141416))] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border,rgba(255,255,255,0.14))]">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-[var(--color-text-secondary,rgba(244,244,245,0.65))]" />
            <h2 className="font-display text-lg text-[var(--color-text,#f4f4f5)]">Your cart</h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-2 -m-2 text-[var(--color-text-secondary,rgba(244,244,245,0.65))] hover:text-[var(--color-text,#f4f4f5)] transition-colors"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </header>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <EmptyState onClose={closeDrawer} />
          ) : (
            <ul className="divide-y divide-[var(--color-border,rgba(255,255,255,0.14))]">
              {items.map((item) => (
                <li key={`${item.id}::${item.variant ?? ''}`} className="flex gap-4 py-5">
                  {/* Thumbnail */}
                  {item.imageUrl ? (
                    <Link
                      href={item.href ?? '#'}
                      onClick={closeDrawer}
                      className="block w-20 h-24 flex-shrink-0 overflow-hidden rounded-sm bg-[rgba(255,255,255,0.06)]"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </Link>
                  ) : (
                    <div className="w-20 h-24 flex-shrink-0 rounded-sm bg-[rgba(255,255,255,0.06)]" aria-hidden />
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={item.href ?? '#'}
                          onClick={closeDrawer}
                          className="text-sm font-medium text-[var(--color-text,#f4f4f5)] leading-snug hover:text-[var(--color-primary,#c9a876)] transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-[var(--color-text,#f4f4f5)] whitespace-nowrap">
                          {formatPrice(item.priceCents * item.quantity)}
                        </p>
                      </div>
                      {item.variant && (
                        <p className="text-xs text-[var(--color-text-secondary,rgba(244,244,245,0.65))] mt-0.5">{item.variant}</p>
                      )}
                    </div>

                    <div className="flex items-end justify-between mt-2">
                      <QuantityStepper
                        value={item.quantity}
                        onDec={() => updateQty(item.id, item.variant, item.quantity - 1)}
                        onInc={() => updateQty(item.id, item.variant, item.quantity + 1)}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.variant)}
                        className="text-xs text-[var(--color-text-secondary,rgba(244,244,245,0.65))] hover:text-[var(--color-text,#f4f4f5)] underline-offset-2 hover:underline transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <footer className="border-t border-[var(--color-border,rgba(255,255,255,0.14))] px-6 py-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-widest text-[var(--color-text-secondary,rgba(244,244,245,0.65))]">Subtotal</p>
              <p className="text-base font-medium text-[var(--color-text,#f4f4f5)]">{formatPrice(subtotalCents)}</p>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary,rgba(244,244,245,0.65))]">Taxes &amp; shipping calculated at checkout.</p>

            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="block w-full text-center bg-[var(--color-primary,#c9a876)] text-[var(--color-bg,#141416)] py-4 rounded-sm font-medium tracking-wide hover:brightness-110 transition-colors"
            >
              Checkout
            </Link>
            <button
              type="button"
              onClick={closeDrawer}
              className="block w-full text-center text-sm text-[var(--color-text-secondary,rgba(244,244,245,0.65))] hover:text-[var(--color-text,#f4f4f5)] py-1 transition-colors"
            >
              Continue browsing
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}

function QuantityStepper({
  value,
  onDec,
  onInc,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="inline-flex items-center border border-[var(--color-border,rgba(255,255,255,0.14))] rounded-sm">
      <button
        type="button"
        onClick={onDec}
        className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary,rgba(244,244,245,0.65))] hover:text-[var(--color-text,#f4f4f5)] transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className="w-8 text-center text-sm text-[var(--color-text,#f4f4f5)]">{value}</span>
      <button
        type="button"
        onClick={onInc}
        className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary,rgba(244,244,245,0.65))] hover:text-[var(--color-text,#f4f4f5)] transition-colors"
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-16 gap-4">
      <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center">
        <ShoppingBag size={20} className="text-[var(--color-text-secondary,rgba(244,244,245,0.65))]" />
      </div>
      <p className="text-sm text-[var(--color-text-secondary,rgba(244,244,245,0.65))]">Your cart is empty.</p>
      <Link
        href="/shop"
        onClick={onClose}
        className="text-sm text-[var(--color-text,#f4f4f5)] underline underline-offset-4 hover:text-[var(--color-primary,#c9a876)] transition-colors"
      >
        Browse the collection
      </Link>
    </div>
  );
}
