"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Mail } from "lucide-react";

type OrderSummary = {
  id: string;
  status: "placed" | "paid" | "pending";
  customer: { full_name: string; email: string };
  items: { name: string; quantity: number; variant?: string }[];
  subtotal_cents: number;
  currency: string;
};

export default function OrderConfirmationInner() {
  const params = useSearchParams();
  const orderId = params?.get("id") ?? "";

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("No order reference provided.");
      return;
    }
    let cancelled = false;

    try {
      const cached = window.localStorage.getItem(`kodagen-order:${orderId}`);
      if (cached) {
        setOrder(JSON.parse(cached));
        return;
      }
    } catch {
      /* private mode */
    }

    (async () => {
      try {
        const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        if (!cancelled) setOrder(data.order ?? null);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Could not load the order.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const isPending = order?.status === "pending";

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center py-16 pt-32">
      <div className="container mx-auto px-6 lg:px-12 max-w-xl text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-8">
          {isPending ? (
            <Mail size={24} className="text-primary" />
          ) : (
            <Check size={24} className="text-primary" />
          )}
        </div>

        <h1 className="font-display font-light text-white text-3xl lg:text-5xl mb-4">
          {isPending ? "We received your order." : "Thank you."}
        </h1>

        <p className="text-white/70 leading-relaxed mb-8">
          {isPending
            ? "We have your details and will be in touch shortly to arrange payment and delivery."
            : "Your order is on the way. A confirmation has been sent to your email."}
        </p>

        {orderId && (
          <p className="text-xs uppercase tracking-widest text-white/60 mb-6 font-mono">
            Reference:{" "}
            <span className="text-white tabular-nums">
              {orderId.slice(0, 8).toUpperCase()}
            </span>
          </p>
        )}

        {error && (
          <p className="text-sm text-red-300 bg-red-900/20 border border-red-500/30 px-4 py-3 rounded mb-6">
            {error}
          </p>
        )}

        {order && order.items.length > 0 && (
          <div className="bg-white/5 rounded-xl px-6 py-5 text-left mb-8">
            <p className="text-xs uppercase tracking-widest text-white/60 mb-3 font-mono">
              Your order
            </p>
            <ul className="space-y-2">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex justify-between text-sm">
                  <span className="text-white">
                    {i.name}
                    {i.variant ? (
                      <span className="text-white/60"> · {i.variant}</span>
                    ) : null}
                  </span>
                  <span className="text-white/60">×{i.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop"
            className="inline-block bg-primary text-bg px-8 py-3.5 rounded-full text-sm font-medium tracking-wide hover:brightness-110 transition-colors"
          >
            Continue shopping
          </Link>
          <Link
            href="/"
            className="inline-block text-sm text-white/60 hover:text-white py-3.5 px-2 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
