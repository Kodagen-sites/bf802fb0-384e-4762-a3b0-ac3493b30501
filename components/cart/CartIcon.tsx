"use client";

/**
 * CartIcon
 * Header trigger that opens the drawer + shows item count badge.
 *
 * Drop into the brand's Header component. Style/colour to match.
 */

import { ShoppingBag } from 'lucide-react';
import { useCart } from './CartContext';

interface CartIconProps {
  className?: string;
  iconSize?: number;
}

export function CartIcon({ className = '', iconSize = 18 }: CartIconProps) {
  const { count, toggleDrawer } = useCart();

  return (
    <button
      type="button"
      onClick={toggleDrawer}
      className={`relative inline-flex items-center justify-center p-2 -m-2 transition-colors ${className}`}
      aria-label={`Open cart (${count} ${count === 1 ? 'item' : 'items'})`}
    >
      <ShoppingBag size={iconSize} />
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[var(--color-primary,#c9a876)] text-[var(--color-bg,#141416)] text-[10px] font-medium tabular-nums"
          aria-hidden
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
