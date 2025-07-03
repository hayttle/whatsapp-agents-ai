import React from 'react';
import type { AgentData } from '@/hooks/useAgentConfig';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/brand/Card';
import { Button } from '@/components/brand/Button';
import { Input } from '@/components/brand/Input';
import { Select } from '@/components/brand/Select';
import { Switch } from '@/components/brand/Switch';
import { FiBookOpen, FiUser, FiCalendar, FiSave, FiArrowLeft, FiSettings } from 'react-icons/fi';
import { Webhook } from 'lucide-react';
import { PromptModelDropdown } from '@/components/admin/agents/internal/PromptModelDropdown';
import { PromptModel } from '@/services/promptModelService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface AgentFormProps {
  agent: AgentData | null;
  saving: boolean;
  error?: string;
  showSuccess: boolean;
  showUnsavedModal: boolean;
  onSave: () => void;
  onCancel: () => void;
  onModelSelect: (model: PromptModel) => void;
  updateField: (field: keyof AgentData, value: string | number | boolean | null | undefined) => void;
  agentPrompt: string;
  setAgentPrompt: (v: string) => void;
  selectedModelId?: string | null;
  handleModalSave: () => void;
  handleModalDiscard: () => void;
  handleModalCancel: () => void;
}

export default function AgentForm({
  agent,
  saving,
  error,
  showSuccess,
  showUnsavedModal,
  onSave,
  onCancel,
  onModelSelect,
  updateField,
  agentPrompt,
  setAgentPrompt,
  selectedModelId,
  handleModalSave,
  handleModalDiscard,
  handleModalCancel
}: AgentFormProps) {
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(); }}>
      {/* Feedback de sucesso */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded mb-4">
          Agente salvo com sucesso!
        </div>
      )}
      {/* Erro */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}
      {/* Seção: Configurações Básicas */}
      <Card className="mt-0 mb-8">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="bg-gray-100 rounded-full p-2"><FiSettings className="text-gray-500 text-xl" /></div>
          <div>
            <CardTitle>Configurações Básicas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            label="Título do agente"
            placeholder="Título do agente"
            value={agent?.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
          />
          <Input
            label="Descrição"
            placeholder="Descrição"
            value={agent?.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
          />
          {agent?.agent_type === 'internal' && (
            <Input
              label="Tempo de pausa (segundos)"
              placeholder="Tempo de pausa (segundos)"
              type="number"
              value={agent?.buffer_time || ''}
              onChange={(e) => updateField('buffer_time', parseFloat(e.target.value) || null)}
            />
          )}
        </CardContent>
      </Card>
      {/* Seção: Configuração Webhook - apenas para agentes externos */}
      {agent?.agent_type === 'external' && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-purple-100 rounded-full p-2"><Webhook className="text-purple-500 text-xl" /></div>
            <div>
              <CardTitle>Configuração Webhook</CardTitle>
              <CardDescription>Configure o endpoint n8n para seu agente externo</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="URL do Webhook n8n *"
                placeholder="https://seu-n8n.com/webhook/abc123"
                value={agent?.webhookUrl || ''}
                onChange={(e) => updateField('webhookUrl', e.target.value)}
                required
              />
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                <p><strong>Como configurar:</strong></p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Crie um webhook no n8n</li>
                  <li>Copie a URL do webhook gerada</li>
                  <li>Cole a URL no campo acima</li>
                  <li>Configure a lógica de resposta no n8n</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Seção: Modelos Padrão - apenas para agentes internos */}
      {agent?.agent_type === 'internal' && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-blue-100 rounded-full p-2"><FiBookOpen className="text-blue-500 text-xl" /></div>
            <div>
              <CardTitle>Modelos Padrão</CardTitle>
              <CardDescription>Selecione um modelo pré-configurado para seu agente</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PromptModelDropdown
                onSelect={onModelSelect}
                value={selectedModelId ?? ''}
              />
              {/* Textarea para texto do prompt do agente */}
              <div>
                <label className="block text-sm font-medium text-brand-gray-dark mb-2">Prompt do Agente</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Digite ou selecione um modelo para o prompt do agente"
                  rows={6}
                  value={agentPrompt}
                  onChange={(e) => {
                    setAgentPrompt(e.target.value);
                    updateField('prompt', e.target.value);
                  }}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Seção: Personalidade do Agente - apenas para agentes internos */}
      {agent?.agent_type === 'internal' && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-green-100 rounded-full p-2"><FiUser className="text-green-500 text-xl" /></div>
            <div>
              <CardTitle>Personalidade do Agente</CardTitle>
              <CardDescription>Configure a personalidade do seu agente</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Descrição da Personalidade como textarea */}
            <div>
              <label className="block text-sm font-medium text-brand-gray-dark mb-2">Descrição da Personalidade</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                placeholder="Exemplo de personalidade"
                rows={3}
                value={agent?.personality || ''}
                onChange={(e) => updateField('personality', e.target.value)}
              />
            </div>
            <Select
              label="Tom de voz"
              value={agent?.tone || ''}
              onChange={(e) => updateField('tone', e.target.value)}
            >
              <option value="">Selecione um tom</option>
              <option value="profissional">Profissional</option>
              <option value="amigavel">Amigável</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </Select>
          </CardContent>
        </Card>
      )}
      {/* Seção: Regras e Restrições - apenas para agentes internos */}
      {agent?.agent_type === 'internal' && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-yellow-100 rounded-full p-2"><FiUser className="text-yellow-500 text-xl" /></div>
            <div>
              <CardTitle>Regras e Restrições</CardTitle>
              <CardDescription>Defina as regras gerais e restrições do seu agente</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {/* Regras e Restrições como textarea */}
            <div>
              <label className="block text-sm font-medium text-brand-gray-dark mb-2">Regras e Restrições</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                placeholder="Descreva as regras e restrições"
                rows={3}
                value={agent?.rules || ''}
                onChange={(e) => updateField('rules', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}
      {/* Seção: Agendamento - apenas para agentes internos */}
      {agent?.agent_type === 'internal' && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="bg-pink-100 rounded-full p-2"><FiCalendar className="text-pink-500 text-xl" /></div>
            <div>
              <CardTitle>Agendamento</CardTitle>
              <CardDescription>Vincule uma agenda do Google Agenda ao seu agente</CardDescription>
            </div>
            <div className="ml-auto">
              <Switch
                checked={agent?.scheduling_enabled || false}
                onCheckedChange={(checked) => updateField('scheduling_enabled', checked)}
                id="scheduling-enabled"
              >
                <span className="text-sm font-medium text-pink-700">Ativar</span>
              </Switch>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              label="ID da Agenda"
              placeholder="ID da agenda"
              value={agent?.calendar_id || ''}
              onChange={(e) => updateField('calendar_id', e.target.value)}
            />
            {/* Prompt para consultar agendamento como textarea */}
            <div>
              <label className="block text-sm font-medium text-brand-gray-dark mb-2">Prompt para consultar agendamento</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                placeholder="Prompt para consultar agendamento"
                rows={2}
                value={agent?.scheduling_query_prompt || ''}
                onChange={(e) => updateField('scheduling_query_prompt', e.target.value)}
              />
            </div>
            {/* Prompt para marcar agendamento como textarea */}
            <div>
              <label className="block text-sm font-medium text-brand-gray-dark mb-2">Prompt para marcar agendamento</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-brand-green-light focus:outline-none focus:ring-1 focus:ring-brand-green-light disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                placeholder="Prompt para marcar agendamento"
                rows={2}
                value={agent?.scheduling_create_prompt || ''}
                onChange={(e) => updateField('scheduling_create_prompt', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}
      {/* Botões de ação */}
      <div className="flex justify-between gap-2 mt-6">
        <Button variant="ghost" onClick={onCancel} leftIcon={<FiArrowLeft />} type="button">
          Voltar
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          loading={saving}
          leftIcon={<FiSave />}
          type="submit"
        >
          Salvar
        </Button>
      </div>
      <ConfirmationModal
        isOpen={showUnsavedModal}
        onClose={handleModalCancel}
        onConfirm={handleModalDiscard}
        title="Alterações não salvas"
        confirmText="Descartar"
        cancelText="Cancelar"
      >
        <p>Você tem alterações não salvas. Deseja salvar, descartar ou cancelar?</p>
        <div className="flex gap-2 mt-4">
          <Button variant="primary" onClick={handleModalSave}>Salvar</Button>
          <Button variant="destructive" onClick={handleModalDiscard}>Descartar</Button>
          <Button variant="outline" onClick={handleModalCancel}>Cancelar</Button>
        </div>
      </ConfirmationModal>
    </form>
  );
} 