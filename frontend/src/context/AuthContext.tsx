import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (formData: FormData, explicitRole?: UserRole) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    location_city?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  toggleRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cariq_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    // Check initial user
    const token = localStorage.getItem('cariq_access_token');
    if (token && !user) {
      authService.getCurrentUser().then((u) => {
        setUser(u);
        localStorage.setItem('cariq_user', JSON.stringify(u));
      }).catch(() => {});
    }

    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('cariq_auth_expired', handleExpired);
    return () => window.removeEventListener('cariq_auth_expired', handleExpired);
  }, []);

  const login = async (formData: FormData, explicitRole?: UserRole) => {
    const tokens = await authService.login(formData);
    localStorage.setItem('cariq_access_token', tokens.access_token);
    localStorage.setItem('cariq_refresh_token', tokens.refresh_token);

    const email = formData.get('username') as string;
    const role: UserRole = explicitRole || (email?.toLowerCase().includes('admin') ? 'admin' : 'customer');

    const currentUser: User = {
      id: 'usr-' + Date.now(),
      email: email || (role === 'admin' ? 'admin@cariq.in' : 'demo@cariq.in'),
      first_name: role === 'admin' ? 'Admin' : (email?.split('@')[0] || 'Rahul'),
      last_name: role === 'admin' ? 'Officer' : 'Sharma',
      full_name: role === 'admin' ? 'System Administrator' : ((email?.split('@')[0] || 'Rahul') + ' Sharma'),
      role,
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
    };

    setUser(currentUser);
    localStorage.setItem('cariq_user', JSON.stringify(currentUser));
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    location_city?: string;
  }) => {
    const newUser = await authService.register(data);
    setUser(newUser);
    localStorage.setItem('cariq_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const toggleRole = () => {
    if (!user) return;
    const updated: User = {
      ...user,
      role: user.role === 'admin' ? 'customer' : 'admin',
    };
    setUser(updated);
    localStorage.setItem('cariq_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        toggleRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
