import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, LoginRequest, SignupRequest } from '@veltria/shared';
import { api } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  handleOAuthCallback: (token: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async (token: string) => {
    try {
      localStorage.setItem('token', token);
      const response = await api.auth.getMe();
      if (response.success && response.data) {
        setUser(response.data);
        return { success: true };
      } else {
        localStorage.removeItem('token');
        return { success: false, error: response.error || 'Failed to fetch user' };
      }
    } catch (error) {
      localStorage.removeItem('token');
      return { success: false, error: 'Failed to fetch user' };
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = async (data: LoginRequest) => {
    const response = await api.auth.login(data);
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return { success: true };
    }
    return { success: false, error: response.error };
  };

  const signup = async (data: SignupRequest) => {
    const response = await api.auth.signup(data);
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return { success: true };
    }
    return { success: false, error: response.error };
  };

  const logout = async () => {
    await api.auth.logout();
    localStorage.removeItem('token');
    setUser(null);
  };

  const handleOAuthCallback = useCallback(async (token: string) => {
    return fetchUser(token);
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, handleOAuthCallback }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
