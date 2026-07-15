"use client";

/**
 * CartFlow — router that selects the correct cart variant based on
 * siteConfig.cartVariant. Same pattern as Header.tsx and BookingFlow.tsx.
 *
 * Mount inside <CartProvider> in app/layout.tsx:
 *
 *   <CartProvider brandSlug={siteConfig.slug} currency={siteConfig.currency}>
 *     <CartFlow />
 *     {children}
 *   </CartProvider>
 *
 * Variants:
 *   C1 — CartDrawer    (slide-in side panel, default)
 *   C2 — CartMiniPopover (header-anchored dropdown)
 *   C3 — CartStickyBar (always-visible bottom bar)
 *   C4 — CartFullPage  (rendered at app/cart/page.tsx — NOT here. CartFlow
 *                       returns null for C4 so the CartIcon navigates to
 *                       /cart instead of toggling an overlay.)
 *
 * The CartIcon's onClick behavior changes per variant:
 *   C1, C2 — toggleDrawer()
 *   C3 — no popover; clicking icon scrolls to / opens checkout
 *   C4 — Link to /cart (CartIcon should be a Link in that case)
 */

import { siteConfig } from "@/content/site-config";
import { CartDrawer } from "./CartDrawer";
import { CartMiniPopover } from "./CartMiniPopover";
import { CartStickyBar } from "./CartStickyBar";

export type CartVariant = "C1" | "C2" | "C3" | "C4";

export function CartFlow() {
  const variant = (siteConfig as { cartVariant?: CartVariant }).cartVariant ?? "C1";

  if (variant === "C4") return null; // /cart page handles the UI
  if (variant === "C3") return <CartStickyBar />;
  if (variant === "C2") return <CartMiniPopover />;
  return <CartDrawer />; // C1 default
}
