'use client';
import React from 'react';
import { PlanCard } from './PlanCard';
import { useRouter } from 'next/navigation';

const plans = [
  {
    id: 'externo',
    name: 'Pacote Externo',
    price: 'R$ 89,90/mês',
    description: 'Ideal para quem precisa de múltiplas conexões externas.',
    features: [
      '5 instâncias externas',
      '5 agentes externos',
      'Suporte básico',
      'Acesso ao painel web',
    ],
    highlight: false,
  },
  {
    id: 'nativo',
    name: 'Instância Nativa + IA',
    price: 'R$ 139,90/mês',
    description: 'Para quem quer integração nativa e IA avançada.',
    features: [
      '1 instância nativa',
      '1 agente de IA',
      'Suporte prioritário',
      'Acesso ao painel web',
    ],
    highlight: true,
  },
];

export const PlanList: React.FC = () => {
  const router = useRouter();

  const handleSubscribe = (planId: string) => {
    router.push(`/checkout?plan=${planId}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            name={plan.name}
            price={plan.price}
            description={plan.description}
            features={plan.features}
            highlight={plan.highlight}
            onSubscribe={() => handleSubscribe(plan.id)}
          />
        ))}
      </div>
    </div>
  );
}; 