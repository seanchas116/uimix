import plugin from "tailwindcss/plugin.js";
import colors from "./src/colors.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        macaron: colors,
      },
    },
  },
  plugins: [
    await import("@thoughtbot/tailwindcss-aria-attributes"),
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".contain-strict": {
          contain: "strict",
        },
      });
    }),
  ],
};