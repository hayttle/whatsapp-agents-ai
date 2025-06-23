import { useState } from 'react';
import { toast } from 'sonner';

type ActionFunction = () => Promise<void>;
type ActionId = string;

export function useInstanceActions() {
  const [actionLoading, setActionLoading] = useState<ActionId | null>(null);

  const handleAction = async (action: ActionFunction, actionId: ActionId) => {
    setActionLoading(actionId);
    try {
      await action();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  return { actionLoading, handleAction };
} 