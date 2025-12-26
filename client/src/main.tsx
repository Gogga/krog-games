import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logPerformanceMetrics } from './utils/performance'

// Log performance metrics in development
logPerformanceMetrics()

// Hide splash screen after React mounts
const hideSplashScreen = () => {
  const splash = document.getElementById('splash-screen')
  if (splash) {
    splash.style.opacity = '0'
    splash.style.transition = 'opacity 0.3s ease'
    setTimeout(() => {
      splash.remove()
    }, 300)
  }
}

// Render the app
const root = createRoot(document.getElementById('root')!)
root.render(<App />)

// Hide splash after a short delay to ensure content is painted
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    hideSplashScreen()
  })
})
