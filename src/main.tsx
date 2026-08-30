import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { WhatsAppProvider } from './contexts/WhatsAppContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <WhatsAppProvider>
          <App />
        </WhatsAppProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
