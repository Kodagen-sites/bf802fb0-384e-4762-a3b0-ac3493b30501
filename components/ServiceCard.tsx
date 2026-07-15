import Link from "next/link";

/**
 * CV3 — Hover-Swap Grayscale
 *
 * Full-bleed image card. Grayscale by default, color on hover with slight
 * zoom. Text overlays at bottom with gradient fade. Rich visual.
 *
 * Use when:
 *   - Creative / visual-forward industries
 *   - Styles: S1, S7, S8, S10
 *   - Personality: playful, dreamy, technical-with-richness
 *   - Good imagery available for every service
 *
 * Recommended grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`
 */

type Service = {
  slug: string;
  name: string;
  description: string;
};

type Props = {
  service: Service;
  index?: number;
  imageSrc?: string;
};

export default function ServiceCardV3({ service, imageSrc }: Props) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group relative block rounded-xl overflow-hidden aspect-[4/5] border border-white/10 hover:border-primary/40 transition-colors"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-white/5 to-accent/30">
        {imageSrc && (
          <img
            src={imageSrc}
            alt={service.name}
            className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-700 ease-out"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary/80 mb-2">
          Service
        </div>
        <h3 className="font-display text-xl md:text-2xl text-white leading-tight mb-2">
          {service.name}
        </h3>
        <p className="text-white/70 text-xs md:text-sm leading-snug line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
          {service.description}
        </p>
      </div>

      <div className="absolute top-0 left-0 h-0.5 bg-primary w-0 group-hover:w-full transition-all duration-700 ease-out" />
    </Link>
  );
}
