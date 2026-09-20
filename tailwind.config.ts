import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

// Palette entries that change with the theme: a CSS variable of RGB channels, so `bg-forest-50/50` still works.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

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
        // cream = surfaces, forest = text/borders, pale sprouts = tinted surfaces. All flip in dark mode via the
        // variables in globals.css (forest is inverted there). For colours that must NOT flip, use ink / paper below.
        cream: { DEFAULT: v("cream-100"), 50: v("cream-50"), 100: v("cream-100"), 200: v("cream-200"), 300: v("cream-300"), 400: v("cream-400"), 500: v("cream-500") },
        forest: { DEFAULT: v("forest-950"), 50: v("forest-50"), 100: v("forest-100"), 200: v("forest-200"), 300: v("forest-300"), 400: v("forest-400"), 500: v("forest-500"), 600: v("forest-600"), 700: v("forest-700"), 800: v("forest-800"), 900: v("forest-900"), 950: v("forest-950") },
        // clay-500 darkened from #E85D2C (3.1:1 as text, 3.5:1 under white text) to match the AA --primary token.
        clay: { DEFAULT: "#BF3F18", 50: "#FDF6F3", 100: "#FBE5DC", 200: "#F7C8B7", 300: "#F2A58B", 400: "#ED7E5C", 500: "#BF3F18", 600: "#A33413", 700: "#872B10", 800: "#6B220C" },
        // 300-500 are the bright lime accents (same in both themes); the pale (50-200) and dark (600-800) steps flip.
        sprout: { DEFAULT: "#D4F542", 50: v("sprout-50"), 100: v("sprout-100"), 200: v("sprout-200"), 300: "#D4F542", 400: "#B8D035", 500: "#9CB528", 600: v("sprout-600"), 700: v("sprout-700"), 800: v("sprout-800") },
        // Theme-independent brand colours: use these (not forest/cream) on surfaces that stay the same in
        // light and dark mode, e.g. text on a lime section or a dark panel over a photo.
        ink: { DEFAULT: "#12160E", soft: "#1A261A", muted: "#3D4A36" },
        paper: { DEFAULT: "#F7F3EA", dim: "#D9D2C2" },
        // A raised surface (cards, inputs, panels): white in light mode, a lifted dark green in dark mode.
        surface: "hsl(var(--surface) / <alpha-value>)",
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
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        wiggle: { "0%, 100%": { transform: "rotate(-4deg)" }, "50%": { transform: "rotate(4deg)" } },
        draw: { to: { strokeDashoffset: "0" } },
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
        marquee: "marquee 40s linear infinite",
        float: "float 6s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out infinite",
        draw: "draw 1.2s ease-out 0.9s forwards",
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
