import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Progress } from './Progress';
import { Badge } from './Badge';
import { Alert } from './Alert';
import { UsageStats } from '@/hooks/useUsage';
import {
  MessageSquare,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PlanLimitsCardProps {
  stats: UsageStats;
  loading?: boolean;
}

export function PlanLimitsCard({ stats, loading = false }: PlanLimitsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Limites do Plano
          </CardTitle>
          <CardDescription>
            Carregando estatísticas de uso...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusIcon = () => {
    if (stats.isOverLimit) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (stats.usagePercentage >= 80) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (stats.isOverLimit) {
      return 'Limite excedido';
    }
    if (stats.usagePercentage >= 80) {
      return 'Próximo do limite';
    }
    return 'Dentro do limite';
  };

  const getStatusColor = () => {
    if (stats.isOverLimit) {
      return 'error';
    }
    if (stats.usagePercentage >= 80) {
      return 'warning';
    }
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Limites do Plano
        </CardTitle>
        <CardDescription>
          Estatísticas de uso baseadas no seu plano atual
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Geral */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Status do Uso</span>
          </div>
          <Badge variant={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Instâncias WhatsApp */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Instâncias WhatsApp</span>
            </div>
            <span className="text-sm text-gray-600">
              {stats.currentInstances} / {stats.allowedInstances}
            </span>
          </div>

          <Progress
            value={Math.min(stats.usagePercentage, 100)}
            className="h-2"
          />

          <div className="flex justify-between text-xs text-gray-500">
            <span>Usado: {stats.currentInstances}</span>
            <span>Disponível: {stats.remainingInstances}</span>
          </div>
        </div>

        {/* Informações do Plano */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Plano Atual</span>
            </div>
            <p className="text-sm text-gray-600 capitalize">
              {stats.currentPlan} ({stats.planQuantity} pacote{stats.planQuantity > 1 ? 's' : ''})
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Próximo Vencimento</span>
            </div>
            <p className="text-sm text-gray-600">
              {formatDate(stats.nextDueDate)}
            </p>
          </div>
        </div>

        {/* Valor Mensal */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Valor Mensal</span>
            <span className="text-lg font-semibold text-green-600">
              {formatCurrency(stats.monthlyPrice)}
            </span>
          </div>
        </div>

        {/* Alertas */}
        {stats.isOverLimit && (
          <Alert variant="error">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <h4 className="font-medium">Limite Excedido</h4>
              <p className="text-sm">
                Você excedeu o limite de {stats.allowedInstances} instâncias.
                Considere fazer upgrade do seu plano.
              </p>
            </div>
          </Alert>
        )}

        {stats.usagePercentage >= 80 && !stats.isOverLimit && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <div>
              <h4 className="font-medium">Próximo do Limite</h4>
              <p className="text-sm">
                Você está usando {stats.usagePercentage}% do seu limite.
                Considere adicionar mais pacotes ao seu plano.
              </p>
            </div>
          </Alert>
        )}

        {stats.subscriptionStatus === 'SUSPENDED' && (
          <Alert variant="error">
            <XCircle className="h-4 w-4" />
            <div>
              <h4 className="font-medium">Assinatura Suspensa</h4>
              <p className="text-sm">
                Sua assinatura está suspensa. Renove para continuar usando o serviço.
              </p>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 