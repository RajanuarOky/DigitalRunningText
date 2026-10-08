import React, { useState, useEffect } from 'react';
import { MosqueProvider } from './context/MosqueContext';
import { TvDisplay } from './components/tv/TvDisplay';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'tv' | 'admin' | 'super-admin'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'super-admin' || mode === 'superadmin') return 'super-admin';
    if (mode === 'admin') return 'admin';
    return 'tv';
  });

  // Sinkronisasi dengan URL history browser
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      if (mode === 'super-admin' || mode === 'superadmin') setCurrentView('super-admin');
      else if (mode === 'admin') setCurrentView('admin');
      else setCurrentView('tv');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: 'tv' | 'admin' | 'super-admin') => {
    setCurrentView(view);
    const url = new URL(window.location.href);
    if (view === 'super-admin') {
      url.searchParams.set('mode', 'super-admin');
    } else if (view === 'admin') {
      url.searchParams.set('mode', 'admin');
    } else {
      url.searchParams.delete('mode');
    }
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100">
      {currentView === 'tv' && (
        <TvDisplay onNavigateToAdmin={() => navigateTo('admin')} />
      )}
      {currentView === 'admin' && (
        <AdminDashboard
          onNavigateToTv={() => navigateTo('tv')}
          onNavigateToSuperAdmin={() => navigateTo('super-admin')}
        />
      )}
      {currentView === 'super-admin' && (
        <SuperAdminDashboard onBack={() => navigateTo('tv')} />
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
