export default function AdminShellSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
      <div className="animate-pulse text-sm text-white/60">Loading…</div>
    </div>
  );
}

export function ContentSkeleton() {
  return (
    <div className="p-8 space-y-4">
      <div className="h-8 w-64 rounded bg-white/5 animate-pulse" />
      <div className="h-4 w-96 rounded bg-white/5 animate-pulse" />
      <div className="h-96 w-full rounded bg-white/5 animate-pulse" />
    </div>
  );
}
