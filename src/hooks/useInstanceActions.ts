import { useState } from 'react';
import { toast } from 'sonner';

export const useInstanceActions = () => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<any>, instanceName: string) => {
    setActionLoading(instanceName);
    try {
      await action();
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