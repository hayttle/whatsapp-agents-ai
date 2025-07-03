import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/lib/auth/helpers';
import { getContactsWithLastMessage } from '@/services/messageService';

export default withAuth(async (req, res, auth) => {
  console.log('[API] /api/messages chamado', req.query, auth?.user?.id, auth?.user?.tenant_id);
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { agent_id } = req.query;
  if (!agent_id || typeof agent_id !== 'string') {
    return res.status(400).json({ error: 'agent_id é obrigatório' });
  }
  console.log('[API] Chamando getContactsWithLastMessage', agent_id, auth.user.tenant_id);
  // Garantir que o agent_id pertence ao tenant do usuário logado (auth.user.tenant_id)
  // (Ideal: checar na tabela agents, mas aqui assumimos que o service já faz isso)
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const contacts = await getContactsWithLastMessage(agent_id, auth.user.tenant_id!, supabase);
    return res.status(200).json({ contacts });
  } catch (error: any) {
    console.error('[API] Erro em getContactsWithLastMessage:', error);
    return res.status(500).json({ error: error.message || 'Erro ao buscar contatos' });
  }
});

export async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agent_id, whatsapp_number, from, to, limit = 20, offset = 0, text } = req.query;

  if (!agent_id || typeof agent_id !== 'string') {
    return res.status(400).json({ error: 'agent_id é obrigatório' });
  }

  // ... existing code ...
} 