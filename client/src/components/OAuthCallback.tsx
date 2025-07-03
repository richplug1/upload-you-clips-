import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { googleOAuthService } from '../services/googleOAuth';
import { useToast } from '../components/ToastNotification';

const OAuthCallback: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const result = googleOAuthService.handleCallback();
        
        if (result) {
          // Store token and user data
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
          
          // Update auth context
          // Note: This is a simplified approach - you might want to use the proper login method
          success('Welcome!', 'Successfully signed in with Google');
          
          // Redirect to main app
          window.location.href = '/';
        } else {
          // Check if we have a code to exchange
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          const errorParam = urlParams.get('error');
          
          if (errorParam) {
            throw new Error(decodeURIComponent(errorParam));
          }
          
          if (code) {
            const result = await googleOAuthService.exchangeCodeForToken(code);
            
            // Store token and user data
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            success('Welcome!', 'Successfully signed in with Google');
            
            // Redirect to main app
            window.location.href = '/';
          } else {
            throw new Error('No authentication data received');
          }
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        error('Authentication Failed', err instanceof Error ? err.message : 'Google authentication failed');
        
        // Redirect to home with error
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [login, success, error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Authentication
          </h2>
          
          <p className="text-gray-600 text-sm">
            Please wait while we complete your Google sign-in...
          </p>
          
          <div className="mt-6">
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
