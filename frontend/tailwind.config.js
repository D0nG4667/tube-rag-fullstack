/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		extend: {
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
				border: "var(--border)",
				accent: {
					cyan: "#06b6d4",
					violet: "#7c3aed",
				},
			},
			fontFamily: {
				sans: ["var(--font-inter)", "sans-serif"],
			},
		},
	},
	plugins: [],
};
