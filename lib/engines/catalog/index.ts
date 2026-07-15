/* eslint-disable @typescript-eslint/no-explicit-any */
// Catalog engine — CANONICAL keyless implementation for Full Site + Admin
// builds on the shared tenant DB. Copy this file to lib/engines/catalog/index.ts
// (or lib/engines/_services.ts) — do NOT replace it with a permissive no-op
// stub: a services layer that "degrades gracefully" silently discards every
// product/category/inventory edit the owner makes.
//
// Store: the PUBLIC schema tables (products / categories / orders) — the same
// tables the keyless visitor lane uses (`place_order` reprices from
// public.products, migration 012 grants member RLS on all three). Writing the
// `catalog.*` schema instead would disconnect the admin from the shop: owner
// products would never affect visitor pricing.
//
// public.products carries the engine-only fields (sku / attributes /
// compare_at_price_cents / status) inside its `metadata` jsonb; is_published
// mirrors status === "published" so the public shop and `place_order` see
// exactly what the owner published.

type Db = any; // authenticated server client (member RLS) — createClient()

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type EngineMeta = {
  sku?: string;
  status?: string;
  attributes?: Record<string, unknown>;
  compare_at_price_cents?: number | null;
};

function mapProduct(row: any) {
  const meta: EngineMeta = (row.metadata?.engine ?? {}) as EngineMeta;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    images: (row.gallery ?? (row.image_url ? [row.image_url] : [])) as string[],
    base_price_cents: row.price_cents ?? 0,
    compare_at_price_cents: meta.compare_at_price_cents ?? null,
    sku: meta.sku ?? null,
    category_id: row.category_id,
    status: meta.status ?? (row.is_published ? "published" : "draft"),
    featured: row.is_featured ?? false,
    attributes: (meta.attributes ?? {}) as Record<string, unknown>,
    created_at: row.created_at,
    updated_at: row.updated_at,
    stock_quantity: row.stock_quantity as number | null,
    in_stock: row.in_stock !== false,
  };
}

type ProductInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  category_id?: string | null;
  base_price_cents?: number;
  compare_at_price_cents?: number | null;
  sku?: string | null;
  status?: string;
  featured?: boolean;
  images?: string[];
  attributes?: Record<string, unknown>;
};

function productPatch(input: ProductInput, existingMeta: EngineMeta = {}) {
  const patch: Record<string, unknown> = {};
  const meta: EngineMeta = { ...existingMeta };
  if (input.name !== undefined) { patch.name = input.name; patch.slug = input.slug ?? slugify(input.name); }
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.description !== undefined) patch.description = input.description;
  if (input.category_id !== undefined) patch.category_id = input.category_id || null;
  if (input.base_price_cents !== undefined) patch.price_cents = input.base_price_cents;
  if (input.images !== undefined) { patch.gallery = input.images; patch.image_url = input.images[0] ?? null; }
  if (input.featured !== undefined) patch.is_featured = input.featured;
  if (input.status !== undefined) { meta.status = input.status; patch.is_published = input.status === "published"; }
  if (input.sku !== undefined) meta.sku = input.sku ?? undefined;
  if (input.attributes !== undefined) meta.attributes = input.attributes;
  if (input.compare_at_price_cents !== undefined) meta.compare_at_price_cents = input.compare_at_price_cents;
  patch.metadata = { engine: meta };
  patch.updated_at = new Date().toISOString();
  return patch;
}

function mapCategory(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: null as string | null, // public.categories has no image column
    parent_id: row.parent_id,
    sort_order: row.sort_order ?? 0,
    active: row.is_active !== false,
    created_at: row.created_at,
  };
}

async function must(p: PromiseLike<{ data: any; error: { message: string } | null }>): Promise<any> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

