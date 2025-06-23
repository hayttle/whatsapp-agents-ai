import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useActions() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = useCallback(async (
    action: () => Promise<void>,
    actionId?: string
  ) => {
    setActionLoading(actionId || 'default');
    try {
      await action();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(errorMessage);
      throw error;
    } finally {
      setActionLoading(null);
    }
  }, []);

  return { actionLoading, handleAction };
} 