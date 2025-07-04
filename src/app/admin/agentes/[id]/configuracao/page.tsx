'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/brand/Button';
import { FiArrowLeft } from 'react-icons/fi';
import { Bot } from 'lucide-react';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { toast } from 'sonner';
import { agentService } from '@/services/agentService';
import { deepEqual } from '@/lib/utils';
import AgentForm from '@/components/admin/agents/AgentForm';
import { PromptModel } from '@/services/promptModelService';
import type { AgentData } from '@/hooks/useAgentConfig';
import { AgentDetailsLayout } from '@/components/admin/agents/AgentDetailsLayout';
import { Switch } from '@/components/brand/Switch';

export default function AgentConfigPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params?.id as string;
  const isNewAgent = agentId === 'novo';

  // Estados locais para formulário - sempre declarados
  const [agentPrompt, setAgentPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [initialAgent, setInitialAgent] = useState<unknown>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);

  // Hook sempre chamado, mas pode retornar dados vazios se agentId for inválido
  const { agent, loading, saving, error, saveAgent, updateField } = useAgentConfig({
    agentId: isNewAgent ? '' : (agentId || '')
  });

  // Sincronizar dados do agente com estados locais
  useEffect(() => {
    if (agent) {
      setAgentPrompt(agent.prompt || '');
      setSelectedModelId(agent.agent_model_id || '');
      setInitialAgent(agent);
    }
  }, [agent]);

  // Detectar alterações
  const hasUnsavedChanges = agent && initialAgent && !deepEqual(agent, initialAgent);

  // Interceptar navegação do navegador (fechar/atualizar aba)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Interceptar navegação interna (botão Voltar ou router)
  const handleProtectedNavigation = (navFn: () => void) => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      setPendingNavigation(() => navFn);
    } else {
      navFn();
    }
  };

  // Substituir handleCancel para usar proteção
  const handleCancel = () => {
    handleProtectedNavigation(() => router.back());
  };

  // Ações do modal
  const handleModalSave = async () => {
    if (!agent) return;
    setShowUnsavedModal(false);
    await handleSave();
    setTimeout(() => {
      if (pendingNavigation) pendingNavigation();
    }, 100); // Pequeno delay para garantir salvamento
  };
  const handleModalDiscard = () => {
    setShowUnsavedModal(false);
    if (pendingNavigation) pendingNavigation();
  };
  const handleModalCancel = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  const handleModelSelect = (model: PromptModel) => {
    setSelectedModelId(model.id ?? '');
    setAgentPrompt(model.content ?? '');
    updateField('agent_model_id', model.id ?? '');
    updateField('prompt', model.content ?? '');
  };

  const handleSave = async () => {
    if (!agent && !isNewAgent) return;

    if (isNewAgent) {
      // Lógica para criar novo agente
      if (!agentPrompt.trim()) {
        toast.error('Prompt é obrigatório para agentes internos');
        return;
      }

      try {
        // Buscar dados do usuário para obter tenant_id
        const userResponse = await fetch('/api/users/current');
        const userData = await userResponse.json();

        const agentData = {
          title: agent?.title || '',
          description: agent?.description || '',
          prompt: agentPrompt,
          fallback_message: agent?.fallback_message || '',
          active: agent?.active ?? true,
          personality: agent?.personality || '',
          custom_personality: agent?.custom_personality || '',
          tone: agent?.tone || '',
          rules: agent?.rules || '',
          buffer_time: agent?.buffer_time || 10,
          agent_model_id: selectedModelId || '',
          scheduling_enabled: agent?.scheduling_enabled || false,
          calendar_id: agent?.calendar_id || '',
          scheduling_query_prompt: agent?.scheduling_query_prompt || '',
          scheduling_create_prompt: agent?.scheduling_create_prompt || '',
          agent_type: 'internal' as const,
          tenant_id: userData.tenant_id || '',
          instance_id: null,
        };

        await agentService.createAgent(agentData);
        toast.success('Agente criado com sucesso!');
        router.push('/admin/agentes');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao criar agente';
        toast.error(errorMessage);
      }
    } else {
      // Lógica para atualizar agente existente
      if (!agent) return;

      if (agent.agent_type === 'external') {
        const agentData = {
          id: agent.id,
          title: agent.title,
          description: agent.description,
          webhookUrl: agent.webhookUrl,
          tenant_id: agent.tenant_id,
          active: agent.active,
          agent_type: 'external' as const,
          instance_id: agent.instance_id || null,
        };
        const result = await saveAgent(agentData);
        if (result.success) {
          setShowSuccess(true);
          toast.success('Agente salvo com sucesso!');
          setTimeout(() => setShowSuccess(false), 3000);
          router.push('/admin/agentes');
        } else {
          toast.error(result.error || 'Erro ao salvar agente');
        }
      } else {
        const agentData = {
          title: agent.title,
          description: agent.description,
          prompt: agentPrompt,
          fallback_message: agent.fallback_message,
          active: agent.active,
          personality: agent.personality,
          custom_personality: agent.custom_personality,
          tone: agent.tone,
          rules: agent.rules,
          buffer_time: agent.buffer_time,
          agent_model_id: selectedModelId || '',
          scheduling_enabled: agent.scheduling_enabled,
          calendar_id: agent.calendar_id,
          scheduling_query_prompt: agent.scheduling_query_prompt,
          scheduling_create_prompt: agent.scheduling_create_prompt,
        };
        const result = await saveAgent(agentData);
        if (result.success) {
          setShowSuccess(true);
          toast.success('Agente salvo com sucesso!');
          setTimeout(() => setShowSuccess(false), 3000);
          router.push('/admin/agentes');
        } else {
          toast.error(result.error || 'Erro ao salvar agente');
        }
      }
    }
  };

  // Função para alternar o status do agente
  const handleToggleActive = async () => {
    if (!agent) return;
    try {
      await saveAgent({ active: !agent.active });
      toast.success(`Agente ${!agent.active ? 'ativado' : 'desativado'} com sucesso!`);
    } catch {
      toast.error('Erro ao atualizar status do agente');
    }
  };

  // Se não há agentId e não é novo agente, mostrar erro
  if (!agentId && !isNewAgent) {
    return (
      <AgentDetailsLayout agentId={agentId}>
        <div className="max-w-3xl mx-auto py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">ID do agente não encontrado</h2>
            <p className="text-gray-600 mt-2">URL inválida.</p>
          </div>
        </div>
      </AgentDetailsLayout>
    );
  }

  if (loading && !isNewAgent) {
    return (
      <AgentDetailsLayout agentId={agentId}>
        <div className="max-w-3xl mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-light"></div>
          </div>
        </div>
      </AgentDetailsLayout>
    );
  }

  if (error && !isNewAgent) {
    return (
      <AgentDetailsLayout agentId={agentId}>
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FiArrowLeft className="text-red-400 text-xl mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Erro ao carregar agente</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </AgentDetailsLayout>
    );
  }

  if (!agent && !isNewAgent) {
    return (
      <AgentDetailsLayout agentId={agentId}>
        <div className="max-w-3xl mx-auto py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Agente não encontrado</h2>
            <p className="text-gray-600 mt-2">O agente solicitado não foi encontrado.</p>
          </div>
        </div>
      </AgentDetailsLayout>
    );
  }

  return (
    <AgentDetailsLayout agentId={agentId}>
      <div className="w-full py-8">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleCancel}
              leftIcon={<FiArrowLeft />}
            >
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <span className="bg-brand-green/10 rounded-full p-3 flex items-center justify-center">
                <Bot className="text-brand-green w-7 h-7" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{agent?.title || 'Agente'}</h1>
                <p className="text-gray-600">Configure o comportamento do seu agente inteligente</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={!!agent?.active}
              onCheckedChange={handleToggleActive}
              id="agent-active"
            />
            <span className="text-sm">{agent?.active ? 'Ativado' : 'Desativado'}</span>
          </div>
        </div>
        <AgentForm
          agent={agent}
          saving={saving}
          error={error || undefined}
          showSuccess={showSuccess}
          showUnsavedModal={showUnsavedModal}
          onSave={handleSave}
          onCancel={handleCancel}
          onModelSelect={handleModelSelect}
          updateField={(field, value) => updateField(field as keyof AgentData, value)}
          agentPrompt={agentPrompt}
          setAgentPrompt={setAgentPrompt}
          selectedModelId={selectedModelId ?? ''}
          handleModalSave={handleModalSave}
          handleModalDiscard={handleModalDiscard}
          handleModalCancel={handleModalCancel}
        />
      </div>
    </AgentDetailsLayout>
  );
} 