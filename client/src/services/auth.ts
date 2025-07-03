import axios from 'axios';
import { config } from '../config/env';

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  subscription_type: 'free' | 'premium' | 'pro';
  created_at: string;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

class AuthService {
  private baseUrl: string;
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/login`, credentials);
      const { token, user, message } = response.data;
      
      this.token = token;
      this.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user, message };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Login failed');
      }
      throw new Error('Network error during login');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/register`, userData);
      const { token, user, message } = response.data;
      
      this.token = token;
      this.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user, message };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Registration failed');
      }
      throw new Error('Network error during registration');
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await axios.post(`${this.baseUrl}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getProfile(): Promise<User> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      this.user = response.data.user;
      localStorage.setItem('user', JSON.stringify(this.user));
      
      return this.user as User;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.logout();
        throw new Error('Session expired');
      }
      throw new Error('Failed to get profile');
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await axios.put(`${this.baseUrl}/api/auth/profile`, updates, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      
      this.user = response.data.user;
      localStorage.setItem('user', JSON.stringify(this.user));
      
      return this.user as User;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Profile update failed');
      }
      throw new Error('Network error during profile update');
    }
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }
}

export const authService = new AuthService();
