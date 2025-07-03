import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './AppRouter.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { registerServiceWorker } from './utils/performance.ts'
import './index.css'

// Register service worker for performance optimization
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </React.StrictMode>,
)
