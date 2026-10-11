import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--page)",
        muted: "var(--muted)",
        card: "var(--card)",
        footer: "var(--footer)",
        line: "var(--line)",
        hairline: "var(--hairline)",
        ink: "var(--ink)",
        strong: "var(--strong)",
        soft: "var(--soft)",
        faint: "var(--faint)",
        chip: "var(--chip)",
        tint: "var(--tint)",
        invert: "var(--invert)",
        "invert-ink": "var(--invert-ink)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover: "var(--primary-hover)",
          text: "var(--primary-text)",
        },
        danger: "var(--danger)",
        success: "var(--success)",
      },
      fontFamily: {
        sans: ["Instrument Sans Variable", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Instrument Sans Variable", "Helvetica Neue", "Segoe UI", "Arial", "sans-serif"],
        mono: ["JetBrains Mono Variable", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        card: "20px",
        panel: "30px",
      },
      maxWidth: {
        site: "76rem",
        wide: "1520px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
      },
    },
  },
  plugins: [],
};

export default config;
