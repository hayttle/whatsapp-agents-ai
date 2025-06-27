"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestAuthPage() {
  const [authStatus] = useState<string | null>(null);
  const [userData, setUserData] = useState<unknown>(null);
  const [apiData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const testAuth = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setError(`Erro de autenticação: ${authError.message}`);
        return;
      }

      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      try {
        const response = await fetch('/api/users/current');
        const apiResponse = await response.json();

        if (!response.ok) {
          setError(`Erro na API: ${apiResponse.error || 'Erro desconhecido'}`);
          return;
        }

        setUserData(apiResponse);
        setSuccess('Teste de autenticação bem-sucedido!');
      } catch (err) {
        setError(`Erro na requisição: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    };

    testAuth();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Autenticação</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Status da Autenticação:</h2>
          <p className="text-sm">{authStatus}</p>
        </div>

        <div className="mt-4">
          <h2 className="font-bold">Dados do usuário:</h2>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{userData ? JSON.stringify(userData, null, 2) : 'Nenhum dado'}</pre>
        </div>

        <div className="mt-4">
          <h2 className="font-bold">Dados da API:</h2>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{apiData ? JSON.stringify(apiData, null, 2) : 'Nenhum dado'}</pre>
        </div>

        {error && (
          <div className="mt-4 bg-red-100 p-4 rounded">
            <h2 className="font-bold">Erro:</h2>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-100 p-4 rounded">
            <h2 className="font-bold">Sucesso:</h2>
            <p className="text-sm">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
} 