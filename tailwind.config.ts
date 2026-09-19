import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
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
        cream: { DEFAULT: "#F7F3EA", 50: "#FDFCF8", 100: "#F7F3EA", 200: "#EDE4D6", 300: "#E2D6C1", 400: "#D7C8AC", 500: "#CCB997" },
        forest: { DEFAULT: "#12160E", 50: "#2A3122", 100: "#1F2419", 200: "#1A1E14", 300: "#12160E", 400: "#0E110A", 500: "#090B07" },
        clay: { DEFAULT: "#E85D2C", 50: "#FDF6F3", 100: "#FBE5DC", 200: "#F7C8B7", 300: "#F2A58B", 400: "#ED7E5C", 500: "#E85D2C", 600: "#D44F23" },
        sprout: { DEFAULT: "#D4F542", 50: "#FBFED6", 100: "#F2FCAB", 200: "#E5F98A", 300: "#D4F542", 400: "#B8D035", 500: "#9CB528" },
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3rem, 10vw, 8rem)", { lineHeight: "0.9", letterSpacing: "-0.02em" }],
        display: ["clamp(2.5rem, 6vw, 5rem)", { lineHeight: "1", letterSpacing: "-0.01em" }],
        "heading-1": ["clamp(2rem, 4vw, 3.5rem)", { lineHeight: "1.1" }],
        "heading-2": ["clamp(1.5rem, 3vw, 2.5rem)", { lineHeight: "1.2" }],
        "heading-3": ["clamp(1.25rem, 2vw, 1.75rem)", { lineHeight: "1.3" }],
        "heading-4": ["1.125rem", { lineHeight: "1.4" }],
        "body-lg": ["1.125rem", { lineHeight: "1.7" }],
        body: ["1rem", { lineHeight: "1.7" }],
        "body-sm": ["0.875rem", { lineHeight: "1.6" }],
        caption: ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.05em" }],
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in-up": { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "slide-in-left": { "0%": { opacity: "0", transform: "translateX(-20px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "counter-tick": { "0%": { transform: "translateY(100%)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        "leaf-float": { "0%, 100%": { transform: "translateY(0) rotate(0deg)" }, "50%": { transform: "translateY(-10px) rotate(5deg)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        marquee: { "0%": { transform: "translateX(0%)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "slide-in-left": "slide-in-left 0.5s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "leaf-float": "leaf-float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        marquee: "marquee 20s linear infinite",
        counter: "counter-tick 0.5s ease-out forwards",
      },
      transitionTimingFunction: {
        calm: "cubic-bezier(0.4, 0, 0.2, 1)",
        precise: "cubic-bezier(0.22, 1, 0.36, 1)",
        snappy: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      transitionDuration: { "150": "150ms", "300": "300ms", "500": "500ms" },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
