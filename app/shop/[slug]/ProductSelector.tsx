"use client";

import { useState } from "react";
import { AddToCart } from "@/components/cart/AddToCart";

type Product = {
  slug: string;
  name: string;
  price: number;
  image: string;
  sizes: readonly string[] | string[];
};

export default function ProductSelector({ product }: { product: Product }) {
  const sizes = product.sizes as string[];
  const [size, setSize] = useState<string>(sizes[0] ?? "");
  const [qty, setQty] = useState(1);

  return (
    <div className="space-y-6">
      {sizes.length > 1 && (
        <div>
          <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/50 mb-3">
            Size
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`min-w-[52px] h-12 px-4 rounded-full font-mono text-xs tracking-wider border transition-all ${
                  size === s
                    ? "border-primary bg-primary text-bg"
                    : "border-white/20 text-white/80 hover:border-white/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/50 mb-3">
          Quantity
        </div>
        <div className="inline-flex items-center border border-white/20 rounded-full overflow-hidden">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-11 h-11 text-white/70 hover:bg-white/5"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <div className="w-12 text-center font-mono text-sm text-white">
            {qty}
          </div>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="w-11 h-11 text-white/70 hover:bg-white/5"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <AddToCart
        product={{
          id: product.slug,
          name: product.name,
          priceCents: product.price * 100,
          imageUrl: product.image,
          variant: size || undefined,
          href: `/shop/${product.slug}`,
        }}
        quantity={qty}
        className="w-full min-h-[56px] px-8 py-4 rounded-full bg-primary text-bg font-display font-medium text-base hover:brightness-110 transition-all"
      >
        Add to cart · ₦{(product.price * qty).toLocaleString()}
      </AddToCart>
    </div>
  );
}
