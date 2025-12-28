/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "sans-serif"], // Keep your existing font
      },
      // ADD THESE EXTENSIONS FOR WHITE-LABELING
      colors: {
        // CSS variables for dynamic partner colors
        primary: "var(--primary-color, #2563EB)",
        secondary: "var(--secondary-color, #059669)",
        text: "var(--text-color, #374151)",
        background: "var(--background-color, #FFFFFF)",
        header: "var(--header-color, #2563EB)",
        border: "var(--border-color, #E5E7EB)",
        link: "var(--link-color, #2563EB)",
        success: "var(--success-color, #10B981)",
        warning: "var(--warning-color, #F59E0B)",
        error: "var(--error-color, #EF4444)",

        // Keep your existing color palette as fallbacks
        sky: {
          800: "#075985", // Default header color
        },
        // Add any other colors you're currently using
      },
      borderRadius: {
        button: "var(--button-radius, 0.375rem)",
        input: "var(--input-border-radius, 0.375rem)",
        card: "var(--card-border-radius, 0.5rem)",
        modal: "var(--modal-border-radius, 0.75rem)",
      },
      spacing: {
        sidebar: "var(--sidebar-width, 16rem)",
        header: "var(--header-height, 4rem)",
      },
      boxShadow: {
        partner:
          "0 4px 6px -1px rgba(var(--primary-color-rgb, 37, 99, 235), 0.1)",
      },
      // Optional: Add custom animations for partner branding
      animation: {
        "partner-pulse":
          "partner-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "partner-pulse": {
          "0%, 100%": {
            opacity: 1,
            backgroundColor: "var(--primary-color, #2563EB)",
          },
          "50%": {
            opacity: 0.8,
            backgroundColor: "var(--secondary-color, #059669)",
          },
        },
      },
    },
  },
  plugins: [],
  // Optional: Add safelist for dynamic partner colors
  safelist: [
    "bg-header",
    "bg-primary",
    "text-primary",
    "border-primary",
    "hover:bg-primary",
    "hover:text-primary",
    "focus:ring-primary",
    "ring-primary",
  ],
};
