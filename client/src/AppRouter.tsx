import React, { useState } from 'react';
import LandingPage from './LandingPage';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const AppRouter = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'app'>('landing');

  const handleLogout = () => {
    // Reset to landing page on logout
    setCurrentPage('landing');
  };

  if (currentPage === 'landing') {
    return (
      <AuthProvider>
        <LandingPage onGetStarted={() => setCurrentPage('app')} />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <App 
        onBackToLanding={() => setCurrentPage('landing')} 
        onLogout={handleLogout}
      />
    </AuthProvider>
  );
};

export default AppRouter;
