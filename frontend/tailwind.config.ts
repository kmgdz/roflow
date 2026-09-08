import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12213A",
          muted: "#4B5768",
          faint: "#8891A0",
        },
        parchment: {
          DEFAULT: "#EFE7D3",
          paper: "#FBF8F0",
        },
        gold: {
          DEFAULT: "#B8863B",
          dim: "#8C6A30",
        },
        verdict: {
          allowed: "#3F6B4F",
          "allowed-bg": "#E4EDE6",
          violation: "#9B4A3F",
          "violation-bg": "#F1E4E1",
          uncertain: "#B8863B",
          "uncertain-bg": "#F1E8D6",
        },
        hairline: "rgba(18, 33, 58, 0.14)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-public-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
