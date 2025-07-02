'use client';

import React, { useState } from 'react';
import { PromptModel, createPromptModel, updatePromptModel } from '@/services/promptModelService';
import { PromptModelList } from './PromptModelList';
import { PromptModelForm } from './PromptModelForm';
import { toast } from 'sonner';

interface PromptModelManagerProps {
  isSuperAdmin: boolean;
}

export const PromptModelManager: React.FC<PromptModelManagerProps> = ({ isSuperAdmin }) => {
  const [editing, setEditing] = useState<PromptModel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = (model: PromptModel) => {
    setEditing(model);
    setShowForm(true);
  };

  const handleSubmit = async (data: { name: string; description: string; content: string }) => {
    setLoading(true);
    try {
      if (editing) {
        await updatePromptModel(editing.id, data);
        toast.success('Modelo de prompt atualizado com sucesso!');
      } else {
        await createPromptModel(data);
        toast.success('Modelo de prompt criado com sucesso!');
      }
      setShowForm(false);
    } catch {
      toast.error('Erro ao salvar modelo de prompt. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div>
      {showForm ? (
        <PromptModelForm
          initial={editing || {}}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      ) : (
        <PromptModelList onEdit={handleEdit} isSuperAdmin={isSuperAdmin} />
      )}
    </div>
  );
}; 