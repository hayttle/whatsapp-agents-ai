'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NovoAgentePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página de configuração com ID temporário
    router.replace('/admin/agentes/novo/configuracao');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-light"></div>
    </div>
  );
} 