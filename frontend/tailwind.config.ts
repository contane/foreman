import plugin from 'tailwindcss/plugin'
import { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [
    plugin(({ addVariant }) => {
      // This enables e.g. `hocus:underline`, to avoid having to write `hover:underline focus:underline`.
      addVariant('hocus', ['&:hover', '&:focus'])
    })
  ]
} satisfies Config
