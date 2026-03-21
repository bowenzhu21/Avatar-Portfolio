import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#04070d",
          900: "#08111c",
          800: "#0d1a29",
        },
        cyan: {
          300: "#66d9ff",
          400: "#35c8ff",
          500: "#0ea5e9",
        },
        sand: {
          100: "#f8f1e8",
          200: "#eadfce",
        },
      },
      boxShadow: {
        panel: "0 24px 80px rgba(4, 7, 13, 0.45)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(102, 217, 255, 0.18), transparent 30%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
