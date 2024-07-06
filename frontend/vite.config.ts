import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
// @ts-expect-error - no typings for vite-plugin-favicons-inject
import vitePluginFaviconsInject from 'vite-plugin-favicons-inject'

export default defineConfig({
  plugins: [
    react(),
    vitePluginFaviconsInject('public/favicon.svg', {
      appName: 'Foreman',
      appShortName: 'Foreman',
      appDescription: 'Foreman - A Renovate web UI'
    })
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer()
      ]
    }
  }
})
