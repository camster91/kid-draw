import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for offline support in production builds.
// Skip in dev: Vite's HMR + dynamic module graph confuse the SW cache.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.info('[kid-draw] service worker registered, scope:', reg.scope)
      })
      .catch((err) => {
        console.warn('[kid-draw] service worker registration failed:', err)
      })
  })
}
