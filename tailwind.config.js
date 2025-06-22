/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            light: '#3BA863',
            DEFAULT: '#25D366',
            medium: '#418058',
            dark: '#395443',
          },
          gray: {
            dark: '#2B332E',
            deep: '#28332C',
          }
        },
      },
    },
  },
  plugins: [],
} 