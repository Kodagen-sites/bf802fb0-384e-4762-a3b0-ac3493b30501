"use client";

/**
 * CartContext
 * Single source of truth for the customer-facing shopping cart.
 *
 * - State lives in React Context with a reducer.
 * - Items are persisted to localStorage keyed by brand slug, so a refresh
 *   doesn't lose the cart and two brand sites on the same machine don't
 *   stomp on each other.
 * - Prices are stored in cents/minor units to avoid float arithmetic.
 * - The provider exposes `apiBaseUrl` to children so checkout knows where
 *   to POST. Leave empty to use the same-origin `/api/orders` route the
 *   skill ships with the build (no payment provider required).
 *
 * Next.js 16 App Router — needs the "use client" directive at the top.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────────

export type CartItem = {
  /** Stable identifier — usually product slug or SKU. */
  id: string;
  name: string;
  /** Price in lowest unit (cents). 8500 = €85.00 */
  priceCents: number;
  quantity: number;
  imageUrl?: string;
  /** Optional variant — colour, size, length, etc. */
  variant?: string;
  /** Optional href for "View product" link in drawer. */
  href?: string;
};

type State = {
  items: CartItem[];
  isOpen: boolean;
};

type Action =
  | { type: 'add';     item: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'remove';  id: string; variant?: string }
  | { type: 'updateQty'; id: string; variant?: string; quantity: number }
  | { type: 'clear' }
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'toggle' }
  | { type: 'hydrate'; items: CartItem[] };

// ── Helpers ────────────────────────────────────────────────────

const matches = (a: CartItem, id: string, variant?: string) =>
  a.id === id && (a.variant ?? '') === (variant ?? '');

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add': {
      const { item } = action;
      const qty = item.quantity ?? 1;
      const existing = state.items.find((i) => matches(i, item.id, item.variant));
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            matches(i, item.id, item.variant)
              ? { ...i, quantity: i.quantity + qty }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...item, quantity: qty }] };
    }
    case 'remove':
      return {
        ...state,
        items: state.items.filter((i) => !matches(i, action.id, action.variant)),
      };
    case 'updateQty':
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => !matches(i, action.id, action.variant)),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          matches(i, action.id, action.variant)
            ? { ...i, quantity: action.quantity }
            : i
        ),
      };
    case 'clear':
      return { ...state, items: [] };
    case 'open':
      return { ...state, isOpen: true };
    case 'close':
      return { ...state, isOpen: false };
    case 'toggle':
      return { ...state, isOpen: !state.isOpen };
    case 'hydrate':
      return { ...state, items: action.items };
    default:
      return state;
  }
}

// ── Context shape ──────────────────────────────────────────────

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  subtotalCents: number;
  currency: string;
  apiBaseUrl: string;
  brandSlug: string;
  addItem:    (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string, variant?: string) => void;
  updateQty:  (id: string, variant: string | undefined, quantity: number) => void;
  clear:      () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  formatPrice: (cents: number) => string;
};

const CartContext = createContext<CartContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────

type ProviderProps = {
  brandSlug: string;
  apiBaseUrl?: string;
  currency?: string;
  children: ReactNode;
};

export function CartProvider({
  brandSlug,
  apiBaseUrl = '',
  currency = 'EUR',
  children,
}: ProviderProps) {
  const storageKey = `${brandSlug}-cart-v1`;

  const [state, dispatch] = useReducer(reducer, { items: [], isOpen: false });

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) dispatch({ type: 'hydrate', items: parsed });
    } catch {
      /* ignore corrupt localStorage */
    }
  }, [storageKey]);

  // Persist on every items change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state.items));
    } catch {
      /* ignore quota errors */
    }
  }, [state.items, storageKey]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    if (state.isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [state.isOpen]);

  // Esc closes drawer
  useEffect(() => {
    if (!state.isOpen || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'close' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.isOpen]);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((s, i) => s + i.quantity, 0);
    const subtotalCents = state.items.reduce((s, i) => s + i.priceCents * i.quantity, 0);

    const formatPrice = (cents: number) => {
      const major = cents / 100;
      try {
        return new Intl.NumberFormat(undefined, {
          style:    'currency',
          currency,
          minimumFractionDigits: major % 1 === 0 ? 0 : 2,
        }).format(major);
      } catch {
        return `${currency} ${major.toFixed(2)}`;
      }
    };

    return {
      items:        state.items,
      isOpen:       state.isOpen,
      count,
      subtotalCents,
      currency,
      apiBaseUrl,
      brandSlug,
      addItem:      (item) => dispatch({ type: 'add', item }),
      removeItem:   (id, variant) => dispatch({ type: 'remove', id, variant }),
      updateQty:    (id, variant, quantity) => dispatch({ type: 'updateQty', id, variant, quantity }),
      clear:        () => dispatch({ type: 'clear' }),
      openDrawer:   () => dispatch({ type: 'open' }),
      closeDrawer:  () => dispatch({ type: 'close' }),
      toggleDrawer: () => dispatch({ type: 'toggle' }),
      formatPrice,
    };
  }, [state, currency, apiBaseUrl, brandSlug]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart() must be used inside <CartProvider>');
  return ctx;
}

// ── Utility ────────────────────────────────────────────────────

/**
 * Parses a display price like "€85", "$1,200.00", "85.00 EUR" into cents.
 * Keeps it forgiving — falls back to 0 on garbage input.
 */
export function parsePriceCents(display: string): number {
  if (!display) return 0;
  const numeric = display.replace(/[^\d.,]/g, '').replace(/,(?=\d{3}\b)/g, '');
  const dotIdx = numeric.lastIndexOf('.');
  const commaIdx = numeric.lastIndexOf(',');
  // European "85,00" → "85.00"
  let normalised = numeric;
  if (commaIdx > dotIdx) normalised = numeric.replace(',', '.');
  const major = parseFloat(normalised);
  if (!Number.isFinite(major)) return 0;
  return Math.round(major * 100);
}
