import { X, Cookie, Settings, Eye, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import { useState } from 'react';

interface CookiePolicyProps {
  onClose: () => void;
}

const CookiePolicy = ({ onClose }: CookiePolicyProps) => {
  const [essentialCookies, setEssentialCookies] = useState(true);
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [marketingCookies, setMarketingCookies] = useState(false);
  const [functionalCookies, setFunctionalCookies] = useState(true);

  const handleSavePreferences = () => {
    // In a real app, this would save the preferences to localStorage or send to server
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: essentialCookies,
      analytics: analyticsCookies,
      marketing: marketingCookies,
      functional: functionalCookies,
      timestamp: new Date().toISOString()
    }));
    
    // Show confirmation
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = 'Cookie preferences saved!';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-700 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Cookie className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Cookie Policy</h2>
                <p className="text-orange-100">How we use cookies and tracking technologies</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="prose prose-gray max-w-none">
            
            {/* Last Updated */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-8">
              <div className="flex items-center space-x-2 text-orange-700">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Last updated: July 2, 2025</span>
              </div>
            </div>

            {/* Introduction */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Cookie className="w-5 h-5 mr-2 text-orange-600" />
                What Are Cookies?
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, analyzing how you use our service, and improving our platform.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This Cookie Policy explains what cookies we use, why we use them, and how you can manage your cookie preferences.
              </p>
            </section>

            {/* Types of Cookies */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Types of Cookies We Use</h3>
              
              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-red-600" />
                        Essential Cookies
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">Required for basic functionality</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Always Active</span>
                      <div className="w-12 h-6 bg-red-500 rounded-full flex items-center justify-end px-1">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">
                    These cookies are necessary for the website to function and cannot be switched off. They include:
                  </p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Authentication and session management</li>
                    <li>• Security and fraud prevention</li>
                    <li>• Load balancing and site functionality</li>
                    <li>• Remembering your cookie preferences</li>
                  </ul>
                </div>

                {/* Functional Cookies */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-blue-600" />
                        Functional Cookies
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">Enhance your experience</p>
                    </div>
                    <button
                      onClick={() => setFunctionalCookies(!functionalCookies)}
                      className="flex items-center space-x-2"
                    >
                      <span className="text-sm text-gray-600">
                        {functionalCookies ? 'Enabled' : 'Disabled'}
                      </span>
                      {functionalCookies ? (
                        <ToggleRight className="w-8 h-8 text-blue-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-700 mb-3">
                    These cookies enable enhanced functionality and personalization:
                  </p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Language and region preferences</li>
                    <li>• Theme and display settings</li>
                    <li>• Video quality preferences</li>
                    <li>• User interface customizations</li>
                  </ul>
                </div>

                {/* Analytics Cookies */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 flex items-center">
                        <Eye className="w-5 h-5 mr-2 text-green-600" />
                        Analytics Cookies
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">Help us improve our service</p>
                    </div>
                    <button
                      onClick={() => setAnalyticsCookies(!analyticsCookies)}
                      className="flex items-center space-x-2"
                    >
                      <span className="text-sm text-gray-600">
                        {analyticsCookies ? 'Enabled' : 'Disabled'}
                      </span>
                      {analyticsCookies ? (
                        <ToggleRight className="w-8 h-8 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-700 mb-3">
                    These cookies help us understand how visitors use our website:
                  </p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Page views and user interactions</li>
                    <li>• Popular features and content</li>
                    <li>• Error tracking and performance monitoring</li>
                    <li>• A/B testing for improvements</li>
                  </ul>
                </div>

                {/* Marketing Cookies */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 flex items-center">
                        <Cookie className="w-5 h-5 mr-2 text-purple-600" />
                        Marketing Cookies
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">For personalized advertising</p>
                    </div>
                    <button
                      onClick={() => setMarketingCookies(!marketingCookies)}
                      className="flex items-center space-x-2"
                    >
                      <span className="text-sm text-gray-600">
                        {marketingCookies ? 'Enabled' : 'Disabled'}
                      </span>
                      {marketingCookies ? (
                        <ToggleRight className="w-8 h-8 text-purple-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-700 mb-3">
                    These cookies are used to deliver relevant advertisements:
                  </p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Targeted advertising based on interests</li>
                    <li>• Retargeting and remarketing campaigns</li>
                    <li>• Social media integration</li>
                    <li>• Third-party advertising networks</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Services</h3>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  We use the following third-party services that may set cookies:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• <strong>Google Analytics:</strong> For website analytics and insights</li>
                  <li>• <strong>Stripe:</strong> For secure payment processing</li>
                  <li>• <strong>Cloudflare:</strong> For content delivery and security</li>
                  <li>• <strong>Intercom:</strong> For customer support and communication</li>
                </ul>
              </div>
            </section>

            {/* Managing Cookies */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Managing Your Cookies</h3>
              <div className="bg-blue-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  You can control and manage cookies in several ways:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• Use the cookie preferences above to control our cookies</li>
                  <li>• Configure your browser settings to block or delete cookies</li>
                  <li>• Use browser extensions for enhanced cookie control</li>
                  <li>• Visit third-party websites to opt-out of their tracking</li>
                </ul>
                <p className="text-orange-600 mt-4 font-medium">
                  Note: Disabling certain cookies may affect website functionality.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Questions?</h3>
              <p className="text-gray-700">
                If you have any questions about our use of cookies, please contact us at{' '}
                <a href="mailto:privacy@shortclipgenerator.com" className="text-orange-600 hover:underline">
                  privacy@shortclipgenerator.com
                </a>
              </p>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleSavePreferences}
              className="px-6 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
            >
              Save Preferences
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
