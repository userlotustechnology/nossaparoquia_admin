import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const IMPERSONATION_KEY = 'admin_impersonation_backup_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    isImpersonating: false,
  });

  const initialize = useCallback(async () => {
    const token = localStorage.getItem('admin_auth_token');

    if (!token) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    const impersonationBackup = localStorage.getItem(IMPERSONATION_KEY);

    try {
      const res = await api.get('/auth/me');
      const user = res.data.data as User;

      if (user.role !== 'admin' && !impersonationBackup) {
        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('admin_auth_user');
        setState(s => ({ ...s, isLoading: false }));
        return;
      }

      if (user.role !== 'admin' && impersonationBackup) {
        localStorage.setItem('admin_auth_user', JSON.stringify(user));
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          isImpersonating: true,
        });
        return;
      }

      localStorage.setItem('admin_auth_user', JSON.stringify(user));
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        isImpersonating: false,
      });
    } catch {
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_auth_user');
      localStorage.removeItem(IMPERSONATION_KEY);
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

    localStorage.removeItem(IMPERSONATION_KEY);
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
      isImpersonating: false,
    });
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await api.post('/auth/google', {
      credential,
      device_name: 'admin-web',
    });

    const { user, token } = res.data.data;

    localStorage.removeItem(IMPERSONATION_KEY);
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
      isImpersonating: false,
    });
  };

  const stopImpersonation = async () => {
    const backup = localStorage.getItem(IMPERSONATION_KEY);
    if (!backup) {
      return;
    }

    const res = await api.post('/admin/impersonate/stop', {
      device_name: 'admin-web',
    });

    const { user, token } = res.data.data;

    localStorage.removeItem(IMPERSONATION_KEY);
    localStorage.setItem('admin_auth_token', token);
    localStorage.setItem('admin_auth_user', JSON.stringify(user));

    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      isImpersonating: false,
    });
  };

  const logout = async () => {
    if (localStorage.getItem(IMPERSONATION_KEY)) {
      try {
        await stopImpersonation();
      } catch {
        localStorage.removeItem(IMPERSONATION_KEY);
        localStorage.removeItem('admin_auth_token');
        localStorage.removeItem('admin_auth_user');
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isImpersonating: false,
        });
      }
      return;
    }

    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_auth_user');
    localStorage.removeItem(IMPERSONATION_KEY);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isImpersonating: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, logout, stopImpersonation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
