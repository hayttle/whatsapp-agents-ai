"use client";
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button, Alert } from '@/components/brand';
import { PLANS } from '@/lib/plans';
import { toast } from 'sonner';
import { Check, Package, CreditCard } from 'lucide-react';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PlanSelectionModal({ isOpen, onClose, onSuccess }: PlanSelectionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlanSelect = async () => {
    if (!selectedPlan) {
      setError('Selecione um plano');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Criar assinatura pendente
      const response = await fetch('/api/subscriptions/create-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          plan_type: selectedPlan,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar assinatura');
      }

      if (data.success && data.asaas_payment_url) {
        toast.success('Redirecionando para o pagamento...');

        // Redirecionar para o link de pagamento do Asaas em nova aba
        window.open(data.asaas_payment_url, '_blank');

        // Fechar modal e chamar callback de sucesso
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error('Link de pagamento não recebido');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPlan('');
    setQuantity(1);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-4xl">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Escolha seu Plano</h2>
          <p className="text-gray-600">Selecione o plano ideal para sua empresa</p>
        </div>

        {error && (
          <Alert variant="error" title="Erro" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Seleção de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {Object.entries(PLANS).map(([planKey, plan]) => (
            <div
              key={planKey}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${selectedPlan === planKey
                  ? 'border-brand-green-light bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => setSelectedPlan(planKey)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-brand-green-light" />
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                </div>
                {selectedPlan === planKey && (
                  <Check className="w-6 h-6 text-brand-green-light" />
                )}
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                  <span className="text-sm font-normal text-gray-500">/mês</span>
                </div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{plan.instancesPerPack.native} instâncias nativas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{plan.instancesPerPack.external} instâncias externas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{plan.agentsPerPack.internal} agentes internos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{plan.agentsPerPack.external} agentes externos</span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                {plan.packDescription}
              </div>
            </div>
          ))}
        </div>

        {/* Seleção de Quantidade */}
        {selectedPlan && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade de Pacotes
            </label>
            <div className="flex items-center gap-4">
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green-light"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'pacote' : 'pacotes'}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-600">
                Total: R$ {(PLANS[selectedPlan]?.price * quantity).toFixed(2).replace('.', ',')}/mês
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handlePlanSelect}
            loading={loading}
            disabled={!selectedPlan || loading}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            {loading ? 'Processando...' : 'Continuar para Pagamento'}
          </Button>
        </div>
      </div>
    </Modal>
  );
} 