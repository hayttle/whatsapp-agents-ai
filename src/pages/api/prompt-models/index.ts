import type { NextApiRequest, NextApiResponse } from 'next';
import { getPromptModels, createPromptModel } from '../../../services/promptModelService';
import { getUserRole } from '../../../lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const models = await getPromptModels();
      return res.status(200).json(models);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  }
  if (req.method === 'POST') {
    const role = await getUserRole(req);
    if (role !== 'super_admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const { name, description, content } = req.body;
    if (!name || !description || !content) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }
    try {
      const model = await createPromptModel({ name, description, content });
      return res.status(201).json(model);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  }
  return res.status(405).json({ error: 'Método não permitido' });
} 