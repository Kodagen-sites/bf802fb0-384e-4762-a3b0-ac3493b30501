"use client";

import { useState, useActionState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import AdminDrawer from "@/components/admin/admin-drawer";
import { useAdminTheme } from "@/lib/admin-theme";
import { getAdminStyles } from "@/lib/admin-styles";
import { useMasked } from "@/lib/use-masked";
import { useRole } from "@/app/admin/role-context";
import { motion } from "framer-motion";
import { SiteConfig } from "@/lib/types";
import { Package, Search, ChevronRight, Truck, CheckCircle2, XCircle, Clock, RotateCcw, ShoppingBag, Box, CreditCard } from "lucide-react";
import { transitionOrder, markOrderPaid } from "@/app/admin/_actions/catalog-orders";

type OrderRow = {
  id: string; reference: string; customerName: string;
  state: string; totalCents: number; currency: string;
  itemCount: number; createdAt: string; paymentProvider: string;
  paidAt: string | null;
};

interface Props { config: SiteConfig; orders: OrderRow[] }

const stateConfig: Record<string, { label: string; dot: string; text: string; bg: string; ring: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:    { label: "Pending",    dot: "bg-amber-400",  text: "text-amber-600",  bg: "bg-amber-500/10",  ring: "ring-amber-500/20",  icon: Clock },
  confirmed:  { label: "Confirmed",  dot: "bg-blue-400",   text: "text-blue-600",   bg: "bg-blue-500/10",   ring: "ring-blue-500/20",   icon: CheckCircle2 },
  processing: { label: "Processing", dot: "bg-indigo-400", text: "text-indigo-600", bg: "bg-indigo-500/10", ring: "ring-indigo-500/20", icon: Box },
  shipped:    { label: "Shipped",    dot: "bg-purple-400", text: "text-purple-600", bg: "bg-purple-500/10", ring: "ring-purple-500/20", icon: Truck },
  delivered:  { label: "Delivered",  dot: "bg-green-400",  text: "text-green-600",  bg: "bg-green-500/10",  ring: "ring-green-500/20",  icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  dot: "bg-red-400",    text: "text-red-600",    bg: "bg-red-500/10",    ring: "ring-red-500/20",    icon: XCircle },
  refunded:   { label: "Refunded",   dot: "bg-gray-400",   text: "text-gray-500",   bg: "bg-gray-500/10",   ring: "ring-gray-500/20",   icon: RotateCcw },
};

function StatusPill({ state }: { state: string }) {
  const c = stateConfig[state] ?? stateConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text} ring-1 ${c.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

const NEXT_ACTIONS: Record<string, { state: string; label: string; primary?: boolean }[]> = {
  pending:    [{ state: "confirmed", label: "Confirm Order", primary: true }, { state: "cancelled", label: "Cancel" }],
  confirmed:  [{ state: "processing", label: "Start Processing", primary: true }, { state: "cancelled", label: "Cancel" }],
  processing: [{ state: "shipped", label: "Mark Shipped", primary: true }, { state: "cancelled", label: "Cancel" }],
  shipped:    [{ state: "delivered", label: "Mark Delivered", primary: true }],
  delivered:  [{ state: "refunded", label: "Refund" }],
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function OrdersView({ config, orders }: Props) {
  return (
    <AdminShell config={config}>
      <OrdersContent orders={orders} />
    </AdminShell>
  );
}

function OrdersContent({ orders }: Omit<Props, "config">) {
  const m = useMasked();
  const { has } = useRole();
  const { theme } = useAdminTheme();
  const dark = theme === "dark";
  const s = getAdminStyles(dark);

  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("");
  const [selected, setSelected] = useState<OrderRow | null>(null);

  const [transState, transAction, transPending] = useActionState(transitionOrder, null);
  const [markPaidState, markPaidAction, markPaidPending] = useActionState(markOrderPaid, null);

  const filtered = orders.filter((o) => {
    if (search && !o.reference.toLowerCase().includes(search.toLowerCase()) && !o.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterState && o.state !== filterState) return false;
    return true;
  });

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
      <div className="p-5 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-xl font-bold ${s.textPrimary}`}>Orders</h1>
            <p className={`text-sm mt-0.5 ${s.textMuted}`}>{orders.length} total orders</p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pending", value: orders.filter((o) => o.state === "pending").length, color: "#f59e0b", icon: Clock },
            { label: "Processing", value: orders.filter((o) => o.state === "processing").length, color: "#6366f1", icon: Box },
            { label: "Shipped", value: orders.filter((o) => o.state === "shipped").length, color: "#a855f7", icon: Truck },
            { label: "Delivered", value: orders.filter((o) => o.state === "delivered").length, color: "#22c55e", icon: CheckCircle2 },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }} className={`${s.cardBg} rounded-2xl border ${s.cardBorder} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ color: stat.color }}><Icon className="w-4 h-4" /></div>
                </div>
                <p className={`text-2xl font-bold ${s.textPrimary}`}>{stat.value}</p>
                <p className={`text-[11px] ${s.textMuted}`}>{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${s.textMuted}`} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference or customer..." className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${s.inputBg} ${s.inputRing}`} />
          </div>
          <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className={`px-4 py-2.5 rounded-xl text-sm border focus:outline-none ${s.inputBg}`}>
            <option value="">All Status</option>
            {Object.entries(stateConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </motion.div>

        {/* Order list */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-20 ${s.cardBg} rounded-2xl border ${s.cardBorder}`}>
            <ShoppingBag className={`w-12 h-12 mx-auto mb-4 ${s.textMuted}`} />
            <p className={s.textSecondary}>No orders found</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`${s.cardBg} rounded-2xl border ${s.cardBorder} overflow-hidden`}>
            <div className={`divide-y ${s.divider}`}>
              {filtered.map((o, i) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.03 }}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${s.hoverBg}`}
                  onClick={() => setSelected(o)}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}>
                    {initials(o.customerName)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono font-bold ${s.textPrimary}`}>{o.reference}</span>
                      <StatusPill state={o.state} />
                    </div>
                    <p className={`text-xs mt-0.5 ${s.textMuted}`}>{m.name(o.customerName)} &middot; {fmtDate(o.createdAt)}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${s.textPrimary}`}>{m.money(o.totalCents / 100, o.currency)}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${s.textMuted} flex-shrink-0`} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detail drawer */}
        <AdminDrawer open={!!selected} onClose={() => setSelected(null)} title={`Order ${selected?.reference ?? ""}`}>
          {selected && (
            <div className="space-y-5">
              {/* Summary card */}
              <div className={`p-4 rounded-xl ${s.sectionBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${s.textMuted}`}>Reference</p>
                    <p className={`text-sm font-mono font-bold ${s.textPrimary}`}>{selected.reference}</p>
                  </div>
                  <StatusPill state={selected.state} />
                </div>
                <div className={`pt-3 border-t ${s.borderLight} space-y-2`}>
                  {[
                    { label: "Customer", value: m.name(selected.customerName) },
                    { label: "Total", value: m.money(selected.totalCents / 100, selected.currency), bold: true },
                    { label: "Date", value: fmtDate(selected.createdAt) },
                    ...(selected.paymentProvider ? [{ label: "Payment", value: selected.paymentProvider }] : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${s.textMuted}`}>{row.label}</span>
                      <span className={`text-sm ${row.bold ? `font-bold ${s.textPrimary}` : s.textSecondary}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mark as Paid — shown when payment not yet recorded */}
              {has("orders.modify") && !selected.paidAt && !["cancelled","refunded"].includes(selected.state) && (
                <form action={markPaidAction}>
                  <input type="hidden" name="orderId" value={selected.id} />
                  <button
                    type="submit"
                    disabled={markPaidPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
                    style={{ background: "#22c55e" }}
                  >
                    <CreditCard className="w-4 h-4" />
                    {markPaidPending ? "Marking…" : "Mark as Paid"}
                  </button>
                  {markPaidState && !markPaidState.ok && (
                    <p className="mt-1 text-xs text-red-500 text-center">{markPaidState.error}</p>
                  )}
                </form>
              )}

              {/* Actions */}
              {has("orders.modify") && (NEXT_ACTIONS[selected.state] ?? []).length > 0 && (
                <div className="space-y-3">
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${s.textMuted}`}>Actions</p>
                  <div className="flex gap-2">
                    {(NEXT_ACTIONS[selected.state] ?? []).map((a) => (
                      <form key={a.state} action={transAction}>
                        <input type="hidden" name="orderId" value={selected.id} />
                        <input type="hidden" name="newState" value={a.state} />
                        <button
                          type="submit"
                          disabled={transPending}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                            a.primary
                              ? "text-white shadow-lg"
                              : "border border-red-500/20 text-red-500 hover:bg-red-500/10"
                          }`}
                          style={a.primary ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" } : undefined}
                        >
                          {a.label}
                        </button>
                      </form>
                    ))}
                  </div>
                  {transState && !transState.ok && <p className="text-sm text-red-500">{transState.error}</p>}
                </div>
              )}
            </div>
          )}
        </AdminDrawer>
      </div>
  );
}
