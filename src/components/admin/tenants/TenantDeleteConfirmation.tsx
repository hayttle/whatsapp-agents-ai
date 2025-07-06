"use client";
import React, { useState, useEffect } from 'react';
import Modal, { ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/brand';
import { Alert } from '@/components/brand/Alert';
import { Trash2, Users, Bot, MessageSquare, CreditCard, FileText, Building2 } from 'lucide-react';
import { tenantService } from '@/services/tenantService';

interface TenantDeleteConfirmationProps {
  tenant: {
    id: string;
    name: string;
    email: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSuccess: () => void;
}

interface TenantStats {
  users: number;
  instances: number;
  agents: number;
  subscriptions: number;
  promptModels: number;
}

export function TenantDeleteConfirmation({
  tenant,
  isOpen,
  onClose,
  onConfirm,
  onSuccess
}: TenantDeleteConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tenant) {
      fetchTenantStats();
    }
  }, [isOpen, tenant]);

  const fetchTenantStats = async () => {
    if (!tenant) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas do tenant
      const response = await fetch(`/api/tenants/${tenant.id}/stats`);

      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas do tenant');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      // Definir valores padrão se não conseguir buscar
      setStats({
        users: 0,
        instances: 0,
        agents: 0,
        subscriptions: 0,
        promptModels: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!tenant) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tenants/delete?id=${tenant.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar empresa');
      }

      const result = await response.json();

      onSuccess();
      onClose();

      // Mostrar mensagem de sucesso com estatísticas


    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return null;

  const totalItems = stats ?
    stats.users + stats.instances + stats.agents + stats.subscriptions + stats.promptModels : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-2xl"
    >
      <div className="space-y-6">
        <ModalHeader>Confirmar Exclusão de Empresa</ModalHeader>
        {/* Aviso de perigo */}
        <Alert variant="error" title="Ação Irreversível">
          <p>
            Esta ação irá <strong>deletar permanentemente</strong> a empresa "{tenant.name}"
            e todos os dados relacionados. Esta operação não pode ser desfeita.
          </p>
        </Alert>

        {/* Informações da empresa */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Empresa a ser deletada:</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Nome:</strong> {tenant.name}</p>
            <p><strong>Email:</strong> {tenant.email}</p>
            <p><strong>ID:</strong> {tenant.id}</p>
          </div>
        </div>

        {/* Estatísticas */}
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Carregando estatísticas...</p>
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              Dados que serão deletados ({totalItems} itens):
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <Users className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">{stats.users}</p>
                  <p className="text-sm text-red-700">Usuários</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">{stats.instances}</p>
                  <p className="text-sm text-orange-700">Instâncias WhatsApp</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Bot className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">{stats.agents}</p>
                  <p className="text-sm text-yellow-700">Agentes</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{stats.subscriptions}</p>
                  <p className="text-sm text-blue-700">Assinaturas</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">{stats.promptModels}</p>
                  <p className="text-sm text-purple-700">Modelos de Prompt</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Erro */}
        {error && (
          <Alert variant="error" title="Erro">
            {error}
          </Alert>
        )}

        {/* Ações */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>
              {loading ? 'Deletando...' : 'Deletar Empresa'}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
} 