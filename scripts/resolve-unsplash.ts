/**
 * resolve-unsplash.ts
 *
 * Prompt-only-mode counterpart to generate-images.ts. Instead of calling
 * Gemini live-gen, this script resolves industry-relevant Unsplash photos
 * at build time via the platform's centralized /api/asset/unsplash endpoint
 * (the platform holds UNSPLASH_ACCESS_KEY — tenants never see it).
 *
 * Inputs:
 *   content/unsplash-slots.json   — array the agent writes during scaffold:
 *     [
 *       { "slot": "section-hero",    "keyword": "luxury hotel suite", "orientation": "landscape" },
 *       { "slot": "section-about",   "keyword": "hotel lobby",        "orientation": "landscape" },
 *       { "slot": "service-spa",     "keyword": "spa treatment room", "orientation": "portrait"  },
 *       ...
 *     ]
 *   The agent picks industry-aware keywords per slot (e.g. for a boutique
 *   hotel: hero=luxury hotel suite, about=hotel lobby architecture).
 *
 * Output:
 *   content/asset-manifest.json   — { images: { [slot]: directCdnUrl } }
 *
 * The returned URL is a direct images.unsplash.com CDN URL with inline
 * sizing transforms (?w=&h=&fit=crop&q=80&auto=format) — no Authorization
 * header needed from the browser, no proxy required at runtime.
 *
 * Required env:
 *   KODAGEN_ASSET_API_URL     e.g. http://localhost:3000 (local-tier)
 *                             or https://kodaaxis.com (Fly-tier)
 *   KODAGEN_PROJECT_ID        the build's UUID
 *
 * Optional env:
 *   KODAGEN_BUILD_TOKEN       JWT for endpoint auth
 *   UNSPLASH_DELAY_MS         ms between batches (default 200)
 *   UNSPLASH_CONCURRENCY      parallel calls (default 5)
 *   UNSPLASH_INDUSTRY         fallback industry hint for slots without one
 */

