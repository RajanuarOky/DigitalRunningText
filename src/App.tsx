import React, { useState, useEffect } from 'react';
import { MosqueProvider } from './context/MosqueContext';
import { TvDisplay } from './components/tv/TvDisplay';
import { AdminDashboard } from './components/admin/AdminDashboard';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'tv' | 'admin'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode') === 'admin' ? 'admin' : 'tv';
  });

  // Sinkronisasi dengan URL history browser
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      setCurrentView(urlParams.get('mode') === 'admin' ? 'admin' : 'tv');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: 'tv' | 'admin') => {
    setCurrentView(view);
    const url = new URL(window.location.href);
    if (view === 'admin') {
      url.searchParams.set('mode', 'admin');
    } else {
      url.searchParams.delete('mode');
    }
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100">
      {currentView === 'tv' ? (
        <TvDisplay onNavigateToAdmin={() => navigateTo('admin')} />
      ) : (
        <AdminDashboard onNavigateToTv={() => navigateTo('tv')} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <MosqueProvider>
      <AppContent />
    </MosqueProvider>
  );
}
