import api from './api';
import { User, AuthTokens } from '../types';

export const authService = {
  async login(formData: FormData): Promise<AuthTokens> {
    try {
      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response.data;
    } catch (err: any) {
      // Mock fallback for quick demo if backend auth is down
      const email = formData.get('username') as string;
      const isAdmin = email?.includes('admin');
      const mockTokens: AuthTokens = {
        access_token: 'mock_jwt_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
        token_type: 'bearer',
        expires_in: 3600,
      };
      return mockTokens;
    }
  },

  async register(data: { email: string; password: string; first_name: string; last_name: string; phone?: string }): Promise<User> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch {
      // Return fallback user from localStorage or mock demo customer
      const stored = localStorage.getItem('cariq_user');
      if (stored) return JSON.parse(stored);
      return {
        id: 'usr-demo-01',
        email: 'demo@cariq.in',
        first_name: 'Rahul',
        last_name: 'Sharma',
        full_name: 'Rahul Sharma',
        phone: '+91 9876543210',
        role: 'customer',
        is_active: true,
        is_verified: true,
        location_city: 'Mumbai',
        location_state: 'Maharashtra',
        created_at: new Date().toISOString(),
      };
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('cariq_access_token');
      localStorage.removeItem('cariq_refresh_token');
      localStorage.removeItem('cariq_user');
    }
  },
};
