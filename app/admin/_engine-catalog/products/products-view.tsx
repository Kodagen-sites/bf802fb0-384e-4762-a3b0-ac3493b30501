"use client";

import { useState, useActionState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import AdminDrawer from "@/components/admin/admin-drawer";
import { useAdminTheme } from "@/lib/admin-theme";
import { getAdminStyles } from "@/lib/admin-styles";
import { useRole } from "@/app/admin/role-context";
import { motion, AnimatePresence } from "framer-motion";
import { SiteConfig } from "@/lib/types";
import {
  Plus, Search, ShoppingBag, Trash2, Star, Package, Eye, EyeOff,
  Tag, DollarSign, BarChart3, Archive, CheckCircle, Edit2,
} from "lucide-react";
import { createProduct, updateProduct, deleteProduct, toggleProductStatus } from "@/app/admin/_actions/catalog-products";
import { CURRENCY_SYMBOL } from "@/lib/currency";

type ProductRow = {
  id: string; name: string; slug: string; description: string;
  images: string[]; price: number; comparePrice: number | null;
  sku: string; categoryId: string; categoryName: string;
  status: "draft" | "published" | "archived"; featured: boolean;
  attributes: Record<string, unknown>; createdAt: string;
};
type CategoryOption = { id: string; name: string };

interface Props { config: SiteConfig; products: ProductRow[]; categories: CategoryOption[] }

const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string; ring: string }> = {
  published: { label: "Published", dot: "bg-green-400", text: "text-green-600", bg: "bg-green-500/10", ring: "ring-green-500/20" },
  draft:     { label: "Draft",     dot: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
  archived:  { label: "Archived",  dot: "bg-gray-400",  text: "text-gray-500",  bg: "bg-gray-500/10",  ring: "ring-gray-500/20" },
};

function StatusPill({ status }: { status: string }) {
  const c = statusConfig[status] ?? statusConfig.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text} ring-1 ${c.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default function ProductsView({ config, products, categories }: Props) {
  return (
    <AdminShell config={config}>
      <ProductsContent products={products} categories={categories} />
    </AdminShell>
  );
}

function ProductsContent({ products, categories }: Omit<Props, "config">) {
  const { has } = useRole();
  const { theme } = useAdminTheme();
  const dark = theme === "dark";
  const s = getAdminStyles(dark);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);

  const [createState, createAction, createPending] = useActionState(createProduct, null);
  const [updateState, updateAction, updatePending] = useActionState(updateProduct, null);
  const [deleteState, deleteAction] = useActionState(deleteProduct, null);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && p.categoryId !== filterCat) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const openCreate = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (p: ProductRow) => { setEditing(p); setDrawerOpen(true); };

  const published = products.filter((p) => p.status === "published").length;
  const drafts = products.filter((p) => p.status === "draft").length;
  const featured = products.filter((p) => p.featured).length;

  return (
      <div className="p-5 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-xl font-bold ${s.textPrimary}`}>Products</h1>
            <p className={`text-sm mt-0.5 ${s.textMuted}`}>{products.length} total &middot; {published} published</p>
          </div>
          {has("products.edit") && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}>
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: products.length, icon: Package, color: "#3b82f6" },
            { label: "Published", value: published, icon: CheckCircle, color: "#22c55e" },
            { label: "Drafts", value: drafts, icon: Edit2, color: "#f59e0b" },
            { label: "Featured", value: featured, icon: Star, color: "#a855f7" },
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${s.inputBg} ${s.inputRing}`} />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={`px-4 py-2.5 rounded-xl text-sm border focus:outline-none ${s.inputBg}`}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`px-4 py-2.5 rounded-xl text-sm border focus:outline-none ${s.inputBg}`}>
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </motion.div>

        {/* Product list */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-20 ${s.cardBg} rounded-2xl border ${s.cardBorder}`}>
            <ShoppingBag className={`w-12 h-12 mx-auto mb-4 ${s.textMuted}`} />
            <p className={s.textSecondary}>No products found</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`${s.cardBg} rounded-2xl border ${s.cardBorder} overflow-hidden`}>
            <div className={`divide-y ${s.divider}`}>
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.03 }}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${s.hoverBg}`}
                  onClick={() => openEdit(p)}
                >
                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-white/5">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className={`w-6 h-6 ${s.textMuted}`} /></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${s.textPrimary}`}>{p.name}</p>
                      {p.featured && <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" />}
                    </div>
                    <p className={`text-xs mt-0.5 ${s.textMuted}`}>
                      {p.categoryName} {p.sku && <>&middot; <span className="font-mono">{p.sku}</span></>}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className={`text-sm font-bold ${s.textPrimary}`}>{CURRENCY_SYMBOL}{p.price.toLocaleString()}</p>
                    {p.comparePrice && (
                      <p className={`text-xs line-through ${s.textMuted}`}>{CURRENCY_SYMBOL}{p.comparePrice.toLocaleString()}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    <StatusPill status={p.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Drawer */}
        <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Product" : "Add Product"}>
          <form action={editing ? updateAction : createAction} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}

            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Product Name *</label>
              <input name="name" defaultValue={editing?.name ?? ""} required className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 ${s.inputBg} ${s.inputRing}`} placeholder="e.g. Ankara Print Dress" />
            </div>

            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Category</label>
              <select name="categoryId" defaultValue={editing?.categoryId ?? ""} className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none ${s.inputBg}`}>
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Price ({CURRENCY_SYMBOL}) *</label>
                <input name="price" type="number" step="0.01" min="0" defaultValue={editing?.price ?? ""} required className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 ${s.inputBg} ${s.inputRing}`} />
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Compare Price</label>
                <input name="comparePrice" type="number" step="0.01" min="0" defaultValue={editing?.comparePrice ?? ""} className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 ${s.inputBg} ${s.inputRing}`} />
              </div>
            </div>

            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>SKU</label>
              <input name="sku" defaultValue={editing?.sku ?? ""} className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 ${s.inputBg} ${s.inputRing}`} placeholder="e.g. ANK-DRS-001" />
            </div>

            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Description</label>
              <textarea name="description" rows={3} defaultValue={editing?.description ?? ""} className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 resize-none ${s.inputBg} ${s.inputRing}`} />
            </div>

            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Images (JSON array)</label>
              <textarea name="images" rows={2} defaultValue={editing ? JSON.stringify(editing.images) : "[]"} className={`w-full px-3 py-2.5 rounded-xl text-sm border font-mono focus:outline-none focus:ring-1 resize-none ${s.inputBg} ${s.inputRing}`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Status</label>
                <select name="status" defaultValue={editing?.status ?? "draft"} className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none ${s.inputBg}`}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="featured" value="true" defaultChecked={editing?.featured ?? false} className="w-4 h-4 rounded" />
                  <span className={`text-sm ${s.textSecondary}`}>Featured</span>
                </label>
              </div>
            </div>

            <input type="hidden" name="attributes" value={editing ? JSON.stringify(editing.attributes) : "{}"} />

            {(createState && !createState.ok) && <p className="text-sm text-red-500">{createState.error}</p>}
            {(updateState && !updateState.ok) && <p className="text-sm text-red-500">{updateState.error}</p>}

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={createPending || updatePending} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 shadow-lg" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}>
                {createPending || updatePending ? "Saving..." : editing ? "Update Product" : "Create Product"}
              </button>
              {editing && has("products.edit") && (
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={editing.id} />
                  <button type="submit" className="px-4 py-2.5 rounded-xl border border-red-500/20 text-red-500 text-sm hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </form>
        </AdminDrawer>
      </div>
  );
}
