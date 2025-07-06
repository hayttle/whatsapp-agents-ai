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
  const { user, isLoading: userLoading } = useUserRole();
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

    // Superadmin tem acesso irrestrito
    if (user?.role === 'super_admin') {
      setTrialAccess({
        canUseFeatures: true,
        isTrialExpired: false,
        daysRemaining: 9999,
        trialEndDate: null,
        needsPlanSelection: false,
        message: 'Acesso irrestrito (superadmin)'
      });
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      let canUseFeatures = true;
      let isTrialExpired = false;
      let daysRemaining = 7;
      let trialEndDate: Date | null = null;
      let message = '';

      // PRIORIDADE 1: Se há assinatura trial, usar next_due_date da assinatura
      if (subscription && subscription.isTrial) {
        const trialEndDateObj = new Date(subscription.nextDueDate);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const trialEndDay = new Date(trialEndDateObj.getFullYear(), trialEndDateObj.getMonth(), trialEndDateObj.getDate());
        trialEndDate = trialEndDateObj;

        if (today > trialEndDay) {
          // Trial expirou
          isTrialExpired = true;
          canUseFeatures = false;
          daysRemaining = 0;
          message = 'Seu período de teste de 7 dias expirou. Escolha um plano para continuar usando a plataforma.';
        } else {
          // Ainda no trial
          const diffTime = trialEndDay.getTime() - today.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          message = `Você tem ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''} no período de teste de 7 dias.`;
        }
      }
      // PRIORIDADE 2: Se há assinatura mas não é trial, verificar status
      else if (subscription) {
        if (subscription.isSuspended) {
          // Verificar se era uma assinatura trial que expirou
          const trialEndDateObj = new Date(subscription.nextDueDate);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const trialEndDay = new Date(trialEndDateObj.getFullYear(), trialEndDateObj.getMonth(), trialEndDateObj.getDate());

          // Se a data de vencimento passou, tratar como trial expirado
          if (today > trialEndDay) {
            isTrialExpired = true;
            canUseFeatures = false;
            daysRemaining = 0;
            trialEndDate = trialEndDateObj;
            message = 'Seu período de teste de 7 dias expirou. Escolha um plano para continuar usando a plataforma.';
          } else {
            // Assinatura paga suspensa (não era trial)
            canUseFeatures = false;
            message = 'Sua assinatura está suspensa. Renove para continuar usando a plataforma.';
          }
        } else if (subscription.isActive) {
          // Assinatura paga ativa
          canUseFeatures = true;
          message = 'Sua assinatura está ativa.';
        }
      }
      // PRIORIDADE 3: Se não há assinatura, verificar trial por data de criação (fallback)
      else {
        if (user?.created_at) {
          const userCreatedAt = new Date(user.created_at);
          const trialEnd = new Date(userCreatedAt);
          trialEnd.setDate(trialEnd.getDate() + 7); // 7 dias de trial

          // Comparar apenas a data (ignorar hora/fuso)
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const trialEndDay = new Date(trialEnd.getFullYear(), trialEnd.getMonth(), trialEnd.getDate());

          trialEndDate = trialEnd;

          if (today > trialEndDay) {
            // Trial expirou
            isTrialExpired = true;
            canUseFeatures = false;
            daysRemaining = 0;
            message = 'Seu período de teste de 7 dias expirou. Escolha um plano para continuar usando a plataforma.';
          } else {
            // Ainda no trial
            const diffTime = trialEndDay.getTime() - today.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            message = `Você tem ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''} no período de teste de 7 dias.`;
          }
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
  }, [subscription, subscriptionLoading, user, userLoading]);

  return {
    trialAccess,
    loading,
    error,
  };
} 