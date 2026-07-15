"use client";

import { useState, useActionState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import AdminDrawer from "@/components/admin/admin-drawer";
import { useAdminTheme } from "@/lib/admin-theme";
import { getAdminStyles } from "@/lib/admin-styles";
import { useRole } from "@/app/admin/role-context";
import { motion } from "framer-motion";
import { SiteConfig } from "@/lib/types";
import { Warehouse, Search, AlertTriangle, ArrowUp, ArrowDown, Package, Box, TrendingDown } from "lucide-react";
import { adjustStock } from "@/app/admin/_actions/catalog-inventory";

type VariantRow = {
  id: string; productId: string; productName: string; name: string;
  sku: string; qty: number; threshold: number; active: boolean;
  priceCents: number | null;
};
type LogEntry = { id: string; variantId: string; adjustment: number; reason: string; createdAt: string };

interface Props { config: SiteConfig; variants: VariantRow[]; recentLog: LogEntry[] }

function StockBadge({ qty, threshold }: { qty: number; threshold: number }) {
  if (qty === 0) return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 ring-1 ring-red-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Out of stock
    </span>
  );
  if (qty <= threshold) return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Low stock
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 ring-1 ring-green-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> In stock
    </span>
  );
}

export default function InventoryView({ config, variants, recentLog }: Props) {
  return (
    <AdminShell config={config}>
      <InventoryContent variants={variants} recentLog={recentLog} />
    </AdminShell>
  );
}

