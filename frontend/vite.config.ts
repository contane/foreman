import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
// @ts-expect-error - no typings for vite-plugin-favicons-inject
import vitePluginFaviconsInject from 'vite-plugin-favicons-inject'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vitePluginFaviconsInject('public/favicon.svg', {
      appName: 'Foreman',
      appShortName: 'Foreman',
      appDescription: 'Foreman - A Renovate web UI'
    })
  ]
})
