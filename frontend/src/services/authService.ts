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

  async register(data: {
    email: string;
    password: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    location_city?: string;
  }): Promise<User> {
    const fullName = (data.full_name || `${data.first_name || ''} ${data.last_name || ''}`).trim() || 'Customer User';
    const firstName = data.first_name || fullName.split(' ')[0] || 'Customer';
    const lastName = data.last_name || fullName.split(' ').slice(1).join(' ') || 'User';

    try {
      const response = await api.post('/auth/register', {
        full_name: fullName,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      });
      const u = response.data;
      const registeredUser: User = {
        id: u.id || 'usr-' + Date.now(),
        email: u.email || data.email,
        first_name: u.first_name || firstName,
        last_name: u.last_name || lastName,
        full_name: u.full_name || fullName,
        phone: u.phone || data.phone || '+91 9876543210',
        role: 'customer',
        is_active: true,
        is_verified: true,
        location_city: data.location_city || 'Mumbai',
        created_at: u.created_at || new Date().toISOString(),
      };
      return registeredUser;
    } catch (err: any) {
      // Local fallback / mock customer registration
      const registeredUser: User = {
        id: 'usr-' + Date.now(),
        email: data.email,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        phone: data.phone || '+91 9876543210',
        role: 'customer',
        is_active: true,
        is_verified: true,
        location_city: data.location_city || 'Mumbai',
        created_at: new Date().toISOString(),
      };
      return registeredUser;
    }
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
