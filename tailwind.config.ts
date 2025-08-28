import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Additional futuristic colors
        electric: {
          blue: "hsl(214 100% 47%)",
          cyan: "hsl(158 64% 52%)",
          purple: "hsl(280 100% 70%)",
          pink: "hsl(340 100% 70%)",
          green: "hsl(120 100% 50%)",
        },
        neon: {
          blue: "hsl(214 100% 60%)",
          cyan: "hsl(180 100% 60%)",
          green: "hsl(120 100% 60%)",
          pink: "hsl(320 100% 60%)",
          purple: "hsl(280 100% 60%)",
          yellow: "hsl(60 100% 60%)",
        },
        matrix: {
          green: "hsl(120 100% 50%)",
          dark: "hsl(120 50% 10%)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
        "144": "36rem",
      },
      screens: {
        "3xl": "1600px",
        "4xl": "1920px",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.3s ease-in",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 1.5s infinite",
        "electric": "electric 3s ease-in-out infinite",
        "matrix": "matrix 20s linear infinite",
        "typing": "typing 3.5s steps(30, end), blink-caret 0.75s step-end infinite",
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
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px hsl(var(--primary)), 0 0 10px hsl(var(--primary))" },
          "100%": { boxShadow: "0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary)), 0 0 30px hsl(var(--primary))" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        electric: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        matrix: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        typing: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        "blink-caret": {
          "0%, 50%": { borderColor: "transparent" },
          "51%, 100%": { borderColor: "hsl(var(--primary))" },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 10px hsl(var(--primary) / 0.5)",
        "glow": "0 0 20px hsl(var(--primary) / 0.5)",
        "glow-lg": "0 0 30px hsl(var(--primary) / 0.5)",
        "neon": "0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor",
        "electric": "0 0 20px hsl(214 100% 47%), 0 0 40px hsl(214 100% 47%)",
        "cyber": "0 4px 20px hsl(var(--primary) / 0.3), 0 0 0 1px hsl(var(--primary) / 0.2)",
      },
      backdropBlur: {
        xs: "2px",
      },
      gradientColorStops: {
        "electric-blue": "hsl(214 100% 47%)",
        "electric-cyan": "hsl(158 64% 52%)",
        "neon-pink": "hsl(340 100% 70%)",
        "neon-purple": "hsl(280 100% 70%)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "cyber-grid": "linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)",
        "matrix-rain": "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)",
      },
      backgroundSize: {
        "grid": "20px 20px",
        "grid-sm": "10px 10px",
        "grid-lg": "40px 40px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Custom plugin for futuristic utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-glow': {
          textShadow: `0 0 10px ${theme('colors.primary.DEFAULT')}, 0 0 20px ${theme('colors.primary.DEFAULT')}`,
        },
        '.border-glow': {
          borderColor: theme('colors.primary.DEFAULT'),
          boxShadow: `0 0 10px ${theme('colors.primary.DEFAULT')}`,
        },
        '.glass-panel': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.cyber-border': {
          border: '2px solid',
          borderImage: `linear-gradient(45deg, ${theme('colors.primary.DEFAULT')}, ${theme('colors.accent.DEFAULT')}) 1`,
        },
        '.matrix-text': {
          fontFamily: theme('fontFamily.mono'),
          color: theme('colors.matrix.green'),
          textShadow: `0 0 10px ${theme('colors.matrix.green')}`,
        },
        '.hologram': {
          background: `linear-gradient(45deg, transparent 30%, ${theme('colors.accent.DEFAULT')}22 50%, transparent 70%)`,
          backgroundSize: '20px 20px',
        },
      };
      addUtilities(newUtilities);
    },
  ],
} satisfies Config;
