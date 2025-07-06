"use client";

import { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/brand';
import { Button } from '@/components/brand';
import { Badge } from '@/components/brand';
import { Check, Star, Zap, MessageSquare, Bot, Server, ExternalLink } from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 100.00,
    description: 'Ideal para quem quer a experiência completa, sem configurar nada.',
    features: [
      '2 instâncias nativas',
      '2 agentes internos (IA)',
      'Backend, n8n e WhatsApp API inclusos',
      'Tela de gestão simplificada',
    ],
    icon: MessageSquare,
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 100.00,
    description: 'Para quem possui sua própria infraestrutura.',
    features: [
      '5 instâncias externas',
      '5 agentes externos (n8n)',
      'Gerenciamento de webhooks',
      'Infraestrutura própria',
    ],
    icon: Zap,
    highlight: true,
  },
];

// Função utilitária para multiplicar o número inicial do benefício pela quantidade
function multiplyBenefit(feature: string, quantity: number) {
  // Regex para pegar número no início da string
  const match = feature.match(/^(\d+)\s+(.*)$/);
  if (match) {
    const base = parseInt(match[1], 10);
    const rest = match[2];
    return `${base * quantity} ${rest}`;
  }
  return feature;
}

export default function AssinaturaPage() {
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { userData, isLoading: userLoading } = useUserRole();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = userLoading || subscriptionLoading;

  // Se o usuário já tem uma assinatura ativa, mostrar informações dela
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-light"></div>
        </div>
      </div>
    );
  }

  // Se já tem assinatura ativa, mostrar informações dela
  if (subscription && subscription.isActive) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-gray-dark mb-2">Sua Assinatura</h1>
          <p className="text-gray-600">
            Você já possui uma assinatura ativa na plataforma.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {subscription.plan}
            </CardTitle>
            <CardDescription>
              Status: {subscription.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Plano</p>
                <p className="text-lg font-semibold capitalize">{subscription.planType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Quantidade</p>
                <p className="text-lg font-semibold">{subscription.quantity} pacote{subscription.quantity > 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Mensal</p>
                <p className="text-lg font-semibold text-green-600">
                  R$ {subscription.price.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Próximo Vencimento</p>
                <p className="text-lg font-semibold">
                  {new Date(subscription.nextDueDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                Instâncias permitidas: {subscription.allowedInstances}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não tem assinatura ativa, mostrar planos disponíveis
  const selectedPlanData = selectedPlan ? plans.find(p => p.id === selectedPlan) : null;
  const totalPrice = selectedPlanData ? selectedPlanData.price * quantity : 0;

  const handleSubscribe = async () => {
    if (!selectedPlan || !selectedPlanData) return;

    setLoadingPlan(selectedPlan);
    setError(null);

    try {
      // Obter o link de checkout do Asaas baseado no plano
      let checkoutUrl = '';

      if (selectedPlan === 'starter') {
        checkoutUrl = process.env.NEXT_PUBLIC_ASAAS_STARTER_CHECKOUT_URL || '';
      } else if (selectedPlan === 'pro') {
        checkoutUrl = process.env.NEXT_PUBLIC_ASAAS_PRO_CHECKOUT_URL || '';
      }

      if (!checkoutUrl) {
        setError('Link de checkout não configurado para este plano.');
        return;
      }

      // Abrir o checkout do Asaas em uma nova página/tab
      window.open(checkoutUrl, '_blank');

    } catch (e: any) {
      setError(e.message || 'Erro inesperado.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-gray-dark mb-2">Escolha seu Plano</h1>
        <p className="text-gray-600">
          Selecione o plano ideal para suas necessidades e comece a usar a plataforma.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna da Esquerda - Seleção de Planos */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all duration-200 ${isSelected
                    ? 'ring-2 ring-brand-green-light border-brand-green-light'
                    : 'hover:border-gray-300'
                    }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-brand-green-light' : 'text-gray-400'}`} />
                        <div>
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          {plan.highlight && (
                            <Badge variant="default" className="mt-1">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Coluna da Direita - Detalhes e Checkout */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Resumo da Assinatura</CardTitle>
              <CardDescription>
                {selectedPlan ? 'Confirme os detalhes do seu plano' : 'Selecione um plano para continuar'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedPlanData ? (
                <>
                  {/* Plano Selecionado */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = selectedPlanData.icon;
                        return <Icon className="w-5 h-5 text-brand-green-light" />;
                      })()}
                      <div>
                        <h3 className="font-semibold">{selectedPlanData.name}</h3>
                        <p className="text-sm text-gray-600">{selectedPlanData.description}</p>
                      </div>
                    </div>

                    {/* Quantidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade de Pacotes
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Benefícios */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Benefícios Incluídos:</h4>
                      <div className="space-y-2">
                        {selectedPlanData.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600">{multiplyBenefit(feature, quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cálculo do Valor */}
                    <div className="pt-4 border-t">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            {selectedPlanData.name} ({quantity} pacote{quantity > 1 ? 's' : ''})
                          </span>
                          <span className="text-sm font-medium">
                            R$ {(selectedPlanData.price * quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total Mensal</span>
                          <span className="text-green-600">
                            R$ {totalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Assinatura */}
                    <Button
                      onClick={handleSubscribe}
                      disabled={loadingPlan !== null}
                      className="w-full"
                    >
                      {loadingPlan === selectedPlan ? 'Gerando link...' : 'Assinar Agora'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Selecione um plano para ver os detalhes e continuar com a assinatura.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 