import { Suspense } from "react";
import OrderConfirmationInner from "./OrderConfirmationInner";

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-bg flex items-center justify-center py-16">
          <div className="text-white/60 font-mono text-xs tracking-widest uppercase">
            Loading order…
          </div>
        </main>
      }
    >
      <OrderConfirmationInner />
    </Suspense>
  );
}
