import { useState } from 'react';
import { Film, Scissors, Keyboard, HelpCircle, Settings, Coins, ArrowLeft } from 'lucide-react';
import KeyboardShortcuts from './KeyboardShortcuts';
import SettingsModal from './SettingsModal';

interface HeaderProps {
  onBackToLanding?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBackToLanding }) => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState(250); // User's credit balance

  const handleBuyCredits = () => {
    // Simulate credit purchase - in a real app, this would open a payment modal or redirect to payment page
    const creditsToAdd = 100;
    setCreditsBalance(prev => prev + creditsToAdd);
    
    // Create a temporary toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
    toast.textContent = `+${creditsToAdd} credits added! 🎉`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Home</span>
              </button>
            )}
            <div className="relative group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Film className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-md group-hover:animate-spin">
                <Scissors className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Short Clip Generator
              </h1>
              <p className="text-sm text-gray-600 flex items-center space-x-2">
                <span>✨ Create viral clips with AI</span>
              </p>
            </div>
          </div>            {/* Status and Actions */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Status Indicator */}
            <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">System Online</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="text-xs text-gray-500">
                <span className="font-medium">AI Ready</span>
              </div>
            </div>
            
            {/* Credits Balance */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-2 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Coins className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-700">{creditsBalance} Credits</div>
                    <div className="text-xs text-amber-600">Available balance</div>
                  </div>
                </div>
                <button 
                  onClick={handleBuyCredits}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-medium rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Buy More
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-sm font-bold text-blue-600">Fast</div>
                <div className="text-xs text-gray-500">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-purple-600">HD</div>
                <div className="text-xs text-gray-500">Quality</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Help Button */}
              <button
                onClick={() => setShowShortcuts(true)}
                className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                title="Keyboard shortcuts"
              >
                <Keyboard className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-3">
            {/* Mobile Credits */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-3 py-1 rounded-lg">
              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-700">{creditsBalance}</span>
              </div>
            </div>
            
            <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Keyboard Shortcuts Modal */}
    {showShortcuts && (
      <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
    )}

    {/* Settings Modal */}
    {showSettings && (
      <SettingsModal onClose={() => setShowSettings(false)} />
    )}
  </>
  );
};

export default Header;
