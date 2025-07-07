"use client";

import { useState } from 'react';
import { useSubscriptionHistory } from '@/hooks/useSubscriptionHistory';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/brand';
import { Button } from '@/components/brand';
import { Badge } from '@/components/brand';
import { Alert } from '@/components/brand';
import { ArrowLeft, RefreshCw, Download, Eye, Calendar, DollarSign, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDateToDisplay } from '@/lib/utils';

export default function HistoricoPage() {
  const router = useRouter();
  const { subscriptions, loading, error, refetch } = useSubscriptionHistory();
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRenew = async (subscriptionId: string) => {
    setLoadingAction(true);
    setActionError(null);

    try {
      const response = await fetch('/api/subscriptions/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId,
          plan_name: 'Renovação',
          value: 100.00,
          cycle: 'MONTHLY',
          billing_type: 'CREDIT_CARD',
          description: 'Renovação de assinatura',
          next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao renovar assinatura');
      }

      const data = await response.json();

      if (data.success) {
        await refetch();
      } else {
        throw new Error('Erro ao renovar assinatura');
      }

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erro inesperado.';
      setActionError(errorMessage);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleViewInvoice = (invoiceUrl: string) => {
    window.open(invoiceUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'TRIAL': { variant: 'warning' as const, label: 'Trial' },
      'ACTIVE': { variant: 'success' as const, label: 'Ativa' },
      'PENDING': { variant: 'warning' as const, label: 'Aguardando Pagamento' },
      'EXPIRED': { variant: 'error' as const, label: 'Expirada' },
      'SUSPENDED': { variant: 'error' as const, label: 'Suspensa' },
      'CANCELLED': { variant: 'error' as const, label: 'Cancelada' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'default' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { variant: 'warning' as const, label: 'Pendente' },
      'CONFIRMED': { variant: 'success' as const, label: 'Confirmado' },
      'RECEIVED': { variant: 'success' as const, label: 'Recebido' },
      'OVERDUE': { variant: 'error' as const, label: 'Vencido' },
      'REFUNDED': { variant: 'default' as const, label: 'Estornado' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'default' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            variant="outline"
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-brand-gray-dark mb-2">Histórico de Assinaturas</h1>
        <p className="text-gray-600">
          Visualize todas as suas assinaturas e transações na plataforma.
        </p>
      </div>

      {(error || actionError) && (
        <Alert variant="error" className="mb-6">
          <div>
            <p className="font-medium">Erro ao processar ação</p>
            <p className="text-sm">{error || actionError}</p>
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-light"></div>
        </div>
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Nenhuma assinatura encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {subscription.plan}
                      {getStatusBadge(subscription.status)}
                    </CardTitle>
                    <CardDescription>
                      Plano {subscription.planType} - {subscription.quantity} pacote(s)
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      R$ {subscription.value.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-sm text-gray-500">{subscription.cycle}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Início</p>
                      <p className="font-medium">{formatDateToDisplay(subscription.startedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Próximo Vencimento</p>
                      <p className="font-medium">
                        {subscription.nextDueDate ? formatDateToDisplay(subscription.nextDueDate) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Cobranças</p>
                      <p className="font-medium">{subscription.paymentsCount}</p>
                    </div>
                  </div>
                </div>

                {/* Lista de Cobranças */}
                {subscription.payments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Cobranças ({subscription.paymentsCount})
                    </h4>
                    <div className="space-y-3">
                      {subscription.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">R$ {payment.amount.toFixed(2).replace('.', ',')}</p>
                              <p className="text-sm text-gray-500">
                                {formatDateToDisplay(payment.dueDate)}
                              </p>
                            </div>
                            {getPaymentStatusBadge(payment.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            {payment.invoiceUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewInvoice(payment.invoiceUrl!)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                Ver Fatura
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t">
                  {subscription.invoiceUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewInvoice(subscription.invoiceUrl!)}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Baixar Fatura
                    </Button>
                  )}
                  {subscription.status === 'EXPIRED' && (
                    <Button
                      onClick={() => handleRenew(subscription.id)}
                      disabled={loadingAction}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      Renovar Assinatura
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 