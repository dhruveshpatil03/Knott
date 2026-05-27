import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './APP_Root.jsx'
import ErrorBoundary from './COMPONENT_ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
