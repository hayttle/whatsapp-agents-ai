'use client';

import React, { useEffect, useState } from 'react';
import { Select } from '@/components/brand/Select';
import { getPromptModels, PromptModel } from '@/services/promptModelService';

interface PromptModelDropdownProps {
  onSelect: (model: PromptModel) => void;
  value?: string;
  disabled?: boolean;
}

export const PromptModelDropdown: React.FC<PromptModelDropdownProps> = ({ onSelect, value, disabled }) => {
  const [models, setModels] = useState<PromptModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPromptModels()
      .then(setModels)
      .catch(error => {
        console.error('Erro ao carregar modelos de prompt:', error);
        setModels([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Select
      label="Modelo de Prompt"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const model = models.find(m => m.id === id);
        if (model) onSelect(model);
      }}
      disabled={disabled || loading}
    >
      <option value="">Selecione um modelo</option>
      {models.map(model => (
        <option key={model.id} value={model.id}>
          {model.name} - {model.description}
        </option>
      ))}
    </Select>
  );
}; 