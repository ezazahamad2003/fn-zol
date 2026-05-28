import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border:     "hsl(220 13% 91%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222 47% 11%)",
        muted: {
          DEFAULT:    "hsl(220 14% 96%)",
          foreground: "hsl(220 9% 46%)",
        },
        card: {
          DEFAULT:    "hsl(0 0% 100%)",
          foreground: "hsl(222 47% 11%)",
        },
        primary: {
          DEFAULT:    "hsl(222 47% 11%)",
          foreground: "hsl(0 0% 100%)",
        },
        accent: {
          DEFAULT:    "hsl(220 14% 96%)",
          foreground: "hsl(222 47% 11%)",
        },
        success:  "hsl(142 71% 45%)",
        warning:  "hsl(38 92% 50%)",
        danger:   "hsl(0 84% 60%)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
