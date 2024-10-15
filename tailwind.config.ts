import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    extend: {
      container: {
        center: true,
      },
      colors: {
        'field-info': 'hsl(var(--field-info))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        error: {
          DEFAULT: 'hsl(var(--error))',
          50: 'hsl(var(--error-50))',
          200: 'hsl(var(--error-200))',
          700: 'hsl(var(--error-700))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          50: 'hsl(var(--warning-50))',
          200: 'hsl(var(--warning-200))',
          700: 'hsl(var(--warning-700))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          secondary: 'hsl(var(--success-secondary))',
          50: 'hsl(var(--success-50))',
          200: 'hsl(var(--success-200))',
          700: 'hsl(var(--success-700))',
        },
        purple: {
          50: 'hsl(var(--purple-50))',
          200: 'hsl(var(--purple-200))',
          700: 'hsl(var(--purple-700))',
        },
        quinary: {
          foreground: 'hsl(var(--quinary-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          alt: 'hsl(var(--primary-alt))',
          light: 'hsl(var(--primary-light))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        amber: {
          DEFAULT: 'hsl(var(--amber))',
          foreground: 'hsl(var(--amber-foreground))',
          alt: 'hsl(var(--amber-alt))',
        },
        green: {
          DEFAULT: 'hsl(var(--green))',
          foreground: 'hsl(var(--green-foreground))',
          alt: 'hsl(var(--green-alt))',
        },
        violet: {
          DEFAULT: 'hsl(var(--violet))',
          foreground: 'hsl(var(--violet-foreground))',
          alt: 'hsl(var(--violet-alt))',
        },
        blue: {
          DEFAULT: 'hsl(var(--blue))',
          foreground: 'hsl(var(--blue-foreground))',
          alt: 'hsl(var(--blue-alt))',
          500: 'hsl(var(--blue-500))',
        },
        orchid: {
          DEFAULT: 'hsl(var(--orchid))',
          foreground: 'hsl(var(--orchid-foreground))',
          alt: 'hsl(var(--orchid-alt))',
        },
        gray: {
          foreground: 'hsl(var(--gray-foreground))',
        },
        yellow: {
          400: 'hsl(var(--yellow-400))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      boxShadow: {
        sm: '0px 1px 2px rgba(16, 24, 40, 0.05)',
        md: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
        lg: '0px 1px 2px rgba(16, 24, 40, 0.05), inset 0px 0px 0px 1px rgba(16, 24, 40, 0.18), inset 0px -2px 0px rgba(16, 24, 40, 0.05)',
      },
      keyframes: {
        ring: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in-right': {
          '0%': {
            opacity: '0',
            transform: 'translateX(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'fade-in-top': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-out-top': {
          '0%': {
            height: '100%',
          },
          '99%': {
            height: '0',
          },
          '100%': {
            visibility: 'hidden',
          },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'accordion-slide-up': {
          '0%': {
            height: 'var(--radix-accordion-content-height)',
            opacity: '1',
          },
          '100%': {
            height: '0',
            opacity: '0',
          },
        },
        'accordion-slide-down': {
          '0%': {
            'min-height': '0',
            'max-height': '0',
            opacity: '0',
          },
          '100%': {
            'min-height': 'var(--radix-accordion-content-height)',
            'max-height': 'none',
            opacity: '1',
          },
        },
      },
      animation: {
        ring: 'ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
        'fade-in-right':
          'fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards',
        'fade-in-top': 'fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards',
        'fade-out-top':
          'fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'accordion-open':
          'accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards',
        'accordion-close':
          'accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards',
        'slide-in': 'slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)',
      },
      fontFamily: {
        sans: ['var(--font-onest)'],
        'sans-alt': ['var(--font-excon)'],
        'sans-inter': ['var(--font-inter)'],
      },
      letterSpacing: {
        tightest: '0.0125em',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config
