/** @type {import('tailwindcss').Config} */
module.exports = {
  // 'class' rather than the default 'media': dark styling must follow the
  // theme chosen in the admin panel, not the visitor's OS setting.
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { fontFamily: { sans: ['var(--font-body)'], serif: ['var(--font-heading)'] } } },
  plugins: [],
};
