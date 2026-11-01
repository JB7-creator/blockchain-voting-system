/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        devote: {
          bg: "#0a0a0f",
          panel: "rgba(255,255,255,0.05)",
          panelStrong: "rgba(255,255,255,0.08)",
          border: "rgba(255,255,255,0.1)",
          borderStrong: "rgba(255,255,255,0.18)",
          text: "#f8fafc",
          muted: "#9ca3af",
          faint: "#5b6472",
          green: "#00ff88",
          indigo: "#6366f1",
          blue: "#38bdf8",
          amber: "#fbbf24",
          red: "#fb7185",
        },
      },
      boxShadow: {
        glow: "0 0 34px rgba(0,255,136,0.25)",
        indigoGlow: "0 0 34px rgba(99,102,241,0.24)",
        glass: "0 24px 80px rgba(0,0,0,0.32)",
      },
      backgroundImage: {
        "radial-grid":
          "radial-gradient(circle at 20% 10%, rgba(0,255,136,0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(99,102,241,0.2), transparent 30%), linear-gradient(180deg, #0a0a0f 0%, #0b0d14 100%)",
        "kenya-scan":
          "linear-gradient(135deg, rgba(0,255,136,0.14), rgba(99,102,241,0.08)), radial-gradient(circle at center, rgba(255,255,255,0.14), transparent 55%)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(0,255,136,0)" },
          "50%": { boxShadow: "0 0 34px rgba(0,255,136,0.35)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 700ms ease-out both",
        slideUp: "slideUp 650ms ease-out both",
        "pulse-glow": "pulse-glow 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
