import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1A1F24",
          muted: "#5C6570",
        },
        paper: {
          DEFAULT: "#F4F1EA",
          raised: "#FFFdf8",
        },
        line: "#D9D3C7",
        brand: {
          DEFAULT: "#1B3A4B",
          hover: "#152F3D",
        },
        status: {
          ok: "#1F6B4A",
          "ok-bg": "#E8F4EE",
          warn: "#8A5A12",
          "warn-bg": "#F8EFD9",
          bad: "#9B2C2C",
          "bad-bg": "#F8E8E8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(26, 31, 36, 0.06)",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
