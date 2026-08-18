import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b3ccff",
          300: "#80abff",
          400: "#4d84ff",
          500: "#2b63f2",
          600: "#1e4bd1",
          700: "#1a3ca8",
          800: "#183485",
          900: "#182e6b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
