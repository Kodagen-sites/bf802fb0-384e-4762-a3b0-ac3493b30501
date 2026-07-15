/**
 * Generation manifest (BUILD ledger — do not delete this block):
 *   brand: Eko Threads          industry: ecommerce (fashion / streetwear)
 *   buildMode: fullsite         asset_mode: prompt-only
 *   archetype: G                style: S6 Fashion Editorial (dark streetwear)
 *   voice_family: V2            color_variant: charcoal-terracotta
 *   card_variant: CV3           cta_variant: CTA1 magnetic
 *   header_variant: split-edges footer_variant: FT2
 *   hero_overlay: HO5 big-stack hero_text: H5              hero_entrance: E2
 *   g_render_mode: n/a (prompt-only → T4 still + parallax)
 *   cart_variant: C1            industry_engine: catalog
 *   fonts: Fraunces (display) · Inter (body) · JetBrains Mono
 */

import assetManifest from "./asset-manifest.json";

const img = (slot: string, fallback = ""): string =>
  ((assetManifest as any)?.images?.[slot] as string) || fallback;

export const siteConfig = {
  company: {
    name: "Eko Threads",
    tagline: "Streetwear cut in Lagos.",
    description:
      "Small-batch streetwear, denim and limited drops made for young Lagos and shipped across Nigeria. Loud graphics, honest fabric, no filler.",
    email: "hello@ekothreads.ng",
    phone: "+234 908 000 0000",
    location: "Yaba, Lagos · Ships nationwide",
  },

  brand: {
    primary: "#e5533a",       // terracotta / clay orange (Lagos-inspired accent)
    accent: "#e5533a",
    bg: "#0d0d0f",            // near-black
  },

  typography: {
    display: "Fraunces",
    body: "Inter",
    mono: "JetBrains Mono",
  },

  industry: "ecommerce",
  cartVariant: "C1",

  seo: {
    siteUrl: "https://ekothreads.ng",
    locale: "en_NG",
    htmlLang: "en-NG",
    defaultTitle: "Eko Threads — Streetwear cut in Lagos.",
    defaultDescription:
      "Small-batch streetwear, dresses, denim and limited drops made in Lagos. Ships across Nigeria via Paystack.",
    defaultOgImage: img("section-og", "/og-default.png"),
    twitterHandle: "@ekothreads",
    noindexPaths: ["/account", "/admin", "/auth", "/api", "/checkout", "/order-confirmation"],
    googleSiteVerification: "",
    structuredData: {
      businessType: "ClothingStore",
      address: {
        streetAddress: "12 Herbert Macaulay Way",
        addressLocality: "Yaba",
        addressRegion: "Lagos",
        postalCode: "101212",
        addressCountry: "NG",
      },
      hours: [
        { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], opens: "10:00", closes: "20:00" },
        { days: ["Sat"], opens: "11:00", closes: "21:00" },
      ],
      priceRange: "₦₦",
      geo: { latitude: 6.5158, longitude: 3.3742 },
      rating: null,
      starRating: null,
      amenities: [],
      cuisine: [],
    },
  },

  socials: {
    instagram: "https://instagram.com/ekothreads",
    twitter: "https://twitter.com/ekothreads",
    facebook: "",
    linkedin: "",
    youtube: "",
    tiktok: "https://tiktok.com/@ekothreads",
    whatsapp: "https://wa.me/2349080000000",
  },

  hero: {
    h1: [
      { text: "Loud fits.", accent: false },
      { text: "Cut in Lagos.", accent: true },
      { text: "Shipped in 48h.", accent: false },
    ],
  },

  tagline: "Streetwear cut in Lagos.",

  servicesHeading: "The collections",

  services: [
    {
      name: "Streetwear tees",
      slug: "streetwear-tees",
      description: "Heavyweight 240gsm cotton, hand-screened graphics, boxy Lagos cut. From ₦12,000.",
      highlights: ["240gsm cotton", "Boxy fit", "Hand-screened locally"],
    },
    {
      name: "Dresses",
      slug: "dresses",
      description: "Casual, occasion, and unbothered. Bias-cut, wrap, mini. Made for the humidity.",
      highlights: ["Bias-cut satin", "Cotton poplin", "Adire panels"],
    },
    {
      name: "Denim & jackets",
      slug: "denim-jackets",
      description: "Oversized jackets, wide-leg jeans, and outerwear built for danfo season and harmattan alike.",
      highlights: ["14oz Japanese denim", "Boxy oversized cut", "Locally trimmed"],
    },
    {
      name: "Accessories & caps",
      slug: "accessories-caps",
      description: "Caps, tote bags, beaded jewellery — the tiny things that finish the fit.",
      highlights: ["Structured 6-panel caps", "Cotton totes", "Bead-work by Lagos artisans"],
    },
    {
      name: "Limited drops",
      slug: "limited-drops",
      description: "Small-batch capsules — usually under 60 pieces. When they're gone, they're gone.",
      highlights: ["Capped runs", "Numbered pieces", "Announced on IG first"],
    },
    {
      name: "Thrift finds",
      slug: "thrift-finds",
      description: "Curated second-hand pieces — one-of-one grails hand-picked from Balogun and Yaba markets.",
      highlights: ["One-of-one", "Steamed & measured", "Ships with story cards"],
    },
  ],

  rooms: [] as Array<any>,
  locations: [] as Array<any>,

  gallery: [
    { src: img("section-lookbook"), alt: "Lookbook editorial 1" },
    { src: img("section-drops"), alt: "Drop rail" },
    { src: img("section-mockup"), alt: "Denim flatlay" },
    { src: img("product-tee-1"), alt: "Graphic tee" },
    { src: img("product-dress-1"), alt: "Dress" },
    { src: img("product-denim-1"), alt: "Denim jacket" },
  ] as Array<{ src: string; alt: string; caption?: string }>,

  products: [
    {
      slug: "lagos-heat-tee",
      name: "Lagos Heat Tee",
      category: "streetwear-tees",
      price: 15000,
      currency: "NGN",
      image: img("product-tee-1"),
      description: "Heavyweight 240gsm boxy tee with hand-screened Lagos Heat graphic on the front. Runs true to size.",
      sizes: ["S", "M", "L", "XL"],
    },
    {
      slug: "danfo-graphic-tee",
      name: "Danfo Graphic Tee",
      category: "streetwear-tees",
      price: 13500,
      currency: "NGN",
      image: img("product-tee-2"),
      description: "Cream-on-black danfo bus print. Boxy cut, 240gsm cotton.",
      sizes: ["S", "M", "L", "XL"],
    },
    {
      slug: "adire-wrap-dress",
      name: "Adire Wrap Dress",
      category: "dresses",
      price: 42000,
      currency: "NGN",
      image: img("product-dress-1"),
      description: "Hand-dyed adire panels on cotton poplin. Wrap tie, midi length.",
      sizes: ["XS", "S", "M", "L"],
    },
    {
      slug: "yaba-denim-jacket",
      name: "Yaba Denim Jacket",
      category: "denim-jackets",
      price: 68000,
      currency: "NGN",
      image: img("product-denim-1"),
      description: "Oversized 14oz Japanese denim, chain-stitched hem, cropped cut. Selvedge edge visible.",
      sizes: ["S", "M", "L", "XL"],
    },
    {
      slug: "eko-6-panel-cap",
      name: "Eko 6-Panel Cap",
      category: "accessories-caps",
      price: 9500,
      currency: "NGN",
      image: img("product-cap-1"),
      description: "Structured 6-panel cap, brass grommets, curved brim. Adjustable snap.",
      sizes: ["One size"],
    },
    {
      slug: "harmattan-capsule",
      name: "Harmattan Capsule Hoodie",
      category: "limited-drops",
      price: 55000,
      currency: "NGN",
      image: img("product-drop-1"),
      description: "Numbered 1/40. Cropped hoodie, 400gsm loopback, hand-embroidered chest crest.",
      sizes: ["S", "M", "L"],
    },
  ],

  whyUs: {
    heading: "Why Eko Threads",
    items: [
      { title: "Made in Lagos", description: "Every piece is cut, sewn and screened within 5km of Yaba. No overseas fast-fashion shortcuts." },
      { title: "Small batches only", description: "Runs are capped so nothing ships wrinkled from a warehouse. When it's gone, it's gone." },
      { title: "48-hour Lagos delivery", description: "Order by 3pm and same-day is possible on the island and mainland. Nationwide via GIG in 3-5 days." },
      { title: "Paystack checkout", description: "Card, transfer, USSD, Opay — pay how you actually pay. No sign-up wall." },
    ],
  },

  process: [
    { step: 1, title: "Browse the drops", description: "Scroll the collections, filter by fit or category." },
    { step: 2, title: "Pick your size", description: "Real body measurements on every product. Not just S/M/L guesswork." },
    { step: 3, title: "Checkout with Paystack", description: "Card, bank transfer, USSD, Opay, or Apple Pay." },
    { step: 4, title: "Get it in 48h", description: "Same-day dispatch for Lagos. GIG nationwide. Track from your inbox." },
  ],

  aboutHeading: "A Lagos label, not a Lagos souvenir.",
  aboutStory:
    "Eko Threads started in a two-bedroom flat off Herbert Macaulay Way in 2022. Two designers, one seamstress, one silkscreen table on the balcony. We didn't want to make African print for foreigners. We wanted to make streetwear that fit the way Lagos actually dresses — boxy, functional, loud when it needs to be, and quiet when it doesn't. Three years in, we run out of most drops in a week. Every stitch still happens in Lagos.",
  manifesto:
    "We won't grow big. We'll grow good.",
  values: [
    { title: "Cut here.", description: "Every garment sewn within 5km of the studio. No exceptions." },
    { title: "Paid fairly.", description: "Above-market piece rates for every seamstress and screen-printer." },
    { title: "Owned by us.", description: "No middlemen, no distributors, no white-label. Studio to shopping bag." },
    { title: "Small on purpose.", description: "Capped drops so nothing sits, nothing wastes, nothing dilutes." },
  ],

  work: [
    { title: "Harmattan 2024 capsule", client: "In-house", service: "Design + production", result: "Sold out in 4 days, 40 units" },
    { title: "Fela Kuti tribute drop", client: "Kalakuta estate collab", service: "Design + licensing", result: "Featured in NYT Style" },
    { title: "Yaba Market pop-up", client: "In-house", service: "Retail activation", result: "2-day pop, 180 walk-ins" },
    { title: "Homecoming Festival merch", client: "Homecoming Lagos", service: "Wholesale + production", result: "500 pieces in 3 weeks" },
    { title: "Danfo graphic series", client: "In-house", service: "Long-form drop", result: "12 SKUs, ongoing bestseller" },
    { title: "Adire modernism series", client: "Ojutu artisans", service: "Design + supply chain", result: "Restocked 3x" },
  ] as Array<{ title: string; client: string; service: string; result: string }>,

  stats: [
    { value: "6,200+", label: "Pieces shipped" },
    { value: "48h", label: "Lagos delivery" },
    { value: "14", label: "Local artisans on payroll" },
    { value: "0", label: "Overseas warehouses" },
  ],

  features: [
    { title: "Made where it's sold.", description: "Every SKU is sewn in Lagos by people we know by name. If a stitch is off, we know exactly which hand ran it." },
    { title: "240gsm heavyweight.", description: "Our default tee weight — no see-through, no fast-fashion droop." },
    { title: "Real Nigerian sizes.", description: "Every piece is measured in cm and shown next to a body chart in the description." },
    { title: "Ships nationwide.", description: "Same-day on Lagos island. GIG anywhere in Nigeria in 3-5 days." },
  ],

  sectionThemeWord: "Lagos.",

  narrative: [] as Array<{ speaker: string; text: string }>,

  mixedMedia: {
    skipSecondaryVideo: true,
    accentEyebrow: "The outcome",
    accentLine: "Streetwear that reads like Lagos — loud when it wants to be, quiet when it needs to be.",
  },

  cta: {
    primary: "Shop the drops",
    secondary: "Browse collections",
  },

  ctaBlock: {
    heading: "New drop this Friday.",
    description: "Sign up for the drop list and get first access + a 10% opening code. Nothing else in your inbox.",
  },

  trustBar: [
    "Paystack secured",
    "48h Lagos delivery",
    "Free returns within 7 days",
    "Made in Lagos",
  ] as string[],

  scrollHero: {
    archetype: "G" as const,
    styleId: "S6",
    assetMode: "prompt-only" as const,
    imageUrl: img("section-hero"),
    scrollDistance: 3,
  },

  headerVariant: "split-edges" as const,
  footerVariant: "FT2" as const,

  footer: {
    variant: "FT2",
    ctaHeadline: "Get on the drop list.",
    brandStatement: "Small-batch streetwear from Yaba, Lagos. Made where it's sold, shipped where you are.",
  },

  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],

  nav: [
    { label: "Shop", href: "/shop" },
    { label: "Collections", href: "/services" },
    { label: "About", href: "/about" },
    { label: "Lookbook", href: "/work" },
    { label: "Contact", href: "/contact" },
  ],

  motion: {
    scrollProgress: true,
    cursorFollower: true,
    intensity: "medium" as const,
  },
} as const;

export type SiteConfig = typeof siteConfig;
