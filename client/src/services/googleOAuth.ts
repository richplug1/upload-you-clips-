// Google OAuth Service for Frontend
import { config } from '../config/env';

class GoogleOAuthService {
  private clientId: string;
  private baseUrl: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.baseUrl = config.api.baseUrl;
  }

  // Get Google OAuth URL from backend
  async getAuthUrl(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/oauth/google/url`);
      const data = await response.json();
      
      if (data.success) {
        return data.authUrl;
      }
      throw new Error(data.error || 'Failed to get OAuth URL');
    } catch (error) {
      console.error('Failed to get Google OAuth URL:', error);
      throw error;
    }
  }

  // Initiate Google OAuth flow
  async initiateOAuth(): Promise<void> {
    try {
      const authUrl = await this.getAuthUrl();
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Google OAuth:', error);
      throw new Error('Failed to start Google authentication');
    }
  }

  // Alternative: Direct Google OAuth (client-side)
  initiateDirectOAuth(): void {
    if (!this.clientId) {
      throw new Error('Google Client ID not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${window.location.origin}/auth/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/oauth/v2/auth?${params.toString()}`;
    window.location.href = authUrl;
  }

  // Handle OAuth callback (extract token from URL)
  handleCallback(): { token: string; user: any } | null {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      throw new Error(decodeURIComponent(error));
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        return { token, user };
      } catch (error) {
        console.error('Failed to parse user data:', error);
        throw new Error('Invalid user data received');
      }
    }

    return null;
  }

  // Manual OAuth code exchange (for alternative implementation)
  async exchangeCodeForToken(code: string): Promise<{ token: string; user: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/oauth/google/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          token: data.token,
          user: data.user
        };
      }

      throw new Error(data.error || 'Authentication failed');
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  }

  // Check if Google OAuth is configured
  isConfigured(): boolean {
    return !!this.clientId;
  }
}

export const googleOAuthService = new GoogleOAuthService();
