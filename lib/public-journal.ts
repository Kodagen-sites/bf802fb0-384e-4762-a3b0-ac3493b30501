import { createServiceClient } from "@/lib/supabase/server";
import { FK_COL, getScopeId } from "@/lib/db-scope";

export type PublicPost = {
  slug:        string;
  title:       string;
  excerpt:     string;
  imageUrl:    string;
  date:        string;
  authorName?: string;
  content?:    string;
  publishedAt?: string;
};

function staticFallback(): PublicPost[] {
  return [];
}

function mapRow(r: Record<string, unknown>): PublicPost {
  const publishedAt = r.published_at as string | null;
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : (r.created_at
        ? new Date(r.created_at as string).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
        : "");
  return {
    slug:        r.slug as string,
    title:       r.title as string,
    excerpt:     (r.excerpt as string) || "",
    imageUrl:    (r.image_url as string) || "/og.jpg",
    date,
    authorName:  (r.author_name as string) || undefined,
    content:     (r.content as string) || undefined,
    publishedAt: publishedAt ?? undefined,
  };
}

export async function getPublicJournalPosts(): Promise<PublicPost[]> {
  try {
    const supabase = createServiceClient();
    const scopeId  = await getScopeId(supabase);
    if (!scopeId) return staticFallback();

    const { data } = await supabase
      .from("journal_posts")
      .select("slug, title, excerpt, image_url, author_name, published_at, created_at")
      .eq(FK_COL, scopeId)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .order("created_at",   { ascending: false });

    if (!data || data.length === 0) return staticFallback();
    return data.map((r) => mapRow(r as Record<string, unknown>));
  } catch (e) {
    console.error("[getPublicJournalPosts]", e);
    return staticFallback();
  }
}

export async function getPublicJournalPostBySlug(
  slug: string,
): Promise<PublicPost | null> {
  try {
    const supabase = createServiceClient();
    const scopeId  = await getScopeId(supabase);
    if (!scopeId) return null;

    const { data } = await supabase
      .from("journal_posts")
      .select("slug, title, excerpt, image_url, author_name, content, published_at, created_at")
      .eq(FK_COL, scopeId)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (!data) return null;
    return mapRow(data as Record<string, unknown>);
  } catch (e) {
    console.error("[getPublicJournalPostBySlug]", e);
    return null;
  }
}
