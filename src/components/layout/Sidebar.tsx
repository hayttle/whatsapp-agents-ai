"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Home, 
  Settings, 
  Users, 
  Building2, 
  Bot, 
  MessageSquare, 
  ChevronDown,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Button, Badge } from '@/components/brand';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  children?: SidebarItem[];
}

const navItems: SidebarItem[] = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: Home, 
    adminOnly: true,
    superAdminOnly: true
  },
  { 
    href: '/admin/instancias', 
    label: 'Instâncias', 
    icon: MessageSquare, 
    adminOnly: true,
    superAdminOnly: true
  },
  { 
    href: '/admin/agentes', 
    label: 'Agentes', 
    icon: Bot, 
    superAdminOnly: true
  },
  { 
    href: '/admin/usuarios', 
    label: 'Usuários', 
    icon: Users, 
    superAdminOnly: true
  },
  { 
    href: '/admin/empresas', 
    label: 'Empresas', 
    icon: Building2, 
    superAdminOnly: true
  },
  { 
    href: '/admin', 
    label: 'Administração', 
    icon: Settings, 
    adminOnly: true,
    superAdminOnly: true,
    children: [
      { href: '/admin/configuracoes', label: 'Configurações', icon: Settings, superAdminOnly: true },
      { href: '/admin/logs', label: 'Logs do Sistema', icon: Settings, superAdminOnly: true },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('user');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Expande o item de menu pai se a rota atual for uma de suas filhas
    const activeParent = navItems.find(item => 
      item.children?.some(child => pathname === child.href)
    );
    if (activeParent) {
      setExpandedItems(prev => new Set(prev).add(activeParent.href));
    }

    const fetchUserData = async () => {
      try {
        // Usar a API em vez de consulta direta ao Supabase
        const response = await fetch('/api/users/current');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.user) {
            console.log('✅ Sidebar: Usuário carregado:', data.user);
            setUserRole(data.user.role || 'user');
            setUserName(data.user.name || '');
            setUserEmail(data.user.email || '');
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [pathname]);

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
  };

  const filteredNavItems = navItems.filter(item => item.adminOnly === true || item.superAdminOnly === true);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (isLoading) {
    return (
      <aside className="w-64 flex-shrink-0 bg-brand-gray-deep text-white flex flex-col h-screen">
        <div className="h-16 flex items-center justify-center text-xl font-bold border-b border-brand-gray-dark gap-2">
          <MessageSquare className="text-brand-green-light w-6 h-6"/>
          <span>AI Agents</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-brand-gray-deep text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center text-xl font-bold border-b border-brand-gray-dark gap-2">
        <MessageSquare className="text-brand-green-light w-6 h-6"/>
        <span>AI Agents</span>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = hasChildren && item.children!.some(child => pathname === child.href);
            const isItemActive = (pathname === item.href) || isChildActive;
            
            const isExpanded = expandedItems.has(item.href);
            const filteredChildren = hasChildren 
              ? item.children!.filter(child => child.adminOnly === true || child.superAdminOnly === true)
              : [];

            return (
              <li key={item.href}>
                <div className="relative">
                  <Link
                    href={hasChildren ? '#' : item.href}
                    onClick={hasChildren ? (e) => { e.preventDefault(); toggleExpanded(item.href); } : undefined}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                      isItemActive
                        ? 'bg-brand-green-light text-white font-semibold'
                        : 'text-gray-300 hover:bg-brand-gray-dark hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </div>
                    {hasChildren && (
                      <div className="flex items-center gap-2">
                        {filteredChildren.length > 0 && (
                          <Badge variant="default" className="text-xs">
                            {filteredChildren.length}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </Link>
                  
                  {/* Submenu */}
                  {hasChildren && isExpanded && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {filteredChildren.map((child: SidebarItem) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`flex items-center p-2 rounded-lg transition-colors duration-200 text-sm ${
                                isChildActive
                                  ? 'bg-brand-green-light/20 text-brand-green-light font-medium'
                                  : 'text-gray-400 hover:bg-brand-gray-dark hover:text-white'
                              }`}
                            >
                              <child.icon className="w-4 h-4 mr-2" />
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-brand-gray-dark">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-brand-green-light flex items-center justify-center text-white font-bold">
            {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {userName || 'Usuário'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {userEmail}
            </p>
            <Badge 
              variant="success" 
              className="text-xs mt-1"
            >
              {userRole === 'super_admin' ? 'Super Admin' : 
               userRole === 'admin' ? 'Admin' : 'Usuário'}
            </Badge>
          </div>
        </div>
        
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full"
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Sair
        </Button>
      </div>
    </aside>
  );
} 