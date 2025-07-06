"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTrialAccess } from '@/hooks/useTrialAccess';
import { useUserRole } from '@/hooks/useUserRole';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { trialAccess, loading } = useTrialAccess();
  const { user } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Não fazer nada se ainda está carregando
    if (loading) return;

    // Não fazer nada se é super admin
    if (user?.role === 'super_admin') return;

    // Se o trial expirou e não pode usar features, redirecionar
    if (trialAccess.isTrialExpired && !trialAccess.canUseFeatures) {
      // Não redirecionar se já está na página de assinatura
      if (pathname !== '/assinatura') {
        console.log('🔄 [SUBSCRIPTION GUARD] Trial expirado, redirecionando para /assinatura');
        router.push('/assinatura');
      }
    }
  }, [trialAccess, loading, user, router, pathname]);

  // Se está carregando, mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se o trial expirou, não renderizar nada (será redirecionado)
  if (trialAccess.isTrialExpired && !trialAccess.canUseFeatures) {
    return null;
  }

  return <>{children}</>;
} 