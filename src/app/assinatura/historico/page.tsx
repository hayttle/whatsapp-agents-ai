"use client";

import { useState } from 'react';
import { SubscriptionHistory } from '@/components/brand';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/brand';
import { Button } from '@/components/brand';
import { Alert } from '@/components/brand';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HistoricoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRenew = async (subscriptionId: string) => {
    setLoading(true);
    setError(null);

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
        window.location.reload();
      } else {
        throw new Error('Erro ao renovar assinatura');
      }

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erro inesperado.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoiceUrl: string) => {
    window.open(invoiceUrl, '_blank');
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
            onClick={() => window.location.reload()}
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

      {error && (
        <Alert variant="error" className="mb-6">
          <div>
            <p className="font-medium">Erro ao processar ação</p>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Suas Assinaturas</CardTitle>
          <CardDescription>
            Histórico completo de todas as suas assinaturas na plataforma
          </CardDescription>
        </CardHeader>
        <div className="p-6">
          <SubscriptionHistory
            onRenew={handleRenew}
            onViewInvoice={handleViewInvoice}
          />
        </div>
      </Card>
    </div>
  );
} 