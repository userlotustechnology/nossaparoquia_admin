import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const initialize = useCallback(async () => {
    const token = localStorage.getItem('admin_auth_token');
    const userStr = localStorage.getItem('admin_auth_user');

    if (!token || !userStr) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    try {
      const res = await api.get('/auth/me');
      const user = res.data.data as User;

      if (user.role !== 'admin') {
        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('admin_auth_user');
        setState(s => ({ ...s, isLoading: false }));
        return;
      }

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_auth_user');
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', {
      email,
      password,
      device_name: 'admin-web',
    });

    const data = res.data.data;

    if (data.requires_2fa) {
      throw new Error('Autenticação de dois fatores não é suportada neste painel.');
    }

    const { user, token } = data;

    localStorage.setItem('admin_auth_token', token);
    localStorage.setItem('admin_auth_user', JSON.stringify(user));

    if (user.role !== 'admin') {
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_auth_user');
      throw new Error('Acesso restrito a administradores do sistema.');
    }

    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await api.post('/auth/google', {
      credential,
      device_name: 'admin-web',
    });

    const { user, token } = res.data.data;

    localStorage.setItem('admin_auth_token', token);
    localStorage.setItem('admin_auth_user', JSON.stringify(user));

    if (user.role !== 'admin') {
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_auth_user');
      throw new Error('Acesso restrito a administradores do sistema.');
    }

    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_auth_user');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
