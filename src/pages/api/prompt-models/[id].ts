import type { NextApiRequest, NextApiResponse } from 'next';
import { getPromptModelById, updatePromptModel, deletePromptModel } from '../../../services/promptModelService';
import { getUserRole } from '../../../lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'ID inválido' });

  if (req.method === 'GET') {
    try {
      const model = await getPromptModelById(id);
      return res.status(200).json(model);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(404).json({ error: message });
    }
  }
  if (req.method === 'PUT') {
    const role = await getUserRole(req);
    if (role !== 'super_admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const { name, description, content } = req.body;
    if (!name || !description || !content) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }
    try {
      const model = await updatePromptModel(id, { name, description, content });
      return res.status(200).json(model);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  }
  if (req.method === 'DELETE') {
    const role = await getUserRole(req);
    if (role !== 'super_admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    try {
      await deletePromptModel(id);
      return res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  }
  return res.status(405).json({ error: 'Método não permitido' });
} 