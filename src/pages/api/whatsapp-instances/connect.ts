/// <reference types="node" />
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser, createApiClient } from '@/lib/supabase/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Autenticar usuário via cookies
    const auth = await authenticateUser(req, res);
    
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }

    const { userData } = auth;
    const apiSupabase = createApiClient(req, res);

    const apikey = process.env.EVOLUTION_API_KEY;
    if (!apikey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { instanceName, forceRegenerate } = req.body;
    if (!instanceName) {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
    }

    // Verificar se a instância existe e se o usuário tem permissão
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('tenant_id')
      .eq('instanceName', instanceName)
      .single();

    if (!existingInstance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    if (userData.role !== 'super_admin' && existingInstance.tenant_id !== userData.tenant_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // 0. Verificar o status atual da instância
    const { data: currentInstance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('status, qrcode')
      .eq('instanceName', instanceName)
      .single();

    if (fetchError) {
      return res.status(500).json({ error: 'Erro ao buscar dados da instância.' });
    }

    // Se a instância já está open, tentar obter dados do QR code existente primeiro
    if (currentInstance.status === 'open' && currentInstance.qrcode && !forceRegenerate) {
      try {
        const existingQrData = JSON.parse(currentInstance.qrcode);
        
        // Verificar se os dados existentes são válidos
        let qrCodeData = null;
        let pairingCode = null;
        
        if (existingQrData.qrcode) {
          qrCodeData = existingQrData.qrcode;
        } else if (existingQrData.qr) {
          qrCodeData = existingQrData.qr;
        } else if (existingQrData.base64) {
          qrCodeData = existingQrData.base64;
        }
        
        if (existingQrData.pairingCode) {
          pairingCode = existingQrData.pairingCode;
        } else if (existingQrData.code) {
          pairingCode = existingQrData.code;
        }
        
        if (qrCodeData || pairingCode) {
          return res.status(200).json({
            base64: qrCodeData,
            pairingCode: pairingCode,
            fromCache: true,
            ...existingQrData
          });
        }
      } catch {
        // Silenciosamente continua para gerar novo QR code
      }
    }

    // 1. Obter novo QR code da API externa
    const evolutionUrl = `${process.env.EVOLUTION_API_URL}/instance/connect/${encodeURIComponent(instanceName)}`;
    
    const response = await fetch(evolutionUrl, {
      method: 'GET',
      headers: {
        'apikey': apikey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || data.response?.message?.[0] || 'Erro ao gerar QR Code na API externa';
      return res.status(response.status).json({ error: errorMessage });
    }
    
    // Extrair dados do QR code e código de pareamento da resposta
    let qrCodeData = null;
    let pairingCode = null;
    
    // Verificar diferentes possíveis estruturas da resposta
    if (data.qrcode) {
      qrCodeData = data.qrcode;
    } else if (data.qr) {
      qrCodeData = data.qr;
    } else if (data.base64) {
      qrCodeData = data.base64;
    } else if (typeof data === 'string') {
      qrCodeData = data;
    } else if (data.response && data.response.qrcode) {
      qrCodeData = data.response.qrcode;
    } else if (data.response && data.response.qr) {
      qrCodeData = data.response.qr;
    }
    
    if (data.pairingCode) {
      pairingCode = data.pairingCode;
    } else if (data.code) {
      pairingCode = data.code;
    } else if (data.response && data.response.pairingCode) {
      pairingCode = data.response.pairingCode;
    } else if (data.response && data.response.code) {
      pairingCode = data.response.code;
    }
    
    // Se não conseguimos extrair dados válidos, retornar erro
    if (!qrCodeData && !pairingCode) {
      return res.status(500).json({ 
        error: 'Resposta da API externa não contém dados de conexão válidos',
        originalData: data
      });
    }
    
    // 2. Atualizar a instância no banco de dados com o novo QR Code e status
    const qrCodeString = JSON.stringify(data);
    let statusToSet = 'close';
    if (
      data.status === 'open' ||
      (data.response && data.response.status === 'open') ||
      (data.instance && (data.instance.state === 'open' || data.instance.status === 'open'))
    ) {
      statusToSet = 'open';
    }
    
    // Normalizar status - qualquer status diferente de 'open' é tratado como 'close'
    const normalizedStatus = statusToSet === 'open' ? 'open' : 'close';
    
    const { error: dbError } = await supabase
      .from('whatsapp_instances')
      .update({ 
          qrcode: qrCodeString,
          status: normalizedStatus,
          updated_at: new Date().toISOString() 
        })
      .eq('instanceName', instanceName);

    if (dbError) {
        return res.status(500).json({ error: 'Erro ao salvar o novo QR Code no banco de dados.' });
    }

    // 3. Retornar os dados do QR code para o frontend para exibição imediata
    const responseData = {
      base64: qrCodeData,
      pairingCode: pairingCode,
      ...data
    };
    
    return res.status(200).json(responseData);

  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erro inesperado' });
  }
} 