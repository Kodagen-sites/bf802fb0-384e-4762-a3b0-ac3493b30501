import type { Metadata } from 'next';
import { cache } from 'react';
import { createServiceClient } from '@/lib/supabase/server';
import { DB_MODE, FK_COL, KODAGEN_SCHEMA, getScopeId, withSchema } from '@/lib/db-scope';
import { siteConfig } from '@/content/site-config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';
const SLUG     = process.env.NEXT_PUBLIC_SITE_SLUG ?? '';

type SiteDefaults = {
  businessName:    string;
  metaTitle:       string;
  metaDescription: string;
  ogImage:         string;
};

function fallbackDefaults(): SiteDefaults {
  const name = siteConfig.company?.name ?? 'Business';
  return {
    businessName:    name,
    metaTitle:       siteConfig.seo?.defaultTitle ?? name,
    metaDescription: siteConfig.seo?.defaultDescription ?? '',
    ogImage:         siteConfig.seo?.defaultOgImage ?? '/og.jpg',
  };
}

export const getSiteDefaults = cache(async function (): Promise<SiteDefaults> {
  try {
    const fb = fallbackDefaults();

    // Shared mode (Kodagen DB2): no service key is shipped, and sites/
    // site_settings are member-only. Read the public brand fields through the
    // anon-granted `get_public_site` SECURITY DEFINER RPC (migration 010).
    if (DB_MODE === 'shared') {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data } = await withSchema(supabase, KODAGEN_SCHEMA)
        .rpc('get_public_site', { p_slug: SLUG });
      const s = Array.isArray(data) ? data[0] : data;
      if (!s) return fb;
      const name = (s.business_name as string) || (s.name as string) || fb.businessName;
      return {
        businessName:    name,
        metaTitle:       (s.default_meta_title       as string) || fb.metaTitle,
        metaDescription: (s.default_meta_description as string) || fb.metaDescription,
        ogImage:         (s.default_og_image_url     as string) || fb.ogImage,
      };
    }

    // Dedicated mode (customer's own Supabase): the service key is present.
    const supabase = createServiceClient();
    const scopeId  = await getScopeId(supabase);
    if (!scopeId) return fb;

    const { data: settings } = await withSchema(supabase, KODAGEN_SCHEMA)
      .from('site_settings')
      .select('business_name, default_meta_title, default_meta_description, default_og_image_url')
      .eq(FK_COL, scopeId)
      .maybeSingle();

    const name = (settings?.business_name as string) || fb.businessName;

    return {
      businessName:    name,
      metaTitle:       (settings?.default_meta_title       as string) || siteConfig.seo?.defaultTitle       || name,
      metaDescription: (settings?.default_meta_description as string) || siteConfig.seo?.defaultDescription || '',
      ogImage:         (settings?.default_og_image_url     as string) || siteConfig.seo?.defaultOgImage     || '/og.jpg',
    };
  } catch {
    return fallbackDefaults();
  }
});

export async function buildMeta({
  title,
  description,
  image,
  path = '/',
  noIndex = false,
}: {
  title?:       string;
  description?: string;
  image?:       string;
  path?:        string;
  noIndex?:     boolean;
}): Promise<Metadata> {
  const defaults = await getSiteDefaults();

  const resolvedTitle       = title       || defaults.metaTitle;
  const resolvedDescription = description || defaults.metaDescription;
  const resolvedImage       = image       || defaults.ogImage;
  const canonicalUrl        = `${SITE_URL}${path}`;

  return {
    title:       resolvedTitle,
    description: resolvedDescription,
    openGraph: {
      title:       resolvedTitle,
      description: resolvedDescription,
      url:         canonicalUrl,
      images:      [{ url: resolvedImage }],
      type:        'website',
    },
    twitter: {
      card:        'summary_large_image',
      title:       resolvedTitle,
      description: resolvedDescription,
      images:      [resolvedImage],
    },
    robots:     noIndex ? { index: false, follow: false } : { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
  };
}

export { SITE_URL, SLUG };
