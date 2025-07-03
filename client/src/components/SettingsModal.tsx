import { useState, useEffect } from 'react';
import { Settings, X, Volume2, VolumeX, Globe, Download, Trash2, Database, Shield, Key, FileText, UserX, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import CookiePolicy from './CookiePolicy';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState('en');
  const [autoDownload, setAutoDownload] = useState(false);
  const [quality, setQuality] = useState('hd');
  const [storageLimit, setStorageLimit] = useState(500);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showCookiePolicy, setShowCookiePolicy] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handlePasswordReset = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    // Simulate password reset
    alert('Password reset successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAccountDelete = () => {
    if (confirm('⚠️ WARNING: This will permanently delete your account and all associated data. This action cannot be undone. Are you absolutely sure?')) {
      if (confirm('This is your final confirmation. Your account will be deleted immediately. Continue?')) {
        // Simulate account deletion
        alert('Account deletion initiated. You will be redirected to the homepage.');
        localStorage.clear();
        window.location.href = '/';
      }
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'storage', label: 'Storage', icon: Database },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      <div 
        className={`h-full w-full flex flex-col transform transition-all duration-300 ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-gray-900 to-black px-8 py-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20">
                <Settings className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-4xl font-bold">Settings</h2>
                <p className="text-slate-300 text-lg mt-1">Customize your workspace preferences</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/20 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200 px-8 flex-shrink-0">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-3 px-8 py-5 text-base font-medium transition-all duration-200 border-b-3 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-blue-600 bg-white'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  <TabIcon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-12">
            {activeTab === 'general' && (
              <div className="space-y-12">
                <div>
                  <h3 className="text-3xl font-semibold text-gray-900 mb-8">General Preferences</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                    {/* Audio & Notifications */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                      <h4 className="text-2xl font-medium text-gray-900 mb-6 flex items-center">
                        <Volume2 className="w-6 h-6 mr-3 text-green-500" />
                        Audio & Notifications
                      </h4>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                          <div className="flex items-center space-x-4">
                            {soundEnabled ? <Volume2 className="w-6 h-6 text-green-600" /> : <VolumeX className="w-6 h-6 text-gray-400" />}
                            <div>
                              <p className="text-lg font-medium text-gray-900">Sound Effects</p>
                              <p className="text-gray-500">Enable notification sounds and UI feedback</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={soundEnabled}
                              onChange={(e) => setSoundEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Language & Region - Full Width */}
                  <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow mt-8">
                    <h4 className="text-2xl font-medium text-gray-900 mb-6 flex items-center">
                      <Globe className="w-6 h-6 mr-3 text-blue-500" />
                      Language & Region
                    </h4>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                        <div className="flex items-center space-x-4">
                          <Globe className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="text-lg font-medium text-gray-900">Interface Language</p>
                            <p className="text-gray-500">Choose your preferred language for the interface</p>
                          </div>
                        </div>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="px-6 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium min-w-[160px] text-lg"
                        >
                          <option value="en">🇺🇸 English</option>
                          <option value="fr">🇫🇷 Français</option>
                          <option value="es">🇪🇸 Español</option>
                          <option value="de">🇩🇪 Deutsch</option>
                          <option value="zh">🇨🇳 中文</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {activeTab === 'account' && (
            <div className="space-y-12">
              <div>
                <h3 className="text-3xl font-semibold text-gray-900 mb-8">Account Management</h3>
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Password Reset - Takes 2 columns */}
                  <div className="xl:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                    <h4 className="text-2xl font-medium text-gray-900 mb-6 flex items-center">
                      <Key className="w-6 h-6 mr-3 text-blue-500" />
                      Password & Security
                    </h4>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">Current Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-3">New Password</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                            placeholder="Enter new password"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-3">Confirm New Password</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <button
                        onClick={handlePasswordReset}
                        disabled={!currentPassword || !newPassword || !confirmPassword}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>

                  {/* Account Actions - Takes 1 column */}
                  <div className="bg-red-50 border border-red-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                    <h4 className="text-2xl font-medium text-red-900 mb-6 flex items-center">
                      <AlertTriangle className="w-6 h-6 mr-3 text-red-500" />
                      Danger Zone
                    </h4>
                    <div className="space-y-6">
                      <div className="p-6 bg-white rounded-2xl border border-red-200">
                        <div className="flex flex-col items-center space-y-4 text-center">
                          <UserX className="w-12 h-12 text-red-600" />
                          <div>
                            <p className="text-lg font-medium text-red-900">Delete Account</p>
                            <p className="text-red-700 mt-2">Permanently delete your account and all associated data. This action cannot be undone.</p>
                          </div>
                          <button
                            onClick={handleAccountDelete}
                            className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-12">
              <div>
                <h3 className="text-3xl font-semibold text-gray-900 mb-8">Privacy & Legal</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                  {/* Privacy Policy */}
                  <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                    <h4 className="text-2xl font-medium text-gray-900 mb-6 flex items-center">
                      <FileText className="w-6 h-6 mr-3 text-green-500" />
                      Legal Documents
                    </h4>
                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-medium text-gray-900">Privacy Policy</p>
                            <p className="text-gray-500 mt-1">Learn how we collect, use, and protect your data</p>
                          </div>
                          <button 
                            onClick={() => setShowPrivacyPolicy(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                          >
                            View Policy
                          </button>
                        </div>
                      </div>
                      <div className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-medium text-gray-900">Terms of Service</p>
                            <p className="text-gray-500 mt-1">Review our terms and conditions of use</p>
                          </div>
                          <button 
                            onClick={() => setShowTermsOfService(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                          >
                            View Terms
                          </button>
                        </div>
                      </div>
                      <div className="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-medium text-gray-900">Cookie Policy</p>
                            <p className="text-gray-500 mt-1">Understand how we use cookies and similar technologies</p>
                          </div>
                          <button 
                            onClick={() => setShowCookiePolicy(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                          >
                            View Cookies
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Storage & Performance</h3>
                
                {/* Download Settings */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Download className="w-5 h-5 mr-2 text-purple-500" />
                    Download Preferences
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Download className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-medium text-gray-900">Auto Download</p>
                          <p className="text-sm text-gray-500">Automatically download generated clips to your device</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoDownload}
                          onChange={(e) => setAutoDownload(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-600"></div>
                      </label>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium text-gray-900">Default Quality</p>
                          <p className="text-sm text-gray-500">Choose default output quality for generated clips</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'sd', label: 'SD', description: '480p • Faster' },
                          { value: 'hd', label: 'HD', description: '720p • Balanced' },
                          { value: '4k', label: '4K', description: '2160p • Premium' }
                        ].map((q) => (
                          <button
                            key={q.value}
                            onClick={() => setQuality(q.value)}
                            className={`p-4 rounded-xl text-center transition-all border-2 ${
                              quality === q.value
                                ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                            }`}
                          >
                            <div className="font-semibold">{q.label}</div>
                            <div className="text-xs opacity-80">{q.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storage Management */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Download Settings - Takes 2 columns */}
                  <div className="xl:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                    <h4 className="text-2xl font-medium text-gray-900 mb-6 flex items-center">
                      <Download className="w-6 h-6 mr-3 text-purple-500" />
                      Download Preferences
                    </h4>
                    <div className="space-y-8">
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                        <div className="flex items-center space-x-4">
                          <Download className="w-6 h-6 text-purple-600" />
                          <div>
                            <p className="text-lg font-medium text-gray-900">Auto Download</p>
                            <p className="text-gray-500">Automatically download generated clips to your device</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoDownload}
                            onChange={(e) => setAutoDownload(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-600"></div>
                        </label>
                      </div>
                      
                      <div className="p-6 bg-gray-50 rounded-2xl">
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-lg font-medium text-gray-900">Default Quality</p>
                              <p className="text-gray-500">Choose default output quality for generated clips</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { value: 'sd', label: 'SD', description: '480p • Faster', color: 'bg-green-500' },
                              { value: 'hd', label: 'HD', description: '720p • Balanced', color: 'bg-blue-500' },
                              { value: '4k', label: '4K', description: '2160p • Premium', color: 'bg-purple-500' }
                            ].map((q) => (
                              <button
                                key={q.value}
                                onClick={() => setQuality(q.value)}
                                className={`p-6 rounded-2xl text-center transition-all border-2 ${
                                  quality === q.value
                                    ? `${q.color} text-white border-transparent shadow-lg scale-105`
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                }`}
                              >
                                <div className="text-xl font-bold">{q.label}</div>
                                <div className="text-sm opacity-80 mt-1">{q.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storage Management - Takes 1 column */}
                  <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow">
                    <h4 className="text-2xl font-medium text-gray-900 mb-6 flex items-center">
                      <Database className="w-6 h-6 mr-3 text-indigo-500" />
                      Storage Management
                    </h4>
                    <div className="space-y-8">
                      <div className="p-6 bg-gray-50 rounded-2xl">
                        <div className="text-center mb-6">
                          <Database className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                          <div>
                            <p className="text-lg font-medium text-gray-900">Storage Limit</p>
                            <p className="text-gray-500 mb-4">Maximum storage: {storageLimit}MB</p>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="2000"
                          step="100"
                          value={storageLimit}
                          onChange={(e) => setStorageLimit(parseInt(e.target.value))}
                          className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-4">
                          <span>100MB</span>
                          <span className="font-bold text-indigo-600 text-lg">{storageLimit}MB</span>
                          <span>2GB</span>
                        </div>
                      </div>

                      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
                        <div className="text-center">
                          <Trash2 className="w-16 h-16 text-red-600 mx-auto mb-4" />
                          <div>
                            <p className="text-lg font-medium text-red-900 mb-2">Clear All Data</p>
                            <p className="text-red-700 mb-4">Remove all clips, settings, and cached data</p>
                            <button
                              onClick={clearAllData}
                              className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                            >
                              Clear Data
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex-shrink-0">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span>All settings are saved automatically • Version 1.0.0</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Document Modals */}
      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}
      
      {showTermsOfService && (
        <TermsOfService onClose={() => setShowTermsOfService(false)} />
      )}
      
      {showCookiePolicy && (
        <CookiePolicy onClose={() => setShowCookiePolicy(false)} />
      )}
    </div>
  );
};

export default SettingsModal;
