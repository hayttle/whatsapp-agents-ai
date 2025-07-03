'use client';

import React, { useEffect, useState, useReducer } from 'react';
import { PromptModel, getPromptModels, deletePromptModel } from '@/services/promptModelService';
import { Button } from '@/components/brand/Button';
import { ActionButton } from '@/components/ui/ActionButton';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Edit, Trash2, FileText, Plus } from 'lucide-react';
import { useActions } from '@/hooks/useActions';
import { toast } from 'sonner';
import { AdminListLayout } from '@/components/layout/AdminListLayout';

interface PromptModelListProps {
  onEdit: (model: PromptModel) => void;
  isSuperAdmin: boolean;
}

type ModalState =
  | { type: 'NONE' }
  | { type: 'DELETE', payload: PromptModel };

type ModalAction =
  | { type: 'OPEN_DELETE', payload: PromptModel }
  | { type: 'CLOSE' };

const modalReducer = (state: ModalState, action: ModalAction): ModalState => {
  switch (action.type) {
    case 'OPEN_DELETE':
      return { type: 'DELETE', payload: action.payload };
    case 'CLOSE':
      return { type: 'NONE' };
    default:
      return state;
  }
};

export const PromptModelList: React.FC<PromptModelListProps> = ({ onEdit, isSuperAdmin }) => {
  const [models, setModels] = useState<PromptModel[]>([]);
  const [modalState, dispatchModal] = useReducer(modalReducer, { type: 'NONE' });
  const { actionLoading, handleAction } = useActions();

  const fetchModels = () => {
    getPromptModels()
      .then(setModels);
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleDelete = (modelId: string) => handleAction(async () => {
    await deletePromptModel(modelId);
    fetchModels();
    closeModal();
    toast.success('Modelo de prompt removido com sucesso!');
  });

  const closeModal = () => {
    dispatchModal({ type: 'CLOSE' });
  };

  return (
    <AdminListLayout
      icon={<FileText className="w-6 h-6 text-white" />}
      pageTitle="Modelos de Prompt"
      pageDescription="Gerencie os modelos de prompt disponíveis para os agentes."
      cardTitle="Lista de Modelos de Prompt"
      cardDescription="Visualize, edite e remova modelos de prompt."
      actionButton={isSuperAdmin && (
        <Button
          variant="add"
          onClick={() => onEdit && onEdit({} as PromptModel)}>
          <Plus className="w-4 h-4" />
          Novo Modelo
        </Button>
      )}
      filtersOpen={false}
      onToggleFilters={() => { }}
    >
      <AdminListLayout.List>
        {models.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Nenhum modelo de prompt encontrado</p>
            <p className="text-sm">Use o botão &quot;Novo Modelo&quot; para criar o primeiro.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {models.map(model => {
              const isLoading = actionLoading === model.id;
              return (
                <li key={model.id} className="flex items-center justify-between bg-white rounded shadow p-3 hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-brand-green-light" />
                      <div className="font-semibold">{model.name}</div>
                    </div>
                    <div className="text-sm text-gray-500 ml-6">{model.description}</div>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex gap-2">
                      <ActionButton
                        icon={Edit}
                        onClick={() => onEdit(model)}
                        variant="ghost"
                        disabled={isLoading}
                        title="Editar modelo"
                      />
                      <ActionButton
                        icon={Trash2}
                        onClick={() => dispatchModal({ type: 'OPEN_DELETE', payload: model })}
                        variant="iconDestructive"
                        disabled={isLoading}
                        loading={isLoading}
                        title="Remover modelo"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {/* Modal de confirmação de remoção */}
        <ConfirmationModal
          isOpen={modalState.type === 'DELETE'}
          onClose={closeModal}
          onConfirm={() => handleDelete(modalState.type === 'DELETE' ? modalState.payload.id : '')}
          title="Confirmar Remoção"
          confirmText="Remover"
          cancelText="Cancelar"
          isLoading={actionLoading === (modalState.type === 'DELETE' ? modalState.payload.id : '')}
        >
          <p>
            Tem certeza que deseja remover o modelo de prompt <span className="font-semibold">&quot;{modalState.type === 'DELETE' ? modalState.payload.name : ''}&quot;</span>?
            Esta ação não pode ser desfeita.
          </p>
        </ConfirmationModal>
      </AdminListLayout.List>
    </AdminListLayout>
  );
}; 