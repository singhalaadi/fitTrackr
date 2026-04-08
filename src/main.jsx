import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { UserProvider } from './contexts/UserContext'
import { StatusBar } from '@capacitor/status-bar';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <App />
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'Manrope, sans-serif'
              }
            }}
          />
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Initialize StatusBar plugin
StatusBar.setBackgroundColor({ color: '#09090b' });
