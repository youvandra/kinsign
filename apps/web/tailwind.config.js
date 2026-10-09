/** Tokens follow the Axion Studio concept: light grey ground, near-black ink, one orange accent. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#EFEFEF',
        ground2: '#F5F5F5',
        ink: '#111827',
        accent: { DEFAULT: '#F26522', hover: '#E05A1A', soft: '#FDEEE6', ink: '#9A3A0C' },
        ok: { DEFAULT: '#2F6B45', soft: '#E9F2EC' },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"', '"Hiragino Sans GB"', '"Noto Sans SC"', 'Roboto', 'sans-serif'],
      },
      transitionTimingFunction: {
        axion: 'cubic-bezier(0.25,0.1,0.25,1)',
        sheet: 'cubic-bezier(0.32,0.72,0,1)',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06)',
        lift: '0 10px 30px rgba(0,0,0,0.10)',
        device: '0 40px 80px rgba(0,0,0,0.18)',
      },
      keyframes: {
        ping2: {
          '0%': { boxShadow: '0 0 0 0 rgba(242,101,34,0.45)' },
          '70%': { boxShadow: '0 0 0 7px rgba(242,101,34,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(242,101,34,0)' },
        },
        bob: { '50%': { transform: 'translateY(3px)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-100%)' } },
        flow: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(300%)' } },
        grow: { from: { transform: 'scaleX(0.45)' }, to: { transform: 'scaleX(0.9)' } },
        'page-in': { from: { transform: 'translateY(10px)' }, to: { transform: 'translateY(0)' } },
      },
      animation: {
        ping2: 'ping2 2s cubic-bezier(0.25,0.1,0.25,1) infinite',
        bob: 'bob 2s cubic-bezier(0.25,0.1,0.25,1) infinite',
        marquee: 'marquee 40s linear infinite',
        flow: 'flow 2.4s cubic-bezier(0.45,0,0.55,1) infinite',
        grow: 'grow 2.4s ease-in-out infinite alternate',
        'page-in': 'page-in 0.5s cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [],
}
