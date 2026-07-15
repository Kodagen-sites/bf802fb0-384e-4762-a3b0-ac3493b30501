import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        "bg-2": "var(--color-bg-2)",
        "bg-3": "var(--color-bg-3)",
        "bg-4": "var(--color-bg-4)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        ink: "var(--color-ink)",
        "ink-2": "var(--color-ink-2)",
        "ink-3": "var(--color-ink-3)",
        line: "var(--color-line)",
        card: "var(--color-card)",
        "card-2": "var(--color-card-2)",
        surface: "var(--color-card)",
        border: "var(--color-line)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
        serif: ["var(--font-display)"],
      },
      fontSize: {
        "10xl": "10rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
