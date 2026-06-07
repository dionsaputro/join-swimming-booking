import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    { pattern: /bg-brand-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /text-brand-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /border-brand-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /shadow-brand-(600)/ },
    { pattern: /ring-brand-(200|500)/ },
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#0F1A3E",
          800: "#1B2E5A",
          700: "#1E3A6E",
          600: "#2563EB",
          500: "#3B82F6",
          400: "#60A5FA",
          300: "#93C5FD",
          200: "#BFDBFE",
          100: "#DBEAFE",
          50: "#EFF6FF",
        },
        accent: "#38BDF8",
      },
      fontFamily: {
        display: ['"DM Serif Display"', "serif"],
        body: ['"DM Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
