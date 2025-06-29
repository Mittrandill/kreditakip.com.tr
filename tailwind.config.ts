import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(158, 64%, 52%)", // Emerald 500
          foreground: "hsl(180, 100%, 98%)", // Light color for text on primary
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        teal: {
          50: "hsl(174, 90%, 97%)",
          100: "hsl(174, 89%, 92%)",
          200: "hsl(174, 87%, 87%)",
          300: "hsl(174, 76%, 76%)",
          400: "hsl(174, 65%, 56%)",
          500: "hsl(158, 64%, 52%)", // Emerald benzeri
          600: "hsl(158, 64%, 42%)", // Emerald 600
          700: "hsl(174, 84%, 31%)", // Teal 700
          800: "hsl(174, 70%, 21%)",
          900: "hsl(174, 60%, 18%)",
          950: "hsl(174, 83%, 10%)",
        },
        emerald: {
          50: "hsl(151, 81%, 96%)",
          100: "hsl(149, 80%, 90%)",
          200: "hsl(152, 76%, 80%)",
          300: "hsl(156, 72%, 67%)",
          400: "hsl(158, 64%, 52%)",
          500: "hsl(160, 84%, 39%)",
          600: "hsl(158, 64%, 42%)", // Primary emerald
          700: "hsl(162, 94%, 26%)",
          800: "hsl(163, 94%, 24%)",
          900: "hsl(164, 86%, 16%)",
          950: "hsl(166, 91%, 9%)",
        },
        gradient: {
          from: "hsl(158, 64%, 42%)", // Emerald 600
          via: "hsl(174, 84%, 31%)", // Teal 700
          to: "hsl(174, 76%, 76%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
      },
      boxShadow: {
        soft: "0 4px 12px -1px rgba(0, 0, 0, 0.07), 0 2px 8px -2px rgba(0, 0, 0, 0.04)",
        "soft-dark": "0 4px 12px -1px rgba(0, 0, 0, 0.3), 0 2px 8px -2px rgba(0, 0, 0, 0.2)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "emerald-gradient": "linear-gradient(135deg, hsl(158, 64%, 42%) 0%, hsl(174, 84%, 31%) 100%)",
        "emerald-subtle": "linear-gradient(135deg, hsl(151, 81%, 96%) 0%, hsl(149, 80%, 90%) 100%)",
        "emerald-dark": "linear-gradient(135deg, hsl(158, 64%, 35%) 0%, hsl(174, 84%, 25%) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
