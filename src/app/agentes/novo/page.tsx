'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgentModal } from '@/components/admin/agents/AgentModal';
import { authenticatedFetch } from '@/lib/utils';

export default function NovoAgentePage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    async function fetchTenantId() {
      try {
        const data = await authenticatedFetch('/api/users/current');
        setTenantId(data.tenant_id || '');
      } catch {
        setTenantId('');
      }
    }
    fetchTenantId();
  }, []);

  const handleSaved = (agentId: string) => {
    setModalOpen(false);
    if (agentId) {
      router.push(`/agentes/${agentId}/configuracao`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button
        className="bg-brand-green-light text-white px-6 py-3 rounded font-bold mb-6"
        onClick={() => setModalOpen(true)}
      >
        Criar agente
      </button>
      <AgentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        agent={null}
        tenantId={tenantId}
        isSuperAdmin={!tenantId}
      />
    </div>
  );
} 