import './index.css'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { App } from './App.js'
import { Settings } from 'luxon'
import { config } from '@fortawesome/fontawesome-svg-core'

// Disable injecting the CSS into the document since it is blocked by CSP. It is already built by Vite via an import.
config.autoAddCss = false

// This app is in English, so use the en-US locale for date/time formatting.
Settings.defaultLocale = 'en-US'

const container = document.getElementById('root')
if (container == null) {
  throw new Error('missing root')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
