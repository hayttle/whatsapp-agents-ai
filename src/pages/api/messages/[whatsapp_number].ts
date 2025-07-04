import { withAuth } from '@/lib/auth/helpers';
import { getMessagesByContact } from '@/services/messageService';
import { createClient } from '@supabase/supabase-js';

export default withAuth(async (req, res, auth) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { agent_id } = req.query;
  const { whatsapp_number } = req.query;
  if (!agent_id || typeof agent_id !== 'string') {
    return res.status(400).json({ error: 'agent_id é obrigatório' });
  }
  if (!whatsapp_number || typeof whatsapp_number !== 'string') {
    return res.status(400).json({ error: 'whatsapp_number é obrigatório' });
  }
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const messages = await getMessagesByContact(agent_id, whatsapp_number, auth.user.tenant_id!, supabase);
    return res.status(200).json({ messages });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar mensagens';
    return res.status(500).json({ error: errorMessage });
  }
}); 