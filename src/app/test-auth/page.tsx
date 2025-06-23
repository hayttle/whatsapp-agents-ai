"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestAuthPage() {
  const [authStatus, setAuthStatus] = useState<string>('Carregando...');
  const [userData, setUserData] = useState<unknown>(null);
  const [apiData, setApiData] = useState<unknown>(null);

  useEffect(() => {
    const testAuth = async () => {
      try {
        console.log('🧪 Teste de autenticação iniciado');
        
        // Teste 1: Verificar autenticação no frontend
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        console.log('🔐 Teste 1 - Auth no frontend:', { user, authError });
        setAuthStatus(`Auth: ${user ? 'OK' : 'Falhou'} - ${authError || 'Sem erro'}`);
        
        if (user) {
          setUserData(user);
          
          // Teste 2: Chamar a API
          console.log('📡 Teste 2 - Chamando API...');
          const response = await fetch('/api/users/current');
          const apiResponse = await response.json();
          
          console.log('📦 Teste 2 - Resposta da API:', { status: response.status, data: apiResponse });
          setApiData(apiResponse);
        }
      } catch (error) {
        console.error('❌ Erro no teste:', error);
        setAuthStatus(`Erro: ${error}`);
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
      </div>
    </div>
  );
} 