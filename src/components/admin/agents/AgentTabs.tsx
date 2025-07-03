import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AgentTabsProps {
  agentId: string;
}

export function AgentTabs({ agentId }: AgentTabsProps) {
  const pathname = usePathname();
  const tabs = [
    { label: 'Configurações', href: `/admin/agentes/${agentId}/configuracao` },
    { label: 'Conversas', href: `/admin/agentes/${agentId}/conversas` },
  ];
  return (
    <div className="flex gap-4 border-b mb-6">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`py-2 px-4 -mb-px border-b-2 transition-colors ${pathname && pathname.endsWith(tab.href) ? 'border-brand-green-light text-brand-green-dark font-semibold' : 'border-transparent text-gray-500 hover:text-brand-green-dark'}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
} 