function InventoryContent({ variants, recentLog }: Omit<Props, "config">) {
  const { has } = useRole();
  const { theme } = useAdminTheme();
  const dark = theme === "dark";
  const s = getAdminStyles(dark);

  const [search, setSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [adjusting, setAdjusting] = useState<VariantRow | null>(null);

  const [adjState, adjAction, adjPending] = useActionState(adjustStock, null);

  const lowStockCount = variants.filter((v) => v.qty <= v.threshold && v.active).length;
  const outOfStockCount = variants.filter((v) => v.qty === 0 && v.active).length;
  const totalUnits = variants.reduce((sum, v) => sum + v.qty, 0);

  const filtered = variants.filter((v) => {
    if (search && !v.productName.toLowerCase().includes(search.toLowerCase()) && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.sku.toLowerCase().includes(search.toLowerCase())) return false;
    if (showLowOnly && (v.qty > v.threshold || !v.active)) return false;
    return true;
  });

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
      <div className="p-5 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-xl font-bold ${s.textPrimary}`}>Inventory</h1>
            <p className={`text-sm mt-0.5 ${s.textMuted}`}>{variants.length} variants &middot; {totalUnits} total units</p>
          </div>
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 ring-1 ring-amber-500/10">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600">{lowStockCount} low stock alert{lowStockCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Variants", value: variants.length, icon: Package, color: "#3b82f6" },
            { label: "Total Units", value: totalUnits, icon: Box, color: "#22c55e" },
            { label: "Low Stock", value: lowStockCount, icon: TrendingDown, color: "#f59e0b" },
            { label: "Out of Stock", value: outOfStockCount, icon: AlertTriangle, color: "#ef4444" },
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product, variant, or SKU..." className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${s.inputBg} ${s.inputRing}`} />
          </div>
          <button
            onClick={() => setShowLowOnly(!showLowOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${showLowOnly ? "bg-amber-500/10 border-amber-500/20 text-amber-600 ring-1 ring-amber-500/20" : `${s.inputBg}`}`}
          >
            <AlertTriangle className="w-4 h-4" /> Low Stock Only
          </button>
        </motion.div>

        {/* Stock table */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-20 ${s.cardBg} rounded-2xl border ${s.cardBorder}`}>
            <Warehouse className={`w-12 h-12 mx-auto mb-4 ${s.textMuted}`} />
            <p className={s.textSecondary}>{showLowOnly ? "No low stock items" : "No inventory items"}</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`${s.cardBg} rounded-2xl border ${s.cardBorder} overflow-hidden`}>
            <div className={`divide-y ${s.divider}`}>
              {filtered.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.02 }}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${s.hoverBg}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${s.textPrimary}`}>{v.productName}</p>
                    <p className={`text-xs mt-0.5 ${s.textMuted}`}>
                      {v.name} {v.sku && <>&middot; <span className="font-mono">{v.sku}</span></>}
                    </p>
                  </div>
                  <div className="text-center flex-shrink-0 w-16">
                    <p className={`text-lg font-bold ${v.qty === 0 ? "text-red-500" : v.qty <= v.threshold ? "text-amber-500" : s.textPrimary}`}>{v.qty}</p>
                    <p className={`text-[10px] ${s.textMuted}`}>units</p>
                  </div>
                  <div className="flex-shrink-0">
                    <StockBadge qty={v.qty} threshold={v.threshold} />
                  </div>
                  {has("inventory.adjust") && (
                    <button onClick={() => setAdjusting(v)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ color: "var(--color-accent)" }}>
                      Adjust
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent activity */}
        {recentLog.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className={`text-lg font-bold mb-4 ${s.textPrimary}`}>Recent Activity</h2>
            <div className={`${s.cardBg} rounded-2xl border ${s.cardBorder} overflow-hidden`}>
              <div className={`divide-y ${s.divider}`}>
                {recentLog.slice(0, 15).map((entry, i) => {
                  const variant = variants.find((v) => v.id === entry.variantId);
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.28 + i * 0.03 }}
                      className={`flex items-center gap-3 px-5 py-3 ${s.hoverBg}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.adjustment > 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        {entry.adjustment > 0 ? <ArrowUp className="w-4 h-4 text-green-500" /> : <ArrowDown className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${s.textPrimary}`}><span className="font-medium">{variant?.productName ?? "Unknown"}</span> — {variant?.name ?? ""}</p>
                        <p className={`text-xs ${s.textMuted}`}>{entry.reason} &middot; {fmtDate(entry.createdAt)}</p>
                      </div>
                      <span className={`font-mono text-sm font-bold flex-shrink-0 ${entry.adjustment > 0 ? "text-green-500" : "text-red-500"}`}>
                        {entry.adjustment > 0 ? "+" : ""}{entry.adjustment}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Adjust drawer */}
        <AdminDrawer open={!!adjusting} onClose={() => setAdjusting(null)} title="Adjust Stock">
          {adjusting && (
            <form action={adjAction} className="space-y-4">
              <input type="hidden" name="variantId" value={adjusting.id} />

              <div className={`p-4 rounded-xl ${s.sectionBg} space-y-1`}>
                <p className={`text-sm font-semibold ${s.textPrimary}`}>{adjusting.productName}</p>
                <p className={`text-xs ${s.textMuted}`}>{adjusting.name} {adjusting.sku && `· ${adjusting.sku}`}</p>
                <div className="flex items-center gap-4 pt-2">
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${s.textMuted}`}>Current</p>
                    <p className={`text-xl font-bold ${s.textPrimary}`}>{adjusting.qty}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${s.textMuted}`}>Threshold</p>
                    <p className={`text-xl font-bold ${s.textMuted}`}>{adjusting.threshold}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Adjustment (+ add, - remove)</label>
                <input name="adjustment" type="number" required className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 ${s.inputBg} ${s.inputRing}`} placeholder="e.g. 10 or -5" />
              </div>

              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Reason</label>
                <select name="reason" className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none ${s.inputBg}`}>
                  <option value="restock">Restock</option>
                  <option value="return">Customer Return</option>
                  <option value="damaged">Damaged / Write-off</option>
                  <option value="correction">Stock Correction</option>
                  <option value="manual">Manual Adjustment</option>
                </select>
              </div>

              {adjState && !adjState.ok && <p className="text-sm text-red-500">{adjState.error}</p>}

              <button type="submit" disabled={adjPending} className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 shadow-lg" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}>
                {adjPending ? "Adjusting..." : "Apply Adjustment"}
              </button>
            </form>
          )}
        </AdminDrawer>
      </div>
  );
}
