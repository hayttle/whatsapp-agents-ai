import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Alert } from './Alert';
import { Calendar, CreditCard, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export interface SubscriptionCardProps {
  subscription: {
    id: string;
    plan: string;
    status: string;
    value: number;
    cycle: string;
    startedAt: string;
    nextDueDate: string;
    paidAt?: string;
    paymentMethod?: string;
    invoiceUrl?: string;
    isActive: boolean;
    isTrial: boolean;
    isExpired: boolean;
  };
  onRenew?: () => void;
  onViewInvoice?: () => void;
  loading?: boolean;
}

const getStatusConfig = (status: string, isTrial: boolean) => {
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
    case 'EXPIRED':
      return {
        label: 'Expirado',
        variant: 'error' as const,
        icon: XCircle,
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

const getPaymentMethodLabel = (method?: string) => {
  switch (method) {
    case 'CREDIT_CARD':
      return 'Cartão de Crédito';
    case 'BOLETO':
      return 'Boleto';
    case 'PIX':
      return 'PIX';
    default:
      return method || 'Não informado';
  }
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onRenew,
  onViewInvoice,
  loading = false,
}) => {
  const statusConfig = getStatusConfig(subscription.status, subscription.isTrial);
  const StatusIcon = statusConfig.icon;

  const getTrialDaysLeft = () => {
    if (!subscription.isTrial) return null;

    const trialEnd = new Date(subscription.nextDueDate);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  const trialDaysLeft = getTrialDaysLeft();

  return (
    <Card className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{subscription.plan}</CardTitle>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </Badge>
        </div>
        <CardDescription>
          {subscription.isTrial
            ? 'Período de teste gratuito'
            : `Plano ${getCycleLabel(subscription.cycle)}`
          }
        </CardDescription>
      </CardHeader>

      {/* Mensagem amigável de trial expirado */}
      {subscription.isExpired && subscription.isTrial && (
        <div className="mb-2">
          <Alert variant="error">
            <XCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Seu período de teste gratuito expirou</p>
              <p className="text-sm">Para continuar usando os recursos da plataforma, escolha um plano.</p>
            </div>
          </Alert>
        </div>
      )}

      <CardContent className="space-y-4">
        {/* Valor */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Valor:</span>
          <span className="text-lg font-bold">{formatCurrency(subscription.value)}</span>
        </div>

        {/* Suspended Warning - trial expirado (removido para evitar duplicidade) */}
        {/* Suspended Warning - assinatura suspensa não trial */}
        {subscription.isExpired && !subscription.isTrial && (
          <Alert variant="error">
            <XCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Assinatura suspensa</p>
              <p className="text-sm">Renove sua assinatura para reativar o acesso ao sistema.</p>
            </div>
          </Alert>
        )}

        {/* Trial Warning */}
        {subscription.isTrial && trialDaysLeft !== null && trialDaysLeft > 0 && (
          <Alert variant={trialDaysLeft <= 3 ? 'error' : 'warning'}>
            <Clock className="h-4 w-4" />
            <div>
              <p className="font-medium">
                {`${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''} restante${trialDaysLeft !== 1 ? 's' : ''} no trial`}
              </p>
              {trialDaysLeft <= 3 && trialDaysLeft > 0 && (
                <p className="text-sm">Renove sua assinatura para continuar usando o sistema.</p>
              )}
            </div>
          </Alert>
        )}

        {/* Informações da assinatura */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Início:</span>
            <span>{formatDate(subscription.startedAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Próximo vencimento:</span>
            <span>{formatDate(subscription.nextDueDate)}</span>
          </div>

          {subscription.paidAt && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">Último pagamento:</span>
              <span>{formatDate(subscription.paidAt)}</span>
            </div>
          )}

          {subscription.paymentMethod && (
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Método de pagamento:</span>
              <span>{getPaymentMethodLabel(subscription.paymentMethod)}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {(subscription.isExpired || (subscription.isTrial && trialDaysLeft === 0)) && (
          <Button
            onClick={onRenew}
            disabled={loading}
            className="flex-1"
            variant="primary"
          >
            {loading ? 'Processando...' : 'Renovar Plano'}
          </Button>
        )}

        {subscription.invoiceUrl && (
          <Button
            onClick={onViewInvoice}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Ver Fatura
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}; 