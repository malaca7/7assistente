'use client';

import { useEffect } from 'react';

export default function CeoRedirectPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace('/admin');
    }
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center text-slate-400 text-xs">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-pitoco-blue border-t-transparent animate-spin mx-auto" />
        <p>Redirecionando para o Painel Central do CEO...</p>
      </div>
    </div>
  );
}
