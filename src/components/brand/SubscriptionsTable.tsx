"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/brand';
import { Button } from '@/components/brand';
import { Badge } from '@/components/brand';
import { Select } from '@/components/brand';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { formatDateToDisplay, getCycleLabel } from '@/lib/utils';
import {
  Calendar,
  DollarSign,
  Package,
  FileText,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface SubscriptionsTableProps {
  className?: string;
}

export function SubscriptionsTable({ className = "" }: SubscriptionsTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'CANCELED'>('ALL');
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const { subscriptions, loading, error, refetch } = useSubscriptions({ status: statusFilter });

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura? Esta ação não pode ser desfeita.')) {
      return;
    }

    setCancelingId(subscriptionId);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cancelar assinatura');
      }

      // Recarregar a lista
      refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      alert(`Erro ao cancelar assinatura: ${errorMessage}`);
    } finally {
      setCancelingId(null);
    }
  };

  const handleViewCharges = (subscriptionId: string) => {
    router.push(`/assinatura/historico?subscription=${subscriptionId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'INACTIVE':
      case 'CANCELED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Ativa</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pendente</Badge>;
      case 'INACTIVE':
        return <Badge variant="error">Inativa</Badge>;
      case 'CANCELED':
        return <Badge variant="error">Cancelada</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Suas Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green-light" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Suas Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span>Erro ao carregar assinaturas: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Suas Assinaturas</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtrar por:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-32"
            >
              <option value="ALL">Todas</option>
              <option value="ACTIVE">Ativas</option>
              <option value="PENDING">Pendentes</option>
              <option value="INACTIVE">Inativas</option>
              <option value="CANCELED">Canceladas</option>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma assinatura encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Plano</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Quantidade</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Valor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ciclo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Início</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Próximo Vencimento</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(subscription.status)}
                        <div>
                          <p className="font-medium">{subscription.plan}</p>
                          <p className="text-sm text-gray-500">{subscription.planType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>{subscription.quantity} pacote{subscription.quantity > 1 ? 's' : ''}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(subscription.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span>R$ {subscription.value.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{getCycleLabel(subscription.cycle)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDateToDisplay(subscription.startedAt)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDateToDisplay(subscription.nextDueDate)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCharges(subscription.id)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Cobranças
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelSubscription(subscription.id)}
                          disabled={cancelingId === subscription.id}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          {cancelingId === subscription.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          Cancelar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 