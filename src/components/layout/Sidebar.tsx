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
  LogOut,
  Menu as MenuIcon,
  ChevronLeft
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

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('user');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Responsividade: detectar mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setDrawerOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            // console.log('✅ Sidebar: Usuário carregado:', data.user);
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
      <aside className={`fixed z-40 top-0 left-0 h-screen bg-brand-gray-deep text-white flex flex-col transition-all duration-300 ${isMobile ? (drawerOpen ? 'w-64' : 'w-0') : (isCollapsed ? 'w-16' : 'w-64')}`}
        style={{ minWidth: isMobile && !drawerOpen ? 0 : undefined }}
      >
        {/* Overlay mobile */}
        {isMobile && drawerOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-30" onClick={() => setDrawerOpen(false)} />
        )}
        {/* Botão de colapso/abrir Drawer */}
        <div className="h-16 flex items-center justify-between px-2 border-b border-brand-gray-dark relative z-40">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-brand-green-light w-6 h-6" />
            {!isCollapsed && !isMobile && <span className="text-xl font-bold">AI Agents</span>}
          </div>
          {isMobile ? (
            <button onClick={() => setDrawerOpen(!drawerOpen)} className="p-2">
              <MenuIcon className="w-6 h-6" />
            </button>
          ) : (
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2">
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}
        </div>
        {/* Loading spinner */}
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </aside>
    );
  }

  // Overlay mobile
  const overlay = isMobile && drawerOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-30" onClick={() => setDrawerOpen(false)} />
  ) : null;

  // Sidebar classes
  const sidebarClass = `fixed z-40 top-0 left-0 h-screen bg-brand-gray-deep text-white flex flex-col transition-all duration-300 shadow-2xl
    ${isMobile ? (drawerOpen ? 'w-[90vw] max-w-xs' : 'w-0 -translate-x-full') : (isCollapsed ? 'w-16' : 'w-64')}`;

  // Renderização condicional de texto
  const showText = !isCollapsed || isMobile;

  return (
    <>
      {overlay}
      <aside className={sidebarClass} style={{ 
        minWidth: isMobile && !drawerOpen ? 0 : undefined,
        transform: isMobile && !drawerOpen ? 'translateX(-100%)' : undefined
      }}>
        {/* Botão de colapso/abrir Drawer */}
        <div className="h-16 flex items-center justify-between px-2 border-b border-brand-gray-dark relative z-40">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-brand-green-light w-6 h-6" />
            {showText && <span className="text-xl font-bold">AI Agents</span>}
          </div>
          {isMobile ? (
            <button onClick={() => setDrawerOpen(!drawerOpen)} className="p-2">
              <MenuIcon className="w-6 h-6" />
            </button>
          ) : (
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2">
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-2 overflow-y-auto">
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
                      onClick={hasChildren ? (e) => { e.preventDefault(); toggleExpanded(item.href); } : (isMobile ? () => setDrawerOpen(false) : undefined)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 select-none
                        ${isItemActive ? 'bg-brand-green-light text-white font-semibold' : 'text-gray-300 hover:bg-brand-gray-dark hover:text-white'}
                      `}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {showText && <span className="ml-0 flex-1 text-left">{item.label}</span>}
                      {hasChildren && showText && (
                        <div className="flex items-center gap-2 ml-auto">
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
                    {hasChildren && isExpanded && showText && (
                      <ul className="ml-7 mt-1 space-y-1">
                        {filteredChildren.map((child: SidebarItem) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={isMobile ? () => setDrawerOpen(false) : undefined}
                                className={`flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 text-sm
                                  ${isChildActive ? 'bg-brand-green-light/20 text-brand-green-light font-medium' : 'text-gray-400 hover:bg-brand-gray-dark hover:text-white'}
                                `}
                              >
                                <child.icon className="w-4 h-4 flex-shrink-0" />
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

        {/* User Profile Section - sempre visível no rodapé do sidebar no mobile */}
        <div className={`p-4 border-t border-brand-gray-dark transition-all duration-300 mt-auto ${isCollapsed && !isMobile ? 'flex flex-col items-center' : ''}`}>
          <div className="flex items-center gap-3 mb-3 w-full">
            <div className="w-10 h-10 rounded-full bg-brand-green-light flex items-center justify-center text-white font-bold">
              {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
            </div>
            {showText && (
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
            )}
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2 justify-center"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            {showText ? 'Sair' : ''}
          </Button>
        </div>
      </aside>
      {/* Botão flutuante para abrir Drawer no mobile */}
      {isMobile && !drawerOpen && (
        <button
          className="fixed top-4 left-4 z-50 bg-brand-gray-deep p-2 rounded-full shadow-lg border border-brand-gray-dark"
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon className="w-6 h-6 text-white" />
        </button>
      )}
    </>
  );
} 