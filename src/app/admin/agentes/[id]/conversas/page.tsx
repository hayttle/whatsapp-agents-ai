"use client";
import { useParams } from 'next/navigation';
import { AgentMessagesLog } from '@/components/admin/agents/AgentMessagesLog';
import { AgentDetailsLayout } from '@/components/admin/agents/AgentDetailsLayout';

export default function AgentConversationsPage() {
  const params = useParams();
  const agentId = params?.id as string;

  return (
    <AgentDetailsLayout agentId={agentId}>
      <AgentMessagesLog agentId={agentId} />
    </AgentDetailsLayout>
  );
} 