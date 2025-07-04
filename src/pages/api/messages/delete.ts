import { withAuth } from '@/lib/auth/helpers';
import { deleteMessagesByContact } from '@/services/messageService';
import { createClient } from '@supabase/supabase-js';

export default withAuth(async (req, res, auth) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { agent_id, whatsapp_number } = req.body;
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
    await deleteMessagesByContact(agent_id, whatsapp_number, supabase);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro ao apagar mensagens';
    return res.status(500).json({ error: errorMessage });
  }
}); 