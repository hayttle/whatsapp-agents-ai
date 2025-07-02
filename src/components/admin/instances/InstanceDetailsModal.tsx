"use client";
import { Instance } from "./types";
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { Button } from '@/components/brand';
import { MessageSquare, ExternalLink, User, Phone, FileText, Link, RefreshCw, Trash2, Power, PowerOff, Clipboard } from "lucide-react";
import { toast } from "sonner";
import { useInstanceActions } from "@/hooks/useInstanceActions";
import { useAgents } from '@/hooks/useAgents';
import { agentService } from "@/services/agentService";
import { instanceService } from "@/services/instanceService";
import { useState, useEffect } from "react";

interface InstanceDetailsModalProps {
  instance: Instance | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  empresaName?: string;
}

export function InstanceDetailsModal({ 
  instance, 
  isOpen, 
  onClose, 
  onRefresh,
  empresaName 
}: InstanceDetailsModalProps) {
  const { actionLoading, handleAction } = useInstanceActions();
  const { data: agentes } = useAgents({ isSuperAdmin: true, tenantId: instance?.tenant_id });
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [savingAgent, setSavingAgent] = useState(false);

  // Estado local para a instância exibida no modal
  const [localInstance, setLocalInstance] = useState<Instance | null>(instance);

  // Sincronizar localInstance sempre que instance mudar
  useEffect(() => {
    setLocalInstance(instance);
  }, [instance]);

  if (!localInstance) return null;

  const isConnected = localInstance.status === 'open';
  const isNative = localInstance.provider_type === 'nativo';
  const agenteVinculado = agentes.find(a => a.id === localInstance.agent_id);

  const handleConnect = (instanceName: string) => handleAction(async () => {
    const data = await instanceService.connectInstance(instanceName);
    if (data && (data.base64 || data.pairingCode)) {
      toast.success('QR Code gerado com sucesso!');
      onRefresh();
    } else {
      toast.error('Não foi possível obter os dados de conexão.');
    }
  }, instanceName);

  const handleDisconnect = (instanceName: string) => handleAction(async () => {
    await instanceService.disconnectInstance(instanceName);
    toast.success('Instância desconectada com sucesso.');
    onRefresh();
  }, instanceName);

  const handleDelete = (instanceName: string) => handleAction(async () => {
    await instanceService.deleteInstance(instanceName);
    toast.success("Instância deletada com sucesso!");
    onRefresh();
    onClose();
  }, instanceName);

  const handleUpdateStatus = async (instanceName: string) => {
    try {
      const response = await fetch(`/api/whatsapp-instances/status?instanceName=${encodeURIComponent(instanceName)}`);
      const data = await response.json();
      if (response.ok) {
        toast.success('Status atualizado com sucesso!');
        onRefresh();
      } else {
        toast.error(data.error || 'Erro ao atualizar status');
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao atualizar status');
    }
  };

  const handleSaveAgent = async () => {
    if (!selectedAgentId) return;
    setSavingAgent(true);
    try {
      // Desvincular agente anterior, se houver
      if (localInstance.agent_id) {
        if (agenteVinculado?.agent_type === 'external') {
          await agentService.updateAgent(localInstance.agent_id, {
            title: agenteVinculado.title,
            webhookUrl: agenteVinculado.webhookUrl,
            tenant_id: agenteVinculado.tenant_id,
            active: agenteVinculado.active,
            instance_id: null,
            description: agenteVinculado.description,
            agent_type: agenteVinculado.agent_type
          });
        } else {
          await agentService.updateAgent(localInstance.agent_id, { instance_id: null, agent_type: agenteVinculado?.agent_type });
        }
      }
      // Atualizar agent_id da instância
      await instanceService.updateInstance(localInstance.id, { agent_id: selectedAgentId, provider_type: localInstance.provider_type });
      // Vincular novo agente
      const novoAgente = agentes.find(a => a.id === selectedAgentId);
      if (novoAgente?.agent_type === 'external') {
        await agentService.updateAgent(selectedAgentId, {
          title: novoAgente.title,
          webhookUrl: novoAgente.webhookUrl,
          tenant_id: novoAgente.tenant_id,
          active: novoAgente.active,
          instance_id: localInstance.id,
          description: novoAgente.description,
          agent_type: novoAgente.agent_type
        });
      } else {
        await agentService.updateAgent(selectedAgentId, { instance_id: localInstance.id, agent_type: novoAgente?.agent_type });
      }
      toast.success('Agente vinculado com sucesso!');
      setLocalInstance({ ...localInstance, agent_id: selectedAgentId });
      onRefresh();
      setSelectedAgentId("");
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        toast.error('Erro ao vincular agente: ' + (err as { message: string }).message);
      } else {
        toast.error('Erro ao vincular agente.');
      }
    } finally {
      setSavingAgent(false);
    }
  };

  const handleUnlinkAgent = async () => {
    if (!agenteVinculado) return;
    setSavingAgent(true);
    try {
      await instanceService.updateInstance(localInstance.id, { agent_id: null, provider_type: localInstance.provider_type });
      if (agenteVinculado.agent_type === 'external') {
        await agentService.updateAgent(agenteVinculado.id, {
          title: agenteVinculado.title,
          webhookUrl: agenteVinculado.webhookUrl,
          tenant_id: agenteVinculado.tenant_id,
          active: agenteVinculado.active,
          instance_id: null,
          description: agenteVinculado.description,
          agent_type: agenteVinculado.agent_type
        });
      } else {
        await agentService.updateAgent(agenteVinculado.id, { instance_id: null, agent_type: agenteVinculado.agent_type });
      }
      toast.success('Agente desvinculado com sucesso!');
      setLocalInstance({ ...localInstance, agent_id: null });
      onRefresh();
    } catch {
      toast.error('Erro ao desvincular agente.');
    } finally {
      setSavingAgent(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isConnected ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <MessageSquare className={`w-5 h-5 ${
              isConnected ? 'text-green-600' : 'text-gray-500'
            }`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{localInstance.instanceName}</h2>
            <p className="text-sm text-gray-500">Detalhes da Instância</p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Nome da Instância</p>
                  <p className="text-sm text-gray-600">{localInstance.instanceName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500">
                  {isNative ? <MessageSquare className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tipo</p>
                  <p className="text-sm text-gray-600">
                    {isNative ? 'Nativa' : 'Externa'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500">
                  <Phone className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Número WhatsApp</p>
                  <p className="text-sm text-gray-600">
                    {localInstance.phone_number || 'Não conectado'}
                  </p>
                </div>
              </div>

              {empresaName && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">
                    <User className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Empresa</p>
                    <p className="text-sm text-gray-600">{empresaName}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-500">
                  <User className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Agente Vinculado</p>
                  <p className="text-sm text-gray-600">
                    {agenteVinculado ? agenteVinculado.title : 'Nenhum agente vinculado'}
                  </p>
                </div>
              </div>

              {localInstance.description && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Descrição</p>
                    <p className="text-sm text-gray-600">{localInstance.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* URL pública para conexão */}
          {!isConnected && localInstance.public_hash && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">
                  <Link className="w-4 h-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-2">URL pública para conectar instância</p>
                  <p className="text-sm text-blue-700 mb-3">Envie essa url para o seu cliente escanear o QRCode</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/qrcode/${localInstance.public_hash}`}
                      className="text-sm bg-white border border-blue-300 rounded px-3 py-2 flex-1"
                      onFocus={e => e.target.select()}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/qrcode/${localInstance.public_hash}`);
                        toast.success('Link copiado!');
                      }}
                      leftIcon={<Clipboard className="w-4 h-4" />}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gerenciamento de agente */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Gerenciar Agente</h3>
            <div className="space-y-3">
              {agenteVinculado ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{agenteVinculado.title}</p>
                    <p className="text-sm text-gray-600">
                      {agenteVinculado.agent_type === 'external' ? 'Externo' : 'Interno'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnlinkAgent}
                    disabled={savingAgent}
                  >
                    Desvincular
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Regra de vínculo:</strong><br />
                      • Instâncias <strong>Nativas</strong> só aceitam agentes <strong>Internos</strong><br />
                      • Instâncias <strong>Externas</strong> só aceitam agentes <strong>Externos</strong>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green-light focus:border-transparent"
                    >
                      <option value="">Selecione um agente...</option>
                      {agentes
                        .filter(agent => {
                          if (isNative) {
                            return agent.agent_type === 'internal' || !agent.agent_type;
                          }
                          if (!isNative) {
                            return agent.agent_type === 'external';
                          }
                          return true;
                        })
                        .map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.title} ({agent.agent_type === 'external' ? 'Externo' : 'Interno'})
                          </option>
                        ))}
                    </select>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveAgent}
                      disabled={!selectedAgentId || savingAgent}
                      loading={savingAgent}
                    >
                      Vincular
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Fechar
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => handleUpdateStatus(localInstance.instanceName)}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Atualizar Status
          </Button>

          {isConnected ? (
            <Button
              variant="warning"
              onClick={() => handleDisconnect(localInstance.instanceName)}
              loading={actionLoading === localInstance.instanceName}
              leftIcon={<PowerOff className="w-4 h-4" />}
            >
              Desconectar
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => handleConnect(localInstance.instanceName)}
              loading={actionLoading === localInstance.instanceName}
              leftIcon={<Power className="w-4 h-4" />}
            >
              Conectar
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={() => handleDelete(localInstance.instanceName)}
            loading={actionLoading === localInstance.instanceName}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Remover
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
} 