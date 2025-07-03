'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AgentQuickCreateModal from '@/components/admin/agents/AgentQuickCreateModal';

export default function NovoAgentePage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    async function fetchTenantId() {
      try {
        const res = await fetch('/api/users/current');
        const data = await res.json();
        setTenantId(data.tenant_id || '');
      } catch {
        setTenantId('');
      }
    }
    fetchTenantId();
  }, []);

  const handleCreated = (agentId: string) => {
    setModalOpen(false);
    router.push(`/admin/agentes/${agentId}/configuracao`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button
        className="bg-brand-green-light text-white px-6 py-3 rounded font-bold mb-6"
        onClick={() => setModalOpen(true)}
      >
        Criar agente
      </button>
      <AgentQuickCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
        tenantId={tenantId}
      />
    </div>
  );
} 