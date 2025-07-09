export interface PlanLimits {
  name: string;
  price: number;
  cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  instancesPerPack: {
    native: number;
    external: number;
  };
  agentsPerPack: {
    internal: number;
    external: number;
  };
  features: {
    qrCodeAccess: boolean;
    webhookManagement: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
  };
  description: string;
  packDescription: string;
}

// Nova interface para representar uma assinatura ativa
export interface ActiveSubscription {
  plan_name: string;
  quantity: number;
  status: string;
}

// Interface para limites totais de um tenant
export interface TotalLimits {
  nativeInstances: number;
  externalInstances: number;
  internalAgents: number;
  externalAgents: number;
  subscriptions: ActiveSubscription[];
}

export const PLANS: Record<string, PlanLimits> = {
  'starter': {
    name: 'Starter',
    price: 100.00,
    cycle: 'MONTHLY',
    instancesPerPack: {
      native: 2,
      external: 0,
    },
    agentsPerPack: {
      internal: 2,
      external: 0,
    },
    features: {
      qrCodeAccess: true,
      webhookManagement: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
    description: 'Ideal para quem quer a experiência completa, sem configurar nada. Inclui backend, n8n e WhatsApp API.',
    packDescription: 'Cada pacote inclui 2 instâncias nativas + 2 agentes internos gerenciados pela plataforma',
  },
  'pro': {
    name: 'Pro',
    price: 100.00,
    cycle: 'MONTHLY',
    instancesPerPack: {
      native: 0,
      external: 5,
    },
    agentsPerPack: {
      internal: 0,
      external: 5,
    },
    features: {
      qrCodeAccess: true,
      webhookManagement: true,
      advancedAnalytics: false,
      prioritySupport: false,
    },
    description: 'Para quem possui sua própria infraestrutura. Servidor API WhatsApp e n8n próprios.',
    packDescription: 'Cada pacote inclui 5 instâncias externas + 5 agentes externos para infraestrutura própria',
  },
};

export function getPlanByName(planName: string): PlanLimits | null {
  const planKey = Object.keys(PLANS).find(key => 
    PLANS[key].name.toLowerCase() === planName.toLowerCase()
  );
  return planKey ? PLANS[planKey] : null;
}

export function getPlanByKey(planKey: string): PlanLimits | null {
  return PLANS[planKey] || null;
}

export interface UsageStats {
  nativeInstances: number;
  externalInstances: number;
  internalAgents: number;
  externalAgents: number;
}

export function checkPlanLimits(
  planName: string, 
  currentUsage: UsageStats, 
  action: 'create_instance' | 'create_agent',
  type: 'native' | 'external' | 'internal' | 'external',
  quantity: number = 1
): { allowed: boolean; reason?: string } {
  const plan = getPlanByName(planName);
  if (!plan) {
    return { allowed: false, reason: 'Plano não encontrado' };
  }

  if (action === 'create_instance') {
    if (type === 'native') {
      const allowedInstances = plan.instancesPerPack.native * quantity;
      if (currentUsage.nativeInstances >= allowedInstances) {
        return { 
          allowed: false, 
          reason: `Limite de ${allowedInstances} instância(s) nativa(s) atingido (${quantity} pacote(s))` 
        };
      }
    } else if (type === 'external') {
      const allowedInstances = plan.instancesPerPack.external * quantity;
      if (currentUsage.externalInstances >= allowedInstances) {
        return { 
          allowed: false, 
          reason: `Limite de ${allowedInstances} instância(s) externa(s) atingido (${quantity} pacote(s))` 
        };
      }
    }
  } else if (action === 'create_agent') {
    if (type === 'internal') {
      const allowedAgents = plan.agentsPerPack.internal * quantity;
      if (currentUsage.internalAgents >= allowedAgents) {
        return { 
          allowed: false, 
          reason: `Limite de ${allowedAgents} agente(s) interno(s) atingido (${quantity} pacote(s))` 
        };
      }
    } else if (type === 'external') {
      const allowedAgents = plan.agentsPerPack.external * quantity;
      if (currentUsage.externalAgents >= allowedAgents) {
        return { 
          allowed: false, 
          reason: `Limite de ${allowedAgents} agente(s) externo(s) atingido (${quantity} pacote(s))` 
        };
      }
    }
  }

  return { allowed: true };
}

export function getUsagePercentage(
  planName: string, 
  currentUsage: UsageStats,
  quantity: number = 1
): Record<string, number> {
  const plan = getPlanByName(planName);
  if (!plan) return {};

  return {
    nativeInstances: plan.instancesPerPack.native > 0 ? (currentUsage.nativeInstances / (plan.instancesPerPack.native * quantity)) * 100 : 0,
    externalInstances: plan.instancesPerPack.external > 0 ? (currentUsage.externalInstances / (plan.instancesPerPack.external * quantity)) * 100 : 0,
    internalAgents: plan.agentsPerPack.internal > 0 ? (currentUsage.internalAgents / (plan.agentsPerPack.internal * quantity)) * 100 : 0,
    externalAgents: plan.agentsPerPack.external > 0 ? (currentUsage.externalAgents / (plan.agentsPerPack.external * quantity)) * 100 : 0,
  };
}

export function getPlanLimits(planKey: string, quantity: number = 1): {
  nativeInstances: number;
  externalInstances: number;
  internalAgents: number;
  externalAgents: number;
} | null {
  const plan = PLANS[planKey];
  if (!plan) return null;

  return {
    nativeInstances: plan.instancesPerPack.native * quantity,
    externalInstances: plan.instancesPerPack.external * quantity,
    internalAgents: plan.agentsPerPack.internal * quantity,
    externalAgents: plan.agentsPerPack.external * quantity,
  };
}

export function calculateTotalPrice(planKey: string, quantity: number): number {
  const plan = PLANS[planKey];
  if (!plan) return 0;
  return plan.price * quantity;
}

// Nova função para calcular limites totais baseados em múltiplas assinaturas
export function calculateTotalLimits(subscriptions: ActiveSubscription[]): TotalLimits {
  const totalLimits: TotalLimits = {
    nativeInstances: 0,
    externalInstances: 0,
    internalAgents: 0,
    externalAgents: 0,
    subscriptions: subscriptions.filter(sub => sub.status === 'ACTIVE')
  };

  // Calcular limites somando todas as assinaturas ativas
  totalLimits.subscriptions.forEach(subscription => {
    const plan = getPlanByName(subscription.plan_name);
    if (plan) {
      totalLimits.nativeInstances += plan.instancesPerPack.native * subscription.quantity;
      totalLimits.externalInstances += plan.instancesPerPack.external * subscription.quantity;
      totalLimits.internalAgents += plan.agentsPerPack.internal * subscription.quantity;
      totalLimits.externalAgents += plan.agentsPerPack.external * subscription.quantity;
    }
  });

  return totalLimits;
}

// Nova função para verificar limites considerando múltiplas assinaturas
export function checkTotalPlanLimits(
  subscriptions: ActiveSubscription[],
  currentUsage: UsageStats,
  action: 'create_instance' | 'create_agent',
  type: 'native' | 'external' | 'internal' | 'external'
): { allowed: boolean; reason?: string; totalLimits?: TotalLimits } {
  const totalLimits = calculateTotalLimits(subscriptions);
  
  if (action === 'create_instance') {
    if (type === 'native') {
      if (currentUsage.nativeInstances >= totalLimits.nativeInstances) {
        return { 
          allowed: false, 
          reason: `Limite total de ${totalLimits.nativeInstances} instância(s) nativa(s) atingido`,
          totalLimits
        };
      }
    } else if (type === 'external') {
      if (currentUsage.externalInstances >= totalLimits.externalInstances) {
        return { 
          allowed: false, 
          reason: `Limite total de ${totalLimits.externalInstances} instância(s) externa(s) atingido`,
          totalLimits
        };
      }
    }
  } else if (action === 'create_agent') {
    if (type === 'internal') {
      if (currentUsage.internalAgents >= totalLimits.internalAgents) {
        return { 
          allowed: false, 
          reason: `Limite total de ${totalLimits.internalAgents} agente(s) interno(s) atingido`,
          totalLimits
        };
      }
    } else if (type === 'external') {
      if (currentUsage.externalAgents >= totalLimits.externalAgents) {
        return { 
          allowed: false, 
          reason: `Limite total de ${totalLimits.externalAgents} agente(s) externo(s) atingido`,
          totalLimits
        };
      }
    }
  }

  return { allowed: true, totalLimits };
}

// Função para obter porcentagem de uso considerando múltiplas assinaturas
export function getTotalUsagePercentage(
  subscriptions: ActiveSubscription[],
  currentUsage: UsageStats
): Record<string, number> {
  const totalLimits = calculateTotalLimits(subscriptions);
  
  return {
    nativeInstances: totalLimits.nativeInstances > 0 ? (currentUsage.nativeInstances / totalLimits.nativeInstances) * 100 : 0,
    externalInstances: totalLimits.externalInstances > 0 ? (currentUsage.externalInstances / totalLimits.externalInstances) * 100 : 0,
    internalAgents: totalLimits.internalAgents > 0 ? (currentUsage.internalAgents / totalLimits.internalAgents) * 100 : 0,
    externalAgents: totalLimits.externalAgents > 0 ? (currentUsage.externalAgents / totalLimits.externalAgents) * 100 : 0,
  };
} 