import { readFile, writeFile, mkdir, open, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

const API_URL = process.env.KODAGEN_ASSET_API_URL;
const PROJECT_ID = process.env.KODAGEN_PROJECT_ID;
const BUILD_TOKEN = process.env.KODAGEN_BUILD_TOKEN;
const DEFAULT_INDUSTRY = process.env.UNSPLASH_INDUSTRY ?? "";

if (!API_URL || !PROJECT_ID) {
  console.error("✗ KODAGEN_ASSET_API_URL and KODAGEN_PROJECT_ID must be set.");
  console.error("  These are normally injected by the Kodagen platform.");
  process.exit(1);
}

const CONCURRENCY = Math.max(1, parseInt(process.env.UNSPLASH_CONCURRENCY ?? "5", 10));
const DELAY_MS = parseInt(process.env.UNSPLASH_DELAY_MS ?? "200", 10);

const SLOTS_PATH = "content/unsplash-slots.json";
const MANIFEST_PATH = "content/asset-manifest.json";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface SlotSpec {
  slot: string;
  keyword?: string;
  industry?: string;
  orientation?: "landscape" | "portrait" | "squarish";
  w?: number;
  h?: number;
}

interface Manifest {
  bucket: string;
  projectId: string;
  ref: string;
  images: Record<string, string>;
  videos: Record<string, string>;
  frames: Record<string, string[]>;
  updatedAt: string;
}

interface EndpointResp {
  url: string;
  photoId: string | null;
  photographer: string | null;
  photographerUrl: string | null;
  unsplashUrl: string | null;
  altDescription: string | null;
}

async function readManifest(): Promise<Manifest> {
  if (!existsSync(MANIFEST_PATH)) {
    return {
      bucket: "site-assets",
      projectId: PROJECT_ID!,
      ref: "",
      images: {},
      videos: {},
      frames: {},
      updatedAt: new Date().toISOString(),
    };
  }
  const raw = await readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as Manifest;
}

async function writeManifest(m: Manifest): Promise<void> {
  m.updatedAt = new Date().toISOString();
  await mkdir(dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(m, null, 2));
}

// Cross-process mutex on the manifest — IDENTICAL lock path + protocol to
// scripts/_storage.ts (recordImage/Video/Frames), so gen:unsplash and
// gen:images/gen:videos coordinate when the agent runs them in parallel.
// Without this, this script's one big end-of-run writeManifest overwrote the
// images that gen:images recorded in the meantime, wiping its slots (and vice
// versa) — build ca7371ff. Always re-read INSIDE the lock and merge only the
// slots THIS run resolved, never a stale whole-manifest snapshot.
const LOCK_PATH = MANIFEST_PATH + ".lock";

async function mergeResolvedImages(resolvedImages: Record<string, string>): Promise<void> {
  await mkdir(dirname(MANIFEST_PATH), { recursive: true });
  for (let i = 0; i < 200; i++) {
    let fh;
    try {
      fh = await open(LOCK_PATH, "wx"); // atomic create-exclusive
    } catch (e: any) {
      if (e?.code === "EEXIST") { await sleep(50); continue; } // held — retry
      throw e;
    }
    try {
      const disk = await readManifest();              // current on-disk state
      Object.assign(disk.images, resolvedImages);     // merge ONLY our slots
      await writeManifest(disk);
      return;
    } finally {
      await fh.close();
      await rm(LOCK_PATH, { force: true });
    }
  }
  // ~10s without the lock → assume a crashed holder, clear and merge anyway.
  await rm(LOCK_PATH, { force: true }).catch(() => {});
  const disk = await readManifest();
  Object.assign(disk.images, resolvedImages);
  await writeManifest(disk);
}

async function readSlots(): Promise<SlotSpec[]> {
  if (!existsSync(SLOTS_PATH)) {
    console.error(`✗ ${SLOTS_PATH} not found.`);
    console.error("  The agent must write this file before running gen:unsplash.");
    console.error("  Format: [{ slot, keyword, industry?, orientation? }, ...]");
    process.exit(1);
  }
  const raw = await readFile(SLOTS_PATH, "utf8");
  const data = JSON.parse(raw);
  // Agents drift on this file's shape (observed 2026-07-05: `{"slots":[{"id","query"}]}`
  // instead of the documented bare array of `{slot, keyword}` — every image
  // silently skipped). Accept the common drifts instead of dying.
  const arr = Array.isArray(data) ? data
    : Array.isArray(data?.slots) ? data.slots
    : Array.isArray(data?.images) ? data.images
    : null;
  if (!arr) {
    console.error(`✗ ${SLOTS_PATH} must be a JSON array (or {"slots":[...]}).`);
    process.exit(1);
  }
  const specs = (arr as Record<string, unknown>[]).map((s) => ({
    ...s,
    slot: String(s.slot ?? s.id ?? s.name ?? ""),
    keyword: String(s.keyword ?? s.query ?? s.search ?? ""),
  })) as SlotSpec[];
  const dropped = specs.filter((s) => !s.slot);
  if (dropped.length) console.error(`✗ dropping ${dropped.length} entr(ies) with no slot/id field`);
  return specs.filter((s) => s.slot);
}

async function resolveOne(spec: SlotSpec): Promise<EndpointResp> {
  const params = new URLSearchParams({
    projectId: PROJECT_ID!,
    slot: spec.slot,
    seed: spec.slot,
  });
  if (spec.keyword) params.set("keyword", spec.keyword);
  const industry = spec.industry || DEFAULT_INDUSTRY;
  if (industry) params.set("industry", industry);
  params.set("orientation", spec.orientation ?? "landscape");
  if (spec.w) params.set("w", String(spec.w));
  if (spec.h) params.set("h", String(spec.h));

  const r = await fetch(`${API_URL}/api/asset/unsplash?${params.toString()}`, {
    headers: BUILD_TOKEN ? { Authorization: `Bearer ${BUILD_TOKEN}` } : {},
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`HTTP ${r.status}: ${body.slice(0, 300)}`);
  }
  return (await r.json()) as EndpointResp;
}

async function main(): Promise<void> {
  const slots = await readSlots();
  if (slots.length === 0) {
    console.log("[unsplash] no slots in unsplash-slots.json — nothing to do.");
    return;
  }

  const manifest = await readManifest();           // for skip-checks only
  const resolvedImages: Record<string, string> = {}; // ONLY slots we resolve now
  let resolved = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`[unsplash] resolving ${slots.length} slot(s) via ${API_URL}/api/asset/unsplash`);

  for (let i = 0; i < slots.length; i += CONCURRENCY) {
    const batch = slots.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async (spec) => {
      if (manifest.images[spec.slot]) {
        skipped++;
        return { spec, ok: true as const, skipped: true };
      }
      if (!spec.keyword && !spec.industry && !DEFAULT_INDUSTRY) {
        console.warn(`[unsplash] ${spec.slot}: no keyword/industry — skipping`);
        failed++;
        return { spec, ok: false as const };
      }
      try {
        const r = await resolveOne(spec);
        manifest.images[spec.slot] = r.url;   // local copy (skip-checks)
        resolvedImages[spec.slot] = r.url;    // merged onto disk under lock

        console.log(`  ✓ ${spec.slot} → ${r.photoId ?? "?"} (photo by ${r.photographer ?? "?"})`);
        resolved++;
        return { spec, ok: true as const, skipped: false };
      } catch (err: any) {
        console.warn(`  ✗ ${spec.slot}: ${err?.message ?? err}`);
        failed++;
        return { spec, ok: false as const };
      }
    }));
    void results;
    if (i + CONCURRENCY < slots.length && DELAY_MS > 0) await sleep(DELAY_MS);
  }

  await mergeResolvedImages(resolvedImages);   // lock + re-read + merge (race-safe)

  console.log(`[unsplash] done — ${resolved} resolved, ${skipped} skipped (already in manifest), ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("✗ unsplash resolution failed:", err);
  process.exit(1);
});
