import { ReactNode } from "react";
import { Navigate, useLocation, NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  Shield,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NeonButton } from "@/components/NeonButton";

import { useAuthStore } from "@/store/authStore";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  // Proteção de Rota
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const navItems = [
    { path: "/admin", label: "Visão Geral", icon: LayoutDashboard },
    { path: "/admin/users", label: "Usuários", icon: Users },
    { path: "/admin/access", label: "Controle de Acesso", icon: Shield },
    { path: "/admin/plans", label: "Planos", icon: CreditCard },
    { path: "/admin/settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-background/80 backdrop-blur-xl h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-border/40">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Admin</h1>
            <p className="text-xs text-muted-foreground">God Mode</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group",
                isActive 
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)] border border-purple-500/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border mb-3">
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-purple-500/30" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <NavLink to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors justify-center">
            <LogOut className="w-4 h-4" />
            Voltar ao Site
          </NavLink>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden h-16 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <span className="font-bold">Admin Panel</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl md:hidden pt-20 px-6 animate-fade-in">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-medium transition-all duration-300",
                  isActive 
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </NavLink>
            ))}
            <NavLink 
              to="/dashboard" 
              className="flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-medium text-muted-foreground mt-8 border border-border/50"
            >
              <LogOut className="w-6 h-6" />
              Sair do Admin
            </NavLink>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-6xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};
