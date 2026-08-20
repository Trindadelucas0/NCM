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
          DEFAULT: "#FFFFFF",
          raised: "#FFFFFF",
          sunken: "#F1F5F2",
        },
        line: {
          DEFAULT: "#C3CEC7",
          strong: "#1A1F24",
        },
        brand: {
          DEFAULT: "#2EA44F",
          hover: "#248A41",
          soft: "#DFF0E4",
        },
        status: {
          ok: "#1F7A45",
          "ok-bg": "#E4F5EA",
          warn: "#1A1F24",
          "warn-bg": "#FFF6D6",
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
