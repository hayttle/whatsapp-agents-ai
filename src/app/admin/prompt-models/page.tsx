'use client';

import React from 'react';
import { PromptModelManager } from '@/components/admin/prompt-models';
import { useUserRole } from '@/hooks/useUserRole';

const PromptModelsPage = () => {
  const { isSuperAdmin, isLoading, error } = useUserRole();

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-light mx-auto"></div>
        <p className="mt-2 text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Erro ao carregar dados do usuário: {error}
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center text-red-600">
        Acesso restrito ao super admin.
      </div>
    );
  }

  return (
    <PromptModelManager isSuperAdmin={isSuperAdmin} />
  );
};

export default PromptModelsPage; 