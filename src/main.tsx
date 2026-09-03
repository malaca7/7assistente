import React, { Component, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { WhatsAppProvider } from './contexts/WhatsAppContext';
import { AttendantAuthProvider } from './contexts/AttendantAuthContext';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[7 Assistente ErrorBoundary] Erro detectado na renderização:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center text-slate-200">
          <div className="max-w-md w-full bg-dark-900 border border-rose-500/30 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-base font-bold text-white">Falha ao carregar painel</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-mono bg-dark-950 p-3 rounded-lg border border-white/5 break-words">
              {this.state.error?.message || 'Erro inesperado na interface.'}
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-primary-600/30"
            >
              Recarregar Painel
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AttendantAuthProvider>
            <WhatsAppProvider>
              <App />
            </WhatsAppProvider>
          </AttendantAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
