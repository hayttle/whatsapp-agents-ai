import { NextApiRequest, NextApiResponse } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Buscar dados do usuário atual
    const { data: userData } = await supabase
      .from('users')
      .select('id, role, tenant_id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return res.status(403).json({ error: 'User not found' });
    }

    const { nome, email } = req.body;

    // Preparar dados para atualização (apenas nome e email)
    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (email !== undefined) updateData.email = email;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userData.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error in user profile API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 