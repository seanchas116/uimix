const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        macaron: {
          ...require("./src/colors.json"),
        },
      },
    },
  },
  plugins: [
    require("@thoughtbot/tailwindcss-aria-attributes"),
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".contain-strict": {
          contain: "strict",
        },
      });
    }),
  ],
};
