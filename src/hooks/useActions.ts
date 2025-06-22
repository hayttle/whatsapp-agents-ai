import { useState } from 'react';
import { toast } from 'sonner';

export const useActions = () => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<any>, actionId: string, successMessage?: string) => {
    setActionLoading(actionId);
    try {
      await action();
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  return {
    actionLoading,
    handleAction,
  };
}; 