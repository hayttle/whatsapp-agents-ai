"use client";

import { useTrialAccess } from '@/hooks/useTrialAccess';
import { Alert } from './Alert';
import { Button } from './Button';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';

interface TrialAlertProps {
  variant?: 'info' | 'warning' | 'error';
  showActionButton?: boolean;
}

export function TrialAlert({ variant = 'info', showActionButton = true }: TrialAlertProps) {
  const { trialAccess, loading } = useTrialAccess();
  const { user } = useUserRole();
  const router = useRouter();

  if (loading) {
    return null;
  }

  if (user?.role === 'super_admin') {
    return null;
  }

  if (trialAccess.canUseFeatures) {
    return null;
  }

  const handleChoosePlan = () => {
    router.push('/assinatura');
  };

  const getAlertConfig = () => {
    if (trialAccess.isTrialExpired) {
      return {
        icon: AlertTriangle,
        title: 'Período de Teste Expirado',
        message: trialAccess.message,
        variant: 'error' as const,
        actionText: 'Escolher Plano',
      };
    }

    if (trialAccess.daysRemaining <= 3) {
      return {
        icon: Clock,
        title: 'Trial Expirando em Breve',
        message: trialAccess.message,
        variant: 'warning' as const,
        actionText: 'Escolher Plano',
      };
    }

    return {
      icon: CheckCircle,
      title: 'Período de Teste Ativo',
      message: trialAccess.message,
      variant: 'info' as const,
      actionText: 'Ver Planos',
    };
  };

  const config = getAlertConfig();

  return (
    <Alert variant={config.variant} className="mb-6">
      <div className="flex items-start gap-3">
        <config.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium mb-1">{config.title}</h4>
          <p className="text-sm opacity-90">{config.message}</p>
          {showActionButton && (
            <div className="mt-3">
              <Button
                size="sm"
                onClick={handleChoosePlan}
                variant={config.variant === 'error' ? 'primary' : 'outline'}
              >
                {config.actionText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
} 