import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f4ee",
          100: "#ece6da",
          200: "#cdc2ad",
          300: "#a99776",
          400: "#7a6a4f",
          500: "#4a3f2d",
          600: "#2f2a20",
          700: "#1f1c16",
          800: "#15130f",
          900: "#0c0b08"
        },
        ember: {
          400: "#ffb86b",
          500: "#ff9d3d",
          600: "#f07a1b",
          700: "#c05810"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"]
      },
      boxShadow: {
        glow: "0 0 80px -10px rgba(255, 157, 61, 0.45)"
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")"
      }
    }
  },
  plugins: []
};

export default config;
