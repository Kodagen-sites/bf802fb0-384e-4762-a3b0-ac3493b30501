"use client";

/**
 * AddToCart
 * Button component that adds a product to the cart and opens the drawer.
 *
 * Brand styling lives at the call site via `className` — the component
 * itself is unstyled (just inherits the wrapping <button>'s classes).
 *
 * NEVER stub the click handler with alert() or console.log. If you find
 * yourself wanting to do that, use this component instead.
 */

import type { ReactNode, MouseEvent } from 'react';
import { useCart, type CartItem } from './CartContext';

interface AddToCartProps {
  product: Omit<CartItem, 'quantity'>;
  /** Number of units added per click. Default 1. */
  quantity?: number;
  /** If false, item is added but the drawer doesn't open. Default true. */
  openDrawerOnAdd?: boolean;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  /** Optional secondary onClick (analytics, etc.). Runs after the cart add. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
}

export function AddToCart({
  product,
  quantity = 1,
  openDrawerOnAdd = true,
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  children = 'Add to cart',
}: AddToCartProps) {
  const { addItem, openDrawer } = useCart();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    addItem({ ...product, quantity });
    if (openDrawerOnAdd) openDrawer();
    onClick?.(e);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={className}
      aria-label={`Add ${product.name} to cart`}
    >
      {children}
    </button>
  );
}
