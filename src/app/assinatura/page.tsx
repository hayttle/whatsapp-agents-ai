"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/brand';
import { Button } from '@/components/brand';
import { Badge } from '@/components/brand';
import { Check, Star, Zap, MessageSquare, XCircle, Clock, FileText } from 'lucide-react';
import { PlanList } from '@/components/brand/PlanList';

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
  const match = feature.match(/^\d+\s+(.*)$/);
  if (match) {
    const base = parseInt(feature.split(' ')[0], 10);
    const rest = match[1];
    return `${base * quantity} ${rest}`;
  }
  return feature;
}

export default function AssinaturaPage() {
  const router = useRouter();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { isLoading: userLoading } = useUserRole();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = userLoading || subscriptionLoading;

  // Mover as declarações para o topo
  const selectedPlanData = selectedPlan ? plans.find(p => p.id === selectedPlan) : null;
  const totalPrice = selectedPlanData ? selectedPlanData.price * quantity : 0;

  const handleSubscribe = async () => {
    if (!selectedPlan || !selectedPlanData) return;
    setLoadingPlan(selectedPlan);
    setError(null);
    try {
      // Criar assinatura via API
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          plan_name: selectedPlanData.name,
          plan_type: selectedPlan,
          quantity: quantity,
          value: selectedPlanData.price,
          price: selectedPlanData.price,
          cycle: 'MONTHLY',
          billing_type: 'CREDIT_CARD',
          description: `${selectedPlanData.name} - ${quantity}x ${selectedPlanData.features[0]}`,
          next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar assinatura');
      }
      const data = await response.json();
      if (data.success && data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('Link de checkout não recebido');
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erro inesperado.';
      setError(errorMessage);
    } finally {
      setLoadingPlan(null);
    }
  };

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

  // Se já tem assinatura, mostrar informações dela
  if (subscription) {
    // Novo fluxo: trial expirado mostra bloco informativo + escolha de planos
    const showTrialExpired = subscription.isTrial && subscription.status === 'EXPIRED';

    // Header sempre visível
    const header = (
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-gray-dark mb-2">Sua Assinatura</h1>
          <p className="text-gray-600">
            {subscription.isActive
              ? 'Você já possui uma assinatura ativa na plataforma.'
              : subscription.isTrial
                ? (showTrialExpired ? 'Seu período de teste expirou.' : 'Seu período de teste está ativo.')
                : 'Gerencie sua assinatura atual.'
            }
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/assinatura/historico')}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Ver Histórico
        </Button>
      </div>
    );

    if (showTrialExpired) {
      return (
        <div className="max-w-6xl mx-auto p-8">
          {header}
          {/* Bloco informativo trial expirado */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Trial
              </CardTitle>
              <CardDescription>
                Seu período de teste gratuito já expirou.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Data de Cadastro</p>
                  <p className="text-lg font-semibold">{new Date(subscription.startedAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data de Expiração</p>
                  <p className="text-lg font-semibold">{new Date(subscription.expiresAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant="error">Expirado</Badge>
                </div>
              </div>
              <div className="mt-4 text-red-700 font-medium">
                <p>O seu período de teste gratuito de 7 dias terminou.</p>
                <p>Para continuar usando os recursos da plataforma, escolha um plano abaixo.</p>
              </div>
            </CardContent>
          </Card>
          {/* Bloco de escolha de planos */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Escolha seu novo plano</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <Card
                        key={plan.id}
                        className={`cursor-pointer transition-all duration-200 ${isSelected ? 'ring-4 ring-brand-green-light border-brand-green-light bg-green-50 scale-105 shadow-lg' : 'hover:border-gray-300'}`}
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
                          {/* Recursos multiplicados */}
                          <div className="space-y-1 mt-4">
                            {selectedPlanData.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-gray-600">{multiplyBenefit(feature, quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Valor Total */}
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-gray-600">Valor Total:</span>
                          <span className="text-lg font-bold text-green-600">
                            R$ {totalPrice.toFixed(2).replace('.', ',')}
                          </span>
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
                  <CardFooter>
                    <Button
                      onClick={handleSubscribe}
                      disabled={!selectedPlan}
                      loading={loadingPlan === selectedPlan}
                      className="w-full"
                    >
                      Assinar Plano
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // Trial ativo: mostrar apenas o card de informações do trial
    if (subscription.isTrial && subscription.status === 'TRIAL') {
      return (
        <div className="max-w-6xl mx-auto p-8">
          {header}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Trial
              </CardTitle>
              <CardDescription>
                Seu período de teste gratuito está ativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Data de Cadastro</p>
                  <p className="text-lg font-semibold">{new Date(subscription.startedAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data de Expiração</p>
                  <p className="text-lg font-semibold">{new Date(subscription.expiresAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant="warning">Trial Ativo</Badge>
                </div>
              </div>
              <div className="mt-4 text-yellow-700 font-medium">
                Aproveite todos os recursos gratuitamente até a data de expiração do seu trial.<br />
                <span className="block mt-2 text-yellow-800">Se preferir, você já pode escolher e contratar um plano pago agora mesmo. A contratação antecipada garante a continuidade dos recursos sem interrupção.</span>
              </div>
            </CardContent>
          </Card>
          {/* Bloco de escolha de planos */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Antecipe e escolha seu plano</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <Card
                        key={plan.id}
                        className={`cursor-pointer transition-all duration-200 ${isSelected ? 'ring-4 ring-brand-green-light border-brand-green-light bg-green-50 scale-105 shadow-lg' : 'hover:border-gray-300'}`}
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
                          {/* Recursos multiplicados */}
                          <div className="space-y-1 mt-4">
                            {selectedPlanData.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-gray-600">{multiplyBenefit(feature, quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Valor Total */}
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-gray-600">Valor Total:</span>
                          <span className="text-lg font-bold text-green-600">
                            R$ {totalPrice.toFixed(2).replace('.', ',')}
                          </span>
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
                  <CardFooter>
                    <Button
                      onClick={handleSubscribe}
                      disabled={!selectedPlan}
                      loading={loadingPlan === selectedPlan}
                      className="w-full"
                    >
                      Assinar Plano
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Se não tem assinatura ativa, mostrar planos disponíveis
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
                  className={`cursor-pointer transition-all duration-200 ${isSelected ? 'ring-4 ring-brand-green-light border-brand-green-light bg-green-50 scale-105 shadow-lg' : 'hover:border-gray-300'}`}
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
                    {/* Recursos multiplicados */}
                    <div className="space-y-1 mt-4">
                      {selectedPlanData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">{multiplyBenefit(feature, quantity)}</span>
                        </div>
                      ))}
                    </div>
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