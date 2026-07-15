// components/marketing/NewsletterSignup.tsx
//
// Email capture form for newsletter / promotions.
// Three variants: footer (compact), inline (medium), and popup (full).
// Writes directly to subscribers table with anon RLS policy.
//
// Industry conditionally enabled: when manifest.subscribers_enabled = true
// (typically e-commerce, hospitality, conferences, fitness, churches).

"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Variant = "footer" | "inline" | "popup";

type Props = {
  variant?: Variant;
  source: string;            // 'footer_signup' | 'popup' | 'checkout_optin' | 'inline_block'
  heading?: string;
  description?: string;
  ctaLabel?: string;
  successMessage?: string;
  tags?: string[];           // e.g. ['newsletter', 'promotions']
};

export function NewsletterSignup({
  variant = "inline",
  source,
  heading = "Stay in the loop",
  description = "Occasional emails. Unsubscribe any time.",
  ctaLabel = "Subscribe",
  successMessage = "You're subscribed. Watch your inbox.",
  tags = ["newsletter"],
}: Props) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    
    try {
      const { error } = await supabase.from("subscribers").insert({
        email: email.trim().toLowerCase(),
        name: name.trim() || null,
        source,
        tags,
        consent_given_at: new Date().toISOString(),
      });
      
      if (error) {
        // Duplicate email — silently treat as success (don't disclose)
        if (error.code === "23505") {
          setDone(true);
          return;
        }
        toast.error("Couldn't sign you up. Please try again.");
        return;
      }
      
      setDone(true);
      toast.success(successMessage);
    } finally {
      setLoading(false);
    }
  };
  
  if (done) {
    return (
      <div className={`flex items-center gap-2 ${variant === "footer" ? "text-sm" : ""}`}>
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <span>{successMessage}</span>
      </div>
    );
  }
  
  // Footer variant — compact, single-line
  if (variant === "footer") {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={loading} size="sm">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : ctaLabel}
        </Button>
      </form>
    );
  }
  
  // Inline / Popup — full form with name field
  return (
    <div className={variant === "popup" ? "max-w-md" : ""}>
      {heading && <h3 className="text-lg font-semibold mb-2">{heading}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Subscribing...</> : ctaLabel}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          By subscribing you agree to receive marketing emails. Unsubscribe any time.
        </p>
      </form>
    </div>
  );
}
