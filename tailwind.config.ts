import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        notion: {
          bg: {
            light: "#FFFFFF",
            dark: "#191919",
          },
          sidebar: {
            light: "#F7F6F3",
            dark: "#202020",
          },
          hover: {
            light: "#EFEFED",
            dark: "#2C2C2C",
          },
          ink: {
            primary: "#37352F",
            secondary: "#787774",
            darkPrimary: "#D4D4D4",
            darkSecondary: "#9B9B9B",
          },
          border: {
            light: "rgba(55, 53, 47, 0.09)",
            dark: "rgba(255, 255, 255, 0.09)",
          },
          blue: "#2383E2",
          green: "#0F7B6C",
          amber: "#D9730D",
          red: "#E03E3E",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        devanagari: ["Noto Sans Devanagari", "Mangal", "sans-serif"],
        sanskrit: ["Tiro Devanagari Sanskrit", "Noto Sans Devanagari", "serif"],
        kannada: ["Noto Sans Kannada", "Tunga", "sans-serif"],
        telugu: ["Noto Sans Telugu", "Gautami", "sans-serif"],
        tamil: ["Noto Sans Tamil", "Latha", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        notion: "rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px",
        "notion-hover": "rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, rgba(15, 15, 15, 0.2) 0px 5px 10px",
      },
    },
  },
  plugins: [],
};

export default config;
