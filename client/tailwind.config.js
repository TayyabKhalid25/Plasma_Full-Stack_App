/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /*
          PLASMA COLOR PALETTE
          Usage:
          - bg-plasma-bg: Main application background
          - bg-plasma-slate: Card and panel backgrounds
          - text-plasma-text-primary: Main headings and body text
          - text-plasma-text-secondary: Helper text and timestamps
          - bg-plasma-primary: Primary buttons and active states
          - bg-plasma-secondary: Accents, live dots, and CTAs
        */
        plasma: {
          bg: "#0D0B14",
          slate: "#1A1726",
          "slate-hover": "#28243D",
          primary: "#563895",
          secondary: "#FF2A7A",
          "text-primary": "#F8F9FA",
          "text-secondary": "#8A869C",
          success: "#2ECC71",
          warning: "#F1C40F",
          error: "#E74C3C",
        },
      },
      fontFamily: {
        /*
          TYPOGRAPHY
          Usage:
          - font-display: For large headings (Rajdhani)
          - font-sans: Standard body text (Inter)
          - font-mono: For XP numbers and technical data (JetBrains Mono)
        */
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-rajdhani)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        /*
          BORDER RADIUS
          Usage: rounded-button, rounded-card, rounded-modal, rounded-input
        */
        button: "8px",
        card: "12px",
        modal: "16px",
        input: "8px",
      },
      spacing: {
        /* 
          SPACING SCALE (4px base)
          Usage: p-1 (4px), m-2 (8px), gap-4 (16px), etc.
        */
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
      },
      backgroundImage: {
        /* Usage: bg-primary-gradient */
        "primary-gradient": "linear-gradient(135deg, #563895, #FF2A7A)",
      },
      boxShadow: {
        /* Usage: shadow-card-glow */
        "card-glow": "0 0 30px rgba(86, 56, 149, 0.25)",
      },
    },
  },
  plugins: [],
}
