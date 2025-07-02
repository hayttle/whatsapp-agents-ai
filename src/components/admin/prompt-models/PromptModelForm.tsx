'use client';

import React, { useState } from 'react';
import { PromptModel } from '@/services/promptModelService';
import { Input } from '@/components/brand/Input';
import { Button } from '@/components/brand/Button';
import { ArrowLeft } from 'lucide-react';

interface PromptModelFormProps {
  initial?: Partial<PromptModel>;
  onSubmit: (data: { name: string; description: string; content: string }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const PromptModelForm: React.FC<PromptModelFormProps> = ({ initial = {}, onSubmit, onCancel, loading }) => {
  const [name, setName] = useState(initial.name || '');
  const [description, setDescription] = useState(initial.description || '');
  const [content, setContent] = useState(initial.content || '');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={onCancel}
        >
          Voltar
        </Button>
        <h2 className="text-xl font-semibold">
          {initial.id ? 'Editar Modelo de Prompt' : 'Novo Modelo de Prompt'}
        </h2>
      </div>
      
      <form
        onSubmit={e => {
          e.preventDefault();
          onSubmit({ name, description, content });
        }}
        className="space-y-4"
      >
      <Input
        label="Nome"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <Input
        label="Descrição"
        value={description}
        onChange={e => setDescription(e.target.value)}
        required
      />
      <div>
        <label className="block text-sm font-medium mb-1">Conteúdo do Prompt</label>
        <textarea
          className="w-full border rounded p-2 min-h-[120px]"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
      </div>
      <Button type="submit" loading={loading} variant="primary">
        Salvar
      </Button>
    </form>
    </div>
  );
}; 