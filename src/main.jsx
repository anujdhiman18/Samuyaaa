import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './Index.css'
import App from './App.jsx'

try {
  localStorage.removeItem('theme');
  document.documentElement.classList.remove('dark');
  document.documentElement.setAttribute('data-theme', 'light');
} catch (e) {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
