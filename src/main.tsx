import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DebugPage } from './debug/DebugPage.tsx'

const isDebug = window.location.hash.startsWith('#/debug')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isDebug ? <DebugPage /> : <App />}</StrictMode>,
)
