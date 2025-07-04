

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getContactsWithLastMessage(agentId: string, tenantId: string, supabase: any) {
  // Primeiro, buscar o agente para obter o instance_id
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('instance_id')
    .eq('id', agentId)
    .single();
  
  if (agentError) throw agentError;
  
  // Busca a última mensagem de cada contato (whatsapp_number) para o agente
  // Como Supabase não suporta group by + max diretamente, fazemos em duas etapas:
  // 1. Buscar todos os números distintos
  const { data: numbers, error: errorNumbers } = await supabase
    .from('messages')
    .select('whatsapp_number')
    .eq('agent_id', agentId)
    .neq('whatsapp_number', '')
    .order('created_at', { ascending: false });
  if (errorNumbers) throw errorNumbers;
  const uniqueNumbers = Array.from(new Set((numbers || []).map((m: { whatsapp_number: string }) => m.whatsapp_number)));
  // 2. Para cada número, buscar a última mensagem
  const contacts = [];
  for (const number of uniqueNumbers) {
    const { data: lastMsg, error: errorMsg } = await supabase
      .from('messages')
      .select('*')
      .eq('agent_id', agentId)
      .eq('whatsapp_number', number)
      .order('created_at', { ascending: false })
      .limit(1);
    if (errorMsg) continue;
    if (lastMsg && lastMsg[0]) {
      contacts.push({
        whatsapp_number: number,
        last_message: lastMsg[0].text,
        last_message_at: lastMsg[0].created_at,
        sender: lastMsg[0].sender,
        instance_id: agent.instance_id,
      });
    }
  }
  return contacts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMessagesByContact(agentId: string, whatsappNumber: string, tenantId: string, supabase: any) {
  // Busca todas as mensagens entre o agente e o contato
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('agent_id', agentId)
    .eq('whatsapp_number', whatsappNumber)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
} 