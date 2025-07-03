interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  subscription_type: string;
  created_at: string;
  last_login?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

interface GoogleAuthData {
  googleToken: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

class AuthService {
  private baseUrl = '/api/auth';
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user
  getUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Store authentication data
  private storeAuth(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear authentication data
  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Get authorization headers
  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    this.storeAuth(data.token, data.user);
    return data;
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.storeAuth(data.token, data.user);
    return data;
  }

  // Google OAuth login
  async googleAuth(googleData: GoogleAuthData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Google authentication failed');
    }

    const data: AuthResponse = await response.json();
    this.storeAuth(data.token, data.user);
    return data;
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Logout from all devices
  async logoutAll(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/logout-all`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Verify token
  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.baseUrl}/verify`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.clearAuth();
        return false;
      }

      const data = await response.json();
      if (data.valid && data.user) {
        // Update stored user data
        localStorage.setItem(this.userKey, JSON.stringify(data.user));
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuth();
      return false;
    }
  }

  // Get user profile
  async getProfile(): Promise<{ user: User; stats: any }> {
    const response = await fetch(`${this.baseUrl}/profile`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get profile');
    }

    return response.json();
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<{ user: User; message: string }> {
    const response = await fetch(`${this.baseUrl}/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    const data = await response.json();
    // Update stored user data
    localStorage.setItem(this.userKey, JSON.stringify(data.user));
    return data;
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/change-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request password reset');
    }

    return response.json();
  }

  // Reset password with token
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resetToken, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getToken() !== null && this.getUser() !== null;
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.subscription_type === 'admin';
  }

  // Get user subscription type
  getSubscriptionType(): string {
    const user = this.getUser();
    return user?.subscription_type || 'free';
  }
}

export const authService = new AuthService();
export type { User, AuthResponse, LoginCredentials, RegisterCredentials, GoogleAuthData };
