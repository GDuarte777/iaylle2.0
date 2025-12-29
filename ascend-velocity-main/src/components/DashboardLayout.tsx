import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Trophy,
  BarChart3,
  Calendar,
  User,
  Moon,
  Sun,
  Shield,
  Gift,
  Link as LinkIcon,
  Dice5,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";

import { useAuthStore } from "@/store/authStore";
import { Navigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  const [dockConfig, setDockConfig] = useState({
    magnification: 80,
    distance: 140,
    panelHeight: 68,
    baseItemSize: 50,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) { // Mobile
        setDockConfig({
          magnification: 0, // Disable magnification on mobile for better UX
          distance: 0,
          panelHeight: 48,
          baseItemSize: 36,
        });
      } else if (width < 1024) { // Tablet
        setDockConfig({
          magnification: 50,
          distance: 80,
          panelHeight: 56,
          baseItemSize: 40,
        });
      } else { // Desktop
        setDockConfig({
          magnification: 55,
          distance: 80,
          panelHeight: 52,
          baseItemSize: 38,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.status === 'waitlist') {
    return <Navigate to="/waitlist-pending" replace />;
  }

  if (user.status === 'blocked') {
    return <Navigate to="/support" replace />;
  }

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/gamification", label: "Gamificação", icon: Trophy },
    { to: "/dashboard/sorteios", label: "Sorteios", icon: Gift },
    { to: "/dashboard/roleta", label: "Roleta", icon: Dice5 },
    { to: "/dashboard/whatsapp-link", label: "Link WhatsApp", icon: MessageCircle },
    { to: "/dashboard/link-bio", label: "Link na Bio", icon: LinkIcon },
    { to: "/dashboard/settings", label: "Perfil", icon: User },
  ];

  if (user.role === "admin") {
    navItems.push({ to: "/admin", label: "Admin", icon: Shield });
  }

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24">
        {children}
      </main>

      {/* Dock Navigation */}
      <div className="fixed bottom-4 left-0 right-0 z-50">
        <Dock 
          magnification={dockConfig.magnification}
          distance={dockConfig.distance}
          panelHeight={dockConfig.panelHeight}
          baseItemSize={dockConfig.baseItemSize}
        >
          {navItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <DockItem
                className={cn(
                  "aspect-square rounded-full transition-colors",
                  isActive(item.to)
                    ? "bg-gradient-to-br from-primary to-secondary"
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <DockLabel>{item.label}</DockLabel>
                <DockIcon>
                  <item.icon
                    className={cn(
                      "h-full w-full",
                      isActive(item.to)
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    )}
                  />
                </DockIcon>
              </DockItem>
            </Link>
          ))}
          
          {/* Dark Mode Toggle */}
          <button onClick={toggleTheme}>
            <DockItem
              className="aspect-square rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            >
              <DockLabel>{theme === "dark" ? "Light Mode" : "Dark Mode"}</DockLabel>
              <DockIcon>
                {theme === "dark" ? (
                  <Sun className="h-full w-full text-muted-foreground" />
                ) : (
                  <Moon className="h-full w-full text-muted-foreground" />
                )}
              </DockIcon>
            </DockItem>
          </button>
        </Dock>
      </div>
    </div>
  );
};
