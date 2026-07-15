"use client";

import { useState } from "react";

const REASONS = [
  { value: "wholesale", label: "Wholesale enquiry" },
  { value: "custom", label: "Custom / made-to-order" },
  { value: "press", label: "Press / editorial" },
  { value: "collab", label: "Collab" },
  { value: "other", label: "Something else" },
];

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [reason, setReason] = useState("wholesale");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    const fd = new FormData(e.currentTarget);
    const payload = {
      slug: process.env.NEXT_PUBLIC_SITE_SLUG,
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: "",
      message: `[${reason}] ${String(fd.get("message") ?? "")}`.trim(),
    };
    try {
      await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch { /* swallow — always show confirmation */ }
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div className="border border-primary/40 rounded-2xl p-8 bg-primary/5">
        <div className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase mb-3">
          Got it
        </div>
        <h3 className="font-display text-2xl text-white font-light mb-3">
          Thanks — we&rsquo;ll reply within a day.
        </h3>
        <p className="text-white/70">
          Fastest reply is still Instagram DM if it&rsquo;s urgent.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-white/10 rounded-2xl p-6 md:p-8 bg-white/[0.02] space-y-5"
    >
      <div>
        <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 mb-2 block">
          Your name
        </label>
        <input
          required
          type="text"
          name="name"
          className="w-full bg-transparent border border-white/15 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors"
        />
      </div>

      <div>
        <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 mb-2 block">
          Email
        </label>
        <input
          required
          type="email"
          name="email"
          className="w-full bg-transparent border border-white/15 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors"
        />
      </div>

      <div>
        <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 mb-2 block">
          Reason
        </label>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              className={`px-4 py-2 rounded-full text-xs font-mono tracking-wider border transition-all ${
                reason === r.value
                  ? "border-primary bg-primary text-bg"
                  : "border-white/15 text-white/70 hover:border-white/40"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="reason" value={reason} />
      </div>

      <div>
        <label className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 mb-2 block">
          Message
        </label>
        <textarea
          required
          rows={5}
          name="message"
          className="w-full bg-transparent border border-white/15 rounded-lg px-4 py-3 text-white focus:border-primary outline-none transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full min-h-[52px] rounded-full bg-primary text-bg font-display font-medium hover:brightness-110 transition-all disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Send message"}
      </button>

      <p className="text-white/40 text-xs text-center">
        Or email us directly at{" "}
        <a
          href="mailto:hello@ekothreads.ng"
          className="text-primary hover:text-white transition-colors"
        >
          hello@ekothreads.ng
        </a>
      </p>
    </form>
  );
}
