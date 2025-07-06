"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserProfileModal } from "@/components/admin/users/UserProfileModal";
import { Button, Badge, Card, CardContent } from "@/components/brand";
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  MessageSquare,
  Menu
} from "lucide-react";
import { User as UserType } from "@/services/userService";
import { authenticatedFetch } from '@/lib/utils';

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export function Navbar() {
  const [user, setUser] = useState<UserType | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications] = useState([
    { id: 1, message: "Nova mensagem recebida", time: "2 min atrás" },
    { id: 2, message: "Instância conectada", time: "5 min atrás" }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Buscar sempre via API protegida
        const data = await authenticatedFetch('/api/users/current');
        if (!data.user) {
          setIsLoading(false);
          return;
        }
        // Mapear os dados da API para o formato esperado
        const mappedUser: UserType = {
          id: data.user.id,
          name: data.user.name || 'Usuário',
          email: data.user.email,
          role: data.user.role || 'user',
          tenant_id: data.user.tenant_id,
          created_at: data.user.created_at || new Date().toISOString(),
          updated_at: data.user.updated_at || new Date().toISOString()
        };
        setUser(mappedUser);
        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Monitorar mudanças no estado do usuário
  useEffect(() => {
    if (user) {
    }
  }, [user]);

  // Fecha menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const initials = getInitials(user?.name, user?.email);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      // erro ao fazer logout
    }
  };

  if (isLoading) {
    return (
      <nav className="w-full h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-brand-green-light flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className="w-full h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-brand-green-light flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="text-red-500 text-sm">Erro: Dados do usuário não carregados</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm">
      {/* Left side - Logo and Search */}
      <div className="flex items-center gap-4">
        <button
          className="w-8 h-8 rounded-lg bg-brand-green-light flex items-center justify-center text-white hover:bg-brand-green-medium transition-colors"
          onClick={() => router.push("/dashboard")}
          title="Ir para o Dashboard"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <div className="hidden md:flex items-center gap-2">
          <span className="font-bold text-lg text-brand-gray-dark">AI Agents</span>
          <Badge variant="success" className="text-xs">v1.0</Badge>
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none text-sm flex-1"
          />
        </div>
      </div>

      {/* Right side - Actions and User Menu */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {notifications.length > 0 && (
            <Badge
              variant="error"
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs"
            >
              {notifications.length}
            </Badge>
          )}
        </button>

        {/* Settings */}
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => router.push('/admin')}
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setShowMenu((v) => !v)}
            aria-label="Abrir menu do usuário"
          >
            <div className="w-8 h-8 rounded-full bg-brand-green-light flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-brand-gray-dark truncate max-w-32">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-32">
                {user.email}
              </p>
            </div>
            <Menu className="w-4 h-4 text-gray-500" />
          </button>

          {showMenu && (
            <Card className="absolute right-0 top-12 w-64 z-50 shadow-lg">
              <CardContent className="p-0">
                {/* User Info */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-green-light flex items-center justify-center text-white font-bold">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-gray-dark truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                      {user.role === 'super_admin' && (
                        <Badge
                          variant="success"
                          className="text-xs mt-1"
                        >
                          Super Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-left text-sm text-brand-gray-dark transition-colors"
                    onClick={() => { setShowProfile(true); setShowMenu(false); }}
                  >
                    <User className="w-4 h-4" />
                    Meu perfil
                  </button>

                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-left text-sm text-brand-gray-dark transition-colors"
                    onClick={() => { router.push('/admin'); setShowMenu(false); }}
                  >
                    <Settings className="w-4 h-4" />
                    Configurações
                  </button>

                  <div className="border-t border-gray-100 my-2" />

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
              </CardContent>
            </Card>
          )}
        </div>

        {/* Profile Modal */}
        {showProfile && user && (
          <UserProfileModal
            isOpen={showProfile}
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              tenant_id: user.tenant_id,
              created_at: user.created_at || new Date().toISOString()
            }}
            onClose={() => setShowProfile(false)}
          />
        )}
      </div>
    </nav>
  );
} 