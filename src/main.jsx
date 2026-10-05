import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth'
import { SpaceProvider } from './hooks/useSpace'
import { ToastProvider } from './components/ui/Toast.jsx'
import { registerServiceWorker } from './lib/push'

// Apply saved theme before first render to prevent flash
;(function () {
  const saved = localStorage.getItem('theme')
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', saved || system)
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SpaceProvider>
        <App />
        <ToastProvider />
      </SpaceProvider>
    </AuthProvider>
  </StrictMode>,
)

registerServiceWorker()
