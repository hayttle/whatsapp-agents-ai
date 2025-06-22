"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { UserProfileModal } from "@/components/admin/UserProfileModal";
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
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData?.session?.user?.email;
        if (!email) {
          setIsLoading(false);
          return;
        }
        const { data: userDb } = await supabase.from("users").select("id, nome, email, role").eq("email", email).single();
        setUser(userDb);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

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

  const initials = getInitials(user?.nome, user?.email);

  const handleLogout = async () => {
    try {
      const supabase = createClientComponentClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
          {notifications > 0 && (
            <Badge 
              variant="error" 
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs"
            >
              {notifications}
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
                {user?.nome || "Usuário"}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-32">
                {user?.email}
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
                        {user?.nome || "Usuário"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user?.email}
                      </p>
                      <Badge 
                        variant="success" 
                        className="text-xs mt-1"
                      >
                        {user?.role === 'super_admin' ? 'Super Admin' : 
                         user?.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
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
            user={user}
            onClose={() => setShowProfile(false)}
            onUpdated={() => { setShowProfile(false); }}
          />
        )}
      </div>
    </nav>
  );
} 