"use client";
import { useState, useEffect, createContext, useContext } from 'react';
import { authenticatedFetch } from '@/lib/utils';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'super_admin';
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const refreshUser = async () => {
    try {
      const response = await authenticatedFetch('/api/users/current');
      setUser(response.user);
    } catch (error) {
      console.log('Usuário não autenticado ou erro na API:', error);
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Erro no login' };
      }

      setUser(data.user);
      return {};
    } catch (error) {
      console.error('Erro no login:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Verificar usuário atual na inicialização
      refreshUser().finally(() => setLoading(false));
    }
  }, [mounted]);

  // Evitar hidratação incorreta
  if (!mounted) {
    return (
      <AuthContext.Provider value={{
        user: null,
        loading: true,
        signIn: async () => ({ error: 'Não inicializado' }),
        signOut: async () => { },
        refreshUser: async () => { }
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 