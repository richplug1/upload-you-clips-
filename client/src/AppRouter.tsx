import React, { useState } from 'react';
import LandingPage from './LandingPage';
import App from './App';

const AppRouter = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'app'>('landing');

  if (currentPage === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentPage('app')} />;
  }

  return <App onBackToLanding={() => setCurrentPage('landing')} />;
};

export default AppRouter;
