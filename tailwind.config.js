/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 五行属性颜色
        wind: '#22c55e',
        thunder: '#eab308',
        water: '#3b82f6',
        fire: '#ef4444',
        earth: '#a16207',
      },
      animation: {
        'card-hover': 'cardHover 200ms ease-out',
        'card-flip': 'cardFlip 400ms ease-in-out',
        'card-fly': 'cardFly 500ms ease-in-out',
      },
      keyframes: {
        cardHover: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-10px)' },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        cardFly: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(var(--fly-x), var(--fly-y)) scale(0.5)' },
        },
      },
    },
  },
  plugins: [],
};