const catalogServices = {
  // ── Products ──────────────────────────────────────────────────────────────
  async listProducts(sb: Db, siteId: string) {
    const rows = await must(sb.from("products").select("*").eq("site_id", siteId)
      .order("sort_order", { ascending: true }).order("created_at", { ascending: false }));
    return (rows ?? []).map(mapProduct);
  },

  async createProduct(sb: Db, siteId: string, input: ProductInput) {
    const patch = productPatch({ status: "draft", images: [], ...input });
    const row = await must(sb.from("products")
      .insert({ site_id: siteId, in_stock: true, ...patch })
      .select("*").single());
    return mapProduct(row);
  },

  async updateProduct(sb: Db, siteId: string, id: string, input: ProductInput) {
    const existing = await must(sb.from("products").select("metadata").eq("site_id", siteId).eq("id", id).single());
    const patch = productPatch(input, (existing?.metadata?.engine ?? {}) as EngineMeta);
    const row = await must(sb.from("products").update(patch)
      .eq("site_id", siteId).eq("id", id).select("*").single());
    return mapProduct(row);
  },

  async deleteProduct(sb: Db, siteId: string, id: string) {
    await must(sb.from("products").delete().eq("site_id", siteId).eq("id", id).select("id"));
    return { id };
  },

  // ── Categories ────────────────────────────────────────────────────────────
  async listCategories(sb: Db, siteId: string) {
    const rows = await must(sb.from("categories").select("*").eq("site_id", siteId)
      .order("sort_order", { ascending: true }));
    return (rows ?? []).map(mapCategory);
  },

  async createCategory(sb: Db, siteId: string, input: { name: string; description?: string; image?: string; parent_id?: string }) {
    const row = await must(sb.from("categories").insert({
      site_id: siteId,
      name: input.name,
      slug: slugify(input.name),
      description: input.description ?? null,
      parent_id: input.parent_id ?? null,
      is_active: true,
    }).select("*").single());
    return mapCategory(row);
  },

  async updateCategory(sb: Db, siteId: string, id: string, input: { name?: string; slug?: string; description?: string | null; image?: string | null; active?: boolean }) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) { patch.name = input.name; patch.slug = input.slug ?? slugify(input.name); }
    if (input.description !== undefined) patch.description = input.description;
    if (input.active !== undefined) patch.is_active = input.active;
    const row = await must(sb.from("categories").update(patch)
      .eq("site_id", siteId).eq("id", id).select("*").single());
    return mapCategory(row);
  },

  async deleteCategory(sb: Db, siteId: string, id: string) {
    await must(sb.from("categories").delete().eq("site_id", siteId).eq("id", id).select("id"));
    return { id };
  },

  // ── Inventory (public lane has no variants table — one pseudo-variant per
  //    product, backed by products.stock_quantity / in_stock) ────────────────
  async listVariants(sb: Db, siteId: string, productId: string) {
    const row = await must(sb.from("products").select("*").eq("site_id", siteId).eq("id", productId).maybeSingle());
    if (!row) return [];
    const p = mapProduct(row);
    return [{
      id: p.id, // variantId === productId in the public lane
      product_id: p.id,
      name: "Default",
      sku: p.sku,
      inventory_qty: p.stock_quantity ?? 0,
      low_stock_threshold: 5,
      active: p.in_stock,
      price_cents: p.base_price_cents,
    }];
  },

  async adjustInventory(sb: Db, siteId: string, variantId: string, adjustment: number, _reason?: string, _userId?: string) {
    const row = await must(sb.from("products").select("stock_quantity").eq("site_id", siteId).eq("id", variantId).single());
    const next = Math.max(0, (row?.stock_quantity ?? 0) + adjustment);
    await must(sb.from("products")
      .update({ stock_quantity: next, in_stock: next > 0, updated_at: new Date().toISOString() })
      .eq("site_id", siteId).eq("id", variantId).select("id"));
    return { variant_id: variantId, inventory_qty: next };
  },

  async getInventoryLog(_sb: Db, _siteId: string, _opts?: { limit?: number }) {
    return []; // no inventory_log table in the public lane
  },

  // ── Orders (list/read is queried directly by the pages; transitions here) ─
  async transitionOrderState(sb: Db, siteId: string, orderId: string, newState: string, reason?: string) {
    const patch: Record<string, unknown> = { status: newState, updated_at: new Date().toISOString() };
    if (newState === "cancelled" && reason) patch.notes = reason;
    const row = await must(sb.from("orders").update(patch)
      .eq("site_id", siteId).eq("id", orderId).select("id,status").single());
    return { id: row.id, state: row.status, reference: String(row.id).slice(0, 8).toUpperCase() };
  },
};

// Unimplemented engine calls (other engines' dead action files) resolve to []
// so they type-check and no-op — but every CATALOG surface above is real.
// The awaited result behaves both as an array (so `.map`/`.find` callbacks
// receive a typed `any` element instead of an implicit-any error) and as an
// object (so single-record calls can read properties).
type AnyResult = any[] & Record<string, any>;
type ServiceFn = (...args: any[]) => Promise<AnyResult>;
export const services: Record<string, ServiceFn> = new Proxy(catalogServices as unknown as Record<string, ServiceFn>, {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    return async () => [] as unknown as AnyResult;
  },
});

export type ProductStatus = string;
export type OrderState = string;
export type OrderStatus = string;
export type CategoryStatus = string;
