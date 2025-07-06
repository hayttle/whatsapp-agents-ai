import { createClient } from '@/lib/supabase/client';

export async function getPromptModels() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('prompt_models')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getPromptModelById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('prompt_models')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createPromptModel(model: { name: string; description: string; content: string }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('prompt_models')
    .insert([model])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePromptModel(id: string, model: { name: string; description: string; content: string }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('prompt_models')
    .update(model)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePromptModel(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('prompt_models')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

export type PromptModel = {
  id: string;
  name: string;
  description: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}; 