"use client";

import { useState, useActionState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import AdminDrawer from "@/components/admin/admin-drawer";
import { useAdminTheme } from "@/lib/admin-theme";
import { getAdminStyles } from "@/lib/admin-styles";
import { useRole } from "@/app/admin/role-context";
import { motion } from "framer-motion";
import { SiteConfig } from "@/lib/types";
import { Plus, FolderTree, Trash2, Package, ChevronRight } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/app/admin/_actions/catalog-categories";

type CategoryRow = {
  id: string; name: string; slug: string; description: string;
  image: string; parentId: string; active: boolean; productCount: number;
};

interface Props { config: SiteConfig; categories: CategoryRow[] }

export default function CategoriesView({ config, categories }: Props) {
  return (
    <AdminShell config={config}>
      <CategoriesContent categories={categories} />
    </AdminShell>
  );
}

function CategoriesContent({ categories }: Omit<Props, "config">) {
  const { has } = useRole();
  const { theme } = useAdminTheme();
  const dark = theme === "dark";
  const s = getAdminStyles(dark);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);

  const [createState, createAction, createPending] = useActionState(createCategory, null);
  const [updateState, updateAction, updatePending] = useActionState(updateCategory, null);
  const [deleteState, deleteAction] = useActionState(deleteCategory, null);

  const openCreate = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (c: CategoryRow) => { setEditing(c); setDrawerOpen(true); };

  const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
      <div className="p-5 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${s.textPrimary}`}>Categories</h1>
            <p className={`text-sm mt-0.5 ${s.textMuted}`}>{categories.length} categories &middot; {totalProducts} products</p>
          </div>
          {has("categories.edit") && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}>
              <Plus className="w-4 h-4" /> Add Category
            </button>
          )}
        </motion.div>

        {/* List */}
        {categories.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-20 ${s.cardBg} rounded-2xl border ${s.cardBorder}`}>
            <FolderTree className={`w-12 h-12 mx-auto mb-4 ${s.textMuted}`} />
            <p className={s.textSecondary}>No categories yet</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${s.cardBg} rounded-2xl border ${s.cardBorder} overflow-hidden`}>
            <div className={`divide-y ${s.divider}`}>
              {categories.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + i * 0.04 }}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${s.hoverBg}`}
                  onClick={() => openEdit(c)}
                >
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.sectionBg}`}>
                      <FolderTree className={`w-5 h-5 ${s.textMuted}`} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${s.textPrimary}`}>{c.name}</p>
                    {c.description && <p className={`text-xs truncate mt-0.5 ${s.textMuted}`}>{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <p className={`text-lg font-bold ${s.textPrimary}`}>{c.productCount}</p>
                      <p className={`text-[10px] uppercase font-medium ${s.textMuted}`}>Products</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${c.active ? "bg-green-500/10 text-green-600 ring-green-500/20" : "bg-gray-500/10 text-gray-500 ring-gray-500/20"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.active ? "bg-green-400" : "bg-gray-400"}`} />
                      {c.active ? "Active" : "Hidden"}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${s.textMuted}`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Drawer */}
        <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Category" : "Add Category"}>
          <form action={editing ? updateAction : createAction} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}

            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Category Name *</label>
              <input name="name" defaultValue={editing?.name ?? ""} required className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 ${s.inputBg} ${s.inputRing}`} placeholder="e.g. Women's Fashion" />
            </div>

            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Description</label>
              <textarea name="description" rows={3} defaultValue={editing?.description ?? ""} className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 resize-none ${s.inputBg} ${s.inputRing}`} />
            </div>

            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Image URL</label>
              <input name="image" defaultValue={editing?.image ?? ""} className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 ${s.inputBg} ${s.inputRing}`} placeholder="https://..." />
            </div>

            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-wider ${s.textLabel} mb-1.5 block`}>Parent Category</label>
              <select name="parentId" defaultValue={editing?.parentId ?? ""} className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none ${s.inputBg}`}>
                <option value="">None (top level)</option>
                {categories.filter((c) => c.id !== editing?.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {editing && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="active" value="true" defaultChecked={editing.active} className="w-4 h-4 rounded" />
                <span className={`text-sm ${s.textSecondary}`}>Active (visible on store)</span>
              </label>
            )}

            {(createState && !createState.ok) && <p className="text-sm text-red-500">{createState.error}</p>}
            {(updateState && !updateState.ok) && <p className="text-sm text-red-500">{updateState.error}</p>}

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={createPending || updatePending} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 shadow-lg" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}>
                {createPending || updatePending ? "Saving..." : editing ? "Update" : "Create"}
              </button>
              {editing && has("categories.edit") && (
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
