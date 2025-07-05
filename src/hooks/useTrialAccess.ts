"use client";

import { useState, useEffect } from 'react';
import { useSubscription } from './useSubscription';
import { useUserRole } from './useUserRole';

export interface TrialAccessData {
  canUseFeatures: boolean;
  isTrialExpired: boolean;
  daysRemaining: number;
  trialEndDate: Date | null;
  needsPlanSelection: boolean;
  message: string;
}

export interface UseTrialAccessReturn {
  trialAccess: TrialAccessData;
  loading: boolean;
  error: string | null;
}

export function useTrialAccess(): UseTrialAccessReturn {
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { userData, isLoading: userLoading } = useUserRole();
  const [trialAccess, setTrialAccess] = useState<TrialAccessData>({
    canUseFeatures: true,
    isTrialExpired: false,
    daysRemaining: 7,
    trialEndDate: null,
    needsPlanSelection: false,
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subscriptionLoading || userLoading) return;

    try {
      const now = new Date();
      let canUseFeatures = true;
      let isTrialExpired = false;
      let daysRemaining = 7;
      let trialEndDate: Date | null = null;
      let needsPlanSelection = false;
      let message = '';

      // Se não há assinatura, verificar se está no período trial
      if (!subscription) {
        // Usuário não tem assinatura, verificar se está no período trial
        if (userData?.created_at) {
          const userCreatedAt = new Date(userData.created_at);
          const trialEnd = new Date(userCreatedAt);
          trialEnd.setDate(trialEnd.getDate() + 7);
          
          trialEndDate = trialEnd;
          
          if (now > trialEnd) {
            // Trial expirou
            isTrialExpired = true;
            canUseFeatures = false;
            daysRemaining = 0;
            message = 'Seu período de teste expirou. Escolha um plano para continuar usando a plataforma.';
          } else {
            // Ainda no trial
            const diffTime = trialEnd.getTime() - now.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            message = `Você tem ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''} no período de teste.`;
          }
        }
      } else {
        // Há assinatura
        if (subscription.isTrial) {
          // Assinatura trial
          trialEndDate = new Date(subscription.nextDueDate);
          
          if (now > trialEndDate) {
            // Trial expirou
            isTrialExpired = true;
            canUseFeatures = false;
            daysRemaining = 0;
            message = 'Seu período de teste expirou. Escolha um plano para continuar usando a plataforma.';
          } else {
            // Ainda no trial
            const diffTime = trialEndDate.getTime() - now.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            message = `Você tem ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''} no período de teste.`;
          }
        } else if (subscription.isSuspended) {
          // Assinatura suspensa
          canUseFeatures = false;
          message = 'Sua assinatura está suspensa. Renove para continuar usando a plataforma.';
        } else if (subscription.isActive) {
          // Assinatura ativa
          canUseFeatures = true;
          message = 'Sua assinatura está ativa.';
        }
      }

      setTrialAccess({
        canUseFeatures,
        isTrialExpired,
        daysRemaining,
        trialEndDate,
        needsPlanSelection: isTrialExpired,
        message,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar acesso trial');
    } finally {
      setLoading(false);
    }
  }, [subscription, subscriptionLoading, userData, userLoading]);

  return {
    trialAccess,
    loading,
    error,
  };
} 