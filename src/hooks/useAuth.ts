"use client";
import { useEffect, useState } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    // Checa se existe o cookie de autenticação do Supabase
    const cookies = document.cookie;
    setIsAuthenticated(
      cookies.includes('sb-access-token') || cookies.includes('supabase-auth-token')
    );
  }, []);
  return { isAuthenticated };
} 