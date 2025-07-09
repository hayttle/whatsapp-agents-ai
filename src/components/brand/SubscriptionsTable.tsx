"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/brand';
import { Button } from '@/components/brand';
import { Badge } from '@/components/brand';
import { Select } from '@/components/brand';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { formatDateToDisplay, getCycleLabel } from '@/lib/utils';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import {
  Calendar,
  DollarSign,
  Package,
  FileText,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  PlayCircle
} from 'lucide-react';

interface Subscription {
  id: string;
  plan: string;
  planType: string;
  quantity: number;
  status: string;
  value: number;
  cycle: string;
  startedAt: string;
  nextDueDate: string;
}

interface SubscriptionsTableProps {
  className?: string;
}

export function SubscriptionsTable({ className = "" }: SubscriptionsTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'CANCELED'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'cancel' | 'reactivate'>('cancel');
  const { subscriptions, loading, error, refetch } = useSubscriptions({ status: statusFilter });

  const handleCancelClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setModalError(null);
    setActionType('cancel');
    setShowCancelModal(true);
  };

  const handleReactivateClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setModalError(null);
    setActionType('reactivate');
    setShowReactivateModal(true);
  };

  const handleActionConfirm = async () => {
    if (!selectedSubscription) return;

    setProcessingId(selectedSubscription.id);
    setModalError(null);

    try {
      const endpoint = actionType === 'cancel' ? '/api/subscriptions/cancel' : '/api/subscriptions/reactivate';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subscriptionId: selectedSubscription.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ao ${actionType === 'cancel' ? 'cancelar' : 'reativar'} assinatura`);
      }

      // Fechar modal e recarregar a lista
      setShowCancelModal(false);
      setShowReactivateModal(false);
      setSelectedSubscription(null);
      refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setModalError(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleModalClose = () => {
    setShowCancelModal(false);
    setShowReactivateModal(false);
    setSelectedSubscription(null);
    setModalError(null);
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
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'CANCELED':
        return <XCircle className="w-4 h-4 text-gray-500" />;
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
        <CardHeader><></></CardHeader>
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
        <CardHeader><></></CardHeader>
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
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filtrar por:</span>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'CANCELED')}
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
                          {subscription.status === 'INACTIVE' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivateClick(subscription)}
                              disabled={processingId === subscription.id}
                              className="flex items-center gap-1 text-green-600 hover:text-green-700"
                            >
                              {processingId === subscription.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <PlayCircle className="w-3 h-3" />
                              )}
                              Reativar
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelClick(subscription)}
                              disabled={processingId === subscription.id || subscription.status === 'CANCELED'}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              {processingId === subscription.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              Cancelar
                            </Button>
                          )}
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

      {/* Modal de Confirmação de Cancelamento */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={handleModalClose}
        onConfirm={handleActionConfirm}
        title="Cancelar Assinatura"
        confirmText="Cancelar Assinatura"
        cancelText="Manter Ativa"
        isLoading={processingId === selectedSubscription?.id && actionType === 'cancel'}
        error={modalError || undefined}
      >
        {selectedSubscription && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Atenção</p>
                <p className="text-sm text-red-700">
                  Esta ação não pode ser desfeita e irá cancelar imediatamente a assinatura.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-gray-700">
                Você está prestes a cancelar a assinatura:
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedSubscription.plan}</p>
                    <p className="text-sm text-gray-600">
                      {selectedSubscription.quantity} pacote{selectedSubscription.quantity > 1 ? 's' : ''} • {getCycleLabel(selectedSubscription.cycle)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {selectedSubscription.value.toFixed(2).replace('.', ',')}</p>
                    <p className="text-sm text-gray-600">por ciclo</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Consequências do cancelamento:</strong>
              </p>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• Não haverá novas cobranças</li>
                <li>• A assinatura será desativada imediatamente</li>
                <li>• Você pode reativar a assinatura a qualquer momento</li>
              </ul>
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* Modal de Confirmação de Reativação */}
      <ConfirmationModal
        isOpen={showReactivateModal}
        onClose={handleModalClose}
        onConfirm={handleActionConfirm}
        title="Reativar Assinatura"
        confirmText="Reativar Assinatura"
        cancelText="Manter Inativa"
        isLoading={processingId === selectedSubscription?.id && actionType === 'reactivate'}
        error={modalError || undefined}
      >
        {selectedSubscription && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Reativação</p>
                <p className="text-sm text-green-700">
                  A assinatura será reativada e a próxima cobrança será gerada para hoje.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-gray-700">
                Você está prestes a reativar a assinatura:
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedSubscription.plan}</p>
                    <p className="text-sm text-gray-600">
                      {selectedSubscription.quantity} pacote{selectedSubscription.quantity > 1 ? 's' : ''} • {getCycleLabel(selectedSubscription.cycle)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {selectedSubscription.value.toFixed(2).replace('.', ',')}</p>
                    <p className="text-sm text-gray-600">por ciclo</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Consequências da reativação:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• A assinatura será ativada imediatamente</li>
                <li>• A próxima cobrança será gerada para hoje</li>
                <li>• Você terá acesso completo aos recursos do plano</li>
              </ul>
            </div>
          </div>
        )}
      </ConfirmationModal>
    </>
  );
} 