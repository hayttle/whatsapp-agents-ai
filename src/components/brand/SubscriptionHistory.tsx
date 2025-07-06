"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Alert } from './Alert';
import { Calendar, FileText, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export interface SubscriptionHistoryItem {
  id: string;
  plan: string;
  planType: string;
  quantity: number;
  allowedInstances: number;
  status: string;
  value: number;
  price: number;
  cycle: string;
  startedAt: string;
  nextDueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  invoiceUrl?: string;
  isActive: boolean;
  isTrial: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionHistoryProps {
  onRenew?: (subscriptionId: string) => void;
  onViewInvoice?: (invoiceUrl: string) => void;
}

export function SubscriptionHistory({ onRenew, onViewInvoice }: SubscriptionHistoryProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/history', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setSubscriptions(data.subscriptions);
      } else {
        throw new Error(data.error || 'Erro ao buscar histórico');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar histórico';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'TRIAL':
        return {
          label: 'Período Trial',
          variant: 'warning' as const,
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      case 'ACTIVE':
        return {
          label: 'Ativo',
          variant: 'success' as const,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'SUSPENDED':
        return {
          label: 'Suspenso',
          variant: 'error' as const,
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelado',
          variant: 'default' as const,
          icon: XCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
      case 'OVERDUE':
        return {
          label: 'Vencido',
          variant: 'error' as const,
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      default:
        return {
          label: status,
          variant: 'default' as const,
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'MONTHLY':
        return 'Mensal';
      case 'YEARLY':
        return 'Anual';
      case 'WEEKLY':
        return 'Semanal';
      case 'DAILY':
        return 'Diário';
      default:
        return cycle;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-green-light" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <AlertTriangle className="h-4 w-4" />
        <div>
          <p className="font-medium">Erro ao carregar histórico</p>
          <p className="text-sm">{error}</p>
        </div>
      </Alert>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma assinatura encontrada</h3>
          <p className="text-gray-600 text-center">
            Você ainda não possui histórico de assinaturas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => {
        const statusConfig = getStatusConfig(subscription.status);
        const StatusIcon = statusConfig.icon;

        return (
          <Card key={subscription.id} className={`${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {subscription.isTrial ? 'Período Trial' : subscription.plan}
                  </CardTitle>
                  <CardDescription>
                    {subscription.isTrial ? 'Período de teste gratuito' : `Plano ${subscription.plan} - ${getCycleLabel(subscription.cycle)}`}
                  </CardDescription>
                </div>
                <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor</p>
                  <p className="text-lg font-semibold">{formatCurrency(subscription.value)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Quantidade</p>
                  <p className="text-lg font-semibold">{subscription.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Instâncias</p>
                  <p className="text-lg font-semibold">{subscription.allowedInstances}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Criado em</p>
                  <p className="text-sm">{formatDate(subscription.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Início: {formatDate(subscription.startedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Vencimento: {formatDate(subscription.nextDueDate)}</span>
                </div>
              </div>

              {subscription.paidAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Último pagamento: {formatDate(subscription.paidAt)}</span>
                </div>
              )}

              <div className="flex gap-2">
                {(subscription.isSuspended || (subscription.isTrial && !subscription.isActive)) && onRenew && (
                  <Button
                    onClick={() => onRenew(subscription.id)}
                    variant="primary"
                    size="sm"
                  >
                    Renovar
                  </Button>
                )}

                {subscription.invoiceUrl && onViewInvoice && (
                  <Button
                    onClick={() => onViewInvoice(subscription.invoiceUrl!)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Ver Fatura
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 