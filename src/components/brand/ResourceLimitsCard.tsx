"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/brand';
import { Progress } from '@/components/brand';
import { useUsage } from '@/hooks/useUsage';
import {
  Smartphone,
  Server,
  Bot,
  Cpu,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface ResourceLimitsCardProps {
  tenantId?: string;
  isSuperAdmin?: boolean;
  className?: string;
}

export function ResourceLimitsCard({
  tenantId,
  isSuperAdmin = false,
  className = ""
}: ResourceLimitsCardProps) {
  const { data, loading, error } = useUsage({ tenantId, isSuperAdmin });

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Limites de Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-light"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Limites de Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-gray-600">
            <Info className="w-4 h-4" />
            <span>Faça login para visualizar os limites de recursos</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { usage, totalLimits, usagePercentage } = data;

  // Verificar se há assinaturas ativas
  const hasActiveSubscriptions = totalLimits.subscriptions.length > 0;

  if (!hasActiveSubscriptions) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Limites de Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-yellow-600">
            <Info className="w-4 h-4" />
            <span>Nenhuma assinatura ativa encontrada</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const resourceTypes = [
    {
      key: 'nativeInstances',
      label: 'Instâncias Nativas',
      icon: Smartphone,
      color: 'bg-blue-500',
      current: usage.nativeInstances,
      limit: totalLimits.nativeInstances,
      percentage: usagePercentage.nativeInstances,
    },
    {
      key: 'externalInstances',
      label: 'Instâncias Externas',
      icon: Server,
      color: 'bg-green-500',
      current: usage.externalInstances,
      limit: totalLimits.externalInstances,
      percentage: usagePercentage.externalInstances,
    },
    {
      key: 'internalAgents',
      label: 'Agentes Internos',
      icon: Bot,
      color: 'bg-purple-500',
      current: usage.internalAgents,
      limit: totalLimits.internalAgents,
      percentage: usagePercentage.internalAgents,
    },
    {
      key: 'externalAgents',
      label: 'Agentes Externos',
      icon: Cpu,
      color: 'bg-orange-500',
      current: usage.externalAgents,
      limit: totalLimits.externalAgents,
      percentage: usagePercentage.externalAgents,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          Limites de Recursos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Resumo das assinaturas */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Assinaturas Ativas:</h4>
            <div className="space-y-1">
              {totalLimits.subscriptions.map((subscription, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="font-medium">{subscription.plan_name}</span>
                  <span className="text-gray-500">({subscription.quantity} pacote{subscription.quantity > 1 ? 's' : ''})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recursos */}
          <div className="space-y-4">
            {resourceTypes.map((resource) => {
              const Icon = resource.icon;
              const isOverLimit = resource.current > resource.limit;
              const isNearLimit = resource.percentage >= 80 && resource.percentage < 100;

              return (
                <div key={resource.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${resource.color.replace('bg-', 'text-')}`} />
                      <span className="text-sm font-medium">{resource.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {resource.current} / {resource.limit}
                      </span>
                      {isOverLimit && (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      )}
                      {isNearLimit && !isOverLimit && (
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <Progress
                    value={Math.min(resource.percentage, 100)}
                    className="h-2"
                    progressClassName={
                      isOverLimit
                        ? 'bg-red-500'
                        : isNearLimit
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                    }
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{resource.percentage.toFixed(1)}% utilizado</span>
                    {isOverLimit && (
                      <span className="text-red-500 font-medium">
                        Limite excedido em {resource.current - resource.limit}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Avisos */}
          {resourceTypes.some(r => r.current > r.limit) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Limites excedidos</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Alguns recursos estão acima do limite permitido. Considere fazer upgrade da sua assinatura.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 