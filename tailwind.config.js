/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0eeff",
          200: "#bbdcff",
          300: "#7ec0ff",
          400: "#3a9aff",
          500: "#1378f5",
          600: "#0561e0",
          700: "#054db4",
          800: "#0a428f",
          900: "#0e3a76",
          950: "#091f49",
        },
        accent: {
          50: "#f5f3ff",
          100: "#ece8ff",
          200: "#dbd2ff",
          300: "#bdaaff",
          400: "#9b78ff",
          500: "#7d4dff",
          600: "#6c30f4",
          700: "#5d20d8",
          800: "#4b1bb0",
          900: "#3f1990",
        },
        ink: {
          50: "#f7f9fc",
          100: "#eef2f8",
          200: "#dbe3ee",
          300: "#bac6d6",
          400: "#8d9cb1",
          500: "#637088",
          600: "#475669",
          700: "#37445a",
          800: "#22304a",
          900: "#0e1b34",
          950: "#070f24",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Sora",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.05), 0 4px 12px -4px rgba(15, 23, 42, 0.06)",
        "card-lg":
          "0 4px 14px 0 rgba(15, 23, 42, 0.06), 0 12px 40px -10px rgba(15, 23, 42, 0.12)",
        glow: "0 0 0 6px rgba(30, 120, 255, 0.12)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "scale-in": "scale-in 180ms ease-out",
      },
      gridTemplateColumns: {
        15: "repeat(15, minmax(0, 1fr))",
        20: "repeat(20, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
};
