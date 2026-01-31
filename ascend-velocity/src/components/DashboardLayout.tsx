import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
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
  MessageCircle,
  Workflow,
  Minimize2,
  Menu,
  PlayCircle,
  Lightbulb,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canUseTool as canUseToolFn, computeDenyReason, computePageToolsEnabled, hasWildcard, isPathBlockedByAdmin, normalizeDashboardPath } from "@/lib/accessControl";
import { useTheme } from "next-themes";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";
import { useTutorial } from "@/hooks/useTutorial";

import { useAuthStore } from "@/store/authStore";
import { incrementMonthlyUsageSafe, supabase } from "@/lib/supabase";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlansStore } from "@/store/plansStore";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
}

type AccessOverrides = {
  add: string[];
  remove: string[];
};

type AccessControlContextValue = {
  canUseTool: (toolId?: string, pagePath?: string) => boolean;
  notifyToolBlocked: () => void;
  isPageToolsEnabled: (pagePath?: string) => boolean;
};

const AccessControlContext = createContext<AccessControlContextValue | null>(null);

export function useAccessControl() {
  return useContext(AccessControlContext);
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { subscription, loading: subLoading } = useSubscription();
  const { plans, fetchPlans } = usePlansStore();
  const { startTutorial } = useTutorial();

  const [resumeNonce, setResumeNonce] = useState(0);

  const [billingBlocked, setBillingBlocked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [userOverrides, setUserOverrides] = useState<AccessOverrides>({ add: [], remove: [] });
  const [teamOverrides, setTeamOverrides] = useState<AccessOverrides>({ add: [], remove: [] });

  const [toolsDisabledByPage, setToolsDisabledByPage] = useState<Record<string, string[]>>({});
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);

  const [blockedToolMessage, setBlockedToolMessage] = useState(
    "Esta funcionalidade não está disponível no seu plano atual.",
  );

  const teamIdsRef = useRef<string[]>([]);
  const teamOverrideChannelsRef = useRef<any[]>([]);
  const channelErrorShownRef = useRef(false);

  useEffect(() => {
    const onResume = () => {
      channelErrorShownRef.current = false;
      setResumeNonce((v) => v + 1);
    };

    window.addEventListener("app:resume", onResume as EventListener);

    return () => {
      window.removeEventListener("app:resume", onResume as EventListener);
    };
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (!user?.id || user.role === "admin") {
      setUserOverrides({ add: [], remove: [] });
      setTeamOverrides({ add: [], remove: [] });
      return;
    }

    let cancelled = false;

    const uniq = (items: string[]) => Array.from(new Set(items.filter((v) => typeof v === "string" && v.trim().length > 0)));

    const notifyChannelError = () => {
      if (channelErrorShownRef.current) return;
      channelErrorShownRef.current = true;
      toast.error("Falha ao sincronizar permissões em tempo real. Recarregue a página.");
    };

    const sameSet = (a: string[], b: string[]) => {
      if (a.length !== b.length) return false;
      for (const v of a) if (!b.includes(v)) return false;
      return true;
    };

    const clearTeamOverrideChannels = () => {
      while (teamOverrideChannelsRef.current.length) {
        const ch = teamOverrideChannelsRef.current.pop();
        if (ch) supabase.removeChannel(ch);
      }
    };

    const syncTeamOverrideChannels = (ids: string[]) => {
      clearTeamOverrideChannels();
      ids.forEach((teamId) => {
        const ch = supabase
          .channel(`realtime:team_access_overrides:${teamId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "team_access_overrides", filter: `team_id=eq.${teamId}` },
            () => {
              loadTeamsAndOverrides();
            },
          )
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR") notifyChannelError();
          });
        teamOverrideChannelsRef.current.push(ch);
      });
    };

    const loadUserOverrides = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("allowed_pages_add, allowed_pages_remove, dashboard_config, trial_expires_at")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) return;

      setUserOverrides({
        add: uniq(((data as any)?.allowed_pages_add as string[] | null | undefined) ?? []),
        remove: uniq(((data as any)?.allowed_pages_remove as string[] | null | undefined) ?? [])
      });

      const rawTrialExpiresAt = (data as any)?.trial_expires_at as string | null | undefined;
      setTrialExpiresAt(typeof rawTrialExpiresAt === "string" ? rawTrialExpiresAt : null);

      const cfg = ((data as any)?.dashboard_config ?? {}) as any;
      const rawTools = cfg?.access_overrides?.tools_disabled;
      const nextTools: Record<string, string[]> = {};
      if (rawTools && typeof rawTools === "object" && !Array.isArray(rawTools)) {
        for (const [k, v] of Object.entries(rawTools as Record<string, unknown>)) {
          const list = Array.isArray(v) ? v : [];
          const cleaned = Array.from(
            new Set(
              list
                .filter((x) => typeof x === "string")
                .map((x) => x.trim())
                .filter((x) => x.length > 0),
            ),
          );
          if (cleaned.length > 0) nextTools[String(k)] = cleaned;
        }
      }
      setToolsDisabledByPage(nextTools);
    };

    const loadTeamsAndOverrides = async () => {
      const { data: memberships, error: membersError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);

      if (cancelled) return;
      if (membersError) return;

      const ids = uniq((((memberships as any) ?? []) as any[]).map((m) => String(m.team_id)));
      const currentIds = teamIdsRef.current;
      if (!sameSet(ids, currentIds)) {
        teamIdsRef.current = ids;
        syncTeamOverrideChannels(ids);
      }

      if (ids.length === 0) {
        setTeamOverrides({ add: [], remove: [] });
        return;
      }

      const { data: rows, error: overridesError } = await supabase
        .from("team_access_overrides")
        .select("team_id, allowed_pages_add, allowed_pages_remove")
        .in("team_id", ids);

      if (cancelled) return;
      if (overridesError) return;

      const add: string[] = [];
      const remove: string[] = [];

      (((rows as any) ?? []) as any[]).forEach((r) => {
        add.push(...((((r as any).allowed_pages_add as string[] | null | undefined) ?? [])));
        remove.push(...((((r as any).allowed_pages_remove as string[] | null | undefined) ?? [])));
      });

      setTeamOverrides({ add: uniq(add), remove: uniq(remove) });
    };

    void loadUserOverrides();
    void loadTeamsAndOverrides();

    const profileChannel = supabase
      .channel(`realtime:profiles:access_overrides:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => {
          loadUserOverrides();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void loadUserOverrides();
        }
        if (status === "CHANNEL_ERROR") notifyChannelError();
      });

    const teamMembersChannel = supabase
      .channel(`realtime:team_members:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members", filter: `user_id=eq.${user.id}` },
        () => {
          loadTeamsAndOverrides();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void loadTeamsAndOverrides();
        }
        if (status === "CHANNEL_ERROR") notifyChannelError();
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(teamMembersChannel);
      clearTeamOverrideChannels();
    };
  }, [user?.id, user?.role, resumeNonce]);

  const hasActiveSubscription = Boolean(subscription && ["active", "trialing", "past_due"].includes(subscription.status));

  const effectiveTrialExpiresAt = useMemo(() => {
    if (typeof trialExpiresAt !== "string") return null;
    const v = trialExpiresAt.trim();
    return v.length > 0 ? v : null;
  }, [trialExpiresAt]);

  const isTrialActive = (() => {
    if (!user || user.role === "admin") return false;
    if (hasActiveSubscription) return false;
    if (!effectiveTrialExpiresAt) return false;
    const ts = Date.parse(effectiveTrialExpiresAt);
    if (!Number.isFinite(ts)) return false;
    return Date.now() < ts;
  })();

  const isTrialExpired = (() => {
    if (!user || user.role === "admin") return false;
    if (hasActiveSubscription) return false;
    if (!effectiveTrialExpiresAt) return false;
    const ts = Date.parse(effectiveTrialExpiresAt);
    if (!Number.isFinite(ts)) return false;
    return Date.now() >= ts;
  })();

  useEffect(() => {
    if (!user || user.role === "admin") return;
    if (hasActiveSubscription) return;
    if (!isTrialExpired) return;
    if (!effectiveTrialExpiresAt) return;

    void supabase.rpc("user_trial_active", { uid: user.id });
  }, [effectiveTrialExpiresAt, hasActiveSubscription, isTrialExpired, user]);

  const basePlanAllowedPages = (() => {
    if (!user || user.role === "admin") return null as string[] | null;

    const isSubActive = Boolean(subscription && ["active", "trialing", "past_due"].includes(subscription.status));
    if (isSubActive && subscription?.plan) {
      const planId = (subscription.plan as any)?.id as string | undefined;
      const storePlan = planId ? plans.find((p) => p.id === planId) : undefined;

      const storeAllowed = storePlan?.allowedPages;
      if (Array.isArray(storeAllowed)) return storeAllowed;

      const subPlan = subscription.plan as any;
      const subAllowedPages = (subPlan?.allowed_pages ?? subPlan?.allowedPages) as string[] | null | undefined;
      if (Array.isArray(subAllowedPages)) return subAllowedPages;
    }

    const freePlan = plans.find((p) => p.name === "Free" || p.price === 0);
    const freeAllowed = freePlan?.allowedPages;
    if (Array.isArray(freeAllowed)) return freeAllowed;
    return [];
  })();

  const planAllowedPages = isTrialActive ? ["*"] : basePlanAllowedPages;

  const uniq = (items: string[]) => Array.from(new Set(items.filter((v) => typeof v === "string" && v.trim().length > 0)));
  const mergedAdds = uniq([...(userOverrides.add ?? []), ...(teamOverrides.add ?? [])]);
  const mergedRemoves = uniq([...(userOverrides.remove ?? []), ...(teamOverrides.remove ?? [])]);

  const isPathBlocked = (path: string) => {
    return isPathBlockedByAdmin(path, mergedRemoves);
  };

  const isPageToolsEnabled = (path: string) => {
    return computePageToolsEnabled({
      userRole: user?.role,
      path,
      planAllowedPages,
      mergedAdds,
      mergedRemoves,
      globallyBlocked: isTrialExpired,
    });
  };

  const getDenyReason = (path: string) => {
    return computeDenyReason({
      userRole: user?.role,
      path,
      planAllowedPages,
      mergedAdds,
      mergedRemoves,
      globallyBlocked: isTrialExpired,
    });
  };

  useEffect(() => {
    if (isLoading || subLoading || !user || user.role === "admin") return;
    if (isPageToolsEnabled(location.pathname)) return;

    const reason = getDenyReason(location.pathname);
    void supabase.from("access_attempt_logs").insert({
      user_id: user.id,
      path: location.pathname,
      reason: reason ?? "unknown",
    });

    void reason;
  }, [isLoading, subLoading, user, location.pathname, navigate, subscription, plans, userOverrides, teamOverrides]);

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

  useEffect(() => {
    if (!user?.id || !isAuthenticated) return;
    let cancelled = false;

    const run = async () => {
      const { blocked } = await incrementMonthlyUsageSafe({ delta: 0, pagePath: location.pathname });
      if (cancelled) return;
      setBillingBlocked(blocked);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, location.pathname]);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [closedAnnouncements, setClosedAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    if (isLoading) return;

    const loadAnnouncements = async () => {
      const { data } = await supabase
        .from("system_announcements")
        .select("*")
        .eq("active", true)
        .or(`end_at.is.null,end_at.gte.${new Date().toISOString()}`)
        .lte("start_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (data) setAnnouncements(data);
    };

    void loadAnnouncements();
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;

    const loadAccessControl = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "access_control")
        .maybeSingle();

      if (cancelled) return;
      if (error) return;

      const msg = (data as any)?.value?.blocked_tool_message;
      if (typeof msg === "string" && msg.trim().length > 0) {
        setBlockedToolMessage(msg.trim());
      }
    };

    const loadAll = async () => {
      await Promise.all([loadAccessControl()]);
    };

    void loadAll();

    const accessChannel = supabase
      .channel("realtime:app_settings:access_control")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.access_control" },
        () => {
          void loadAccessControl();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(accessChannel);
    };
  }, [isLoading]);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    const freePlan = plans.find((p) => p.name === "Free" || p.price === 0);
    const planIds = Array.from(
      new Set(
        [
          (subscription?.plan as any)?.id as string | undefined,
          freePlan?.id,
        ].filter((v): v is string => typeof v === "string" && v.length > 0),
      ),
    );

    if (planIds.length === 0) return;

    const channels = planIds.map((planId) =>
      supabase
        .channel(`realtime:plans:${planId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "plans", filter: `id=eq.${planId}` },
          () => {
            void fetchPlans();
          },
        )
        .subscribe(),
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [fetchPlans, plans, subscription?.plan, user]);

  const lastBlockedToastAtRef = useRef<number>(0);
  const notifyToolBlocked = useCallback(() => {
    const now = Date.now();
    if (now - lastBlockedToastAtRef.current < 800) return;
    lastBlockedToastAtRef.current = now;
    toast(blockedToolMessage, {
      duration: 2500,
    });
  }, [blockedToolMessage]);

  const accessValue = useMemo<AccessControlContextValue>(() => {
    const canUseTool = (toolId?: string, pagePath?: string) => {
      const path = normalizeDashboardPath(pagePath ?? location.pathname);
      return canUseToolFn({
        userRole: user?.role,
        path,
        planAllowedPages,
        mergedAdds,
        mergedRemoves,
        toolsDisabledByPage,
        toolId,
        globallyBlocked: isTrialExpired,
      });
    };

    const isPageToolsEnabledSafe = (pagePath?: string) => {
      return isPageToolsEnabled(pagePath ?? location.pathname);
    };

    return {
      canUseTool,
      notifyToolBlocked,
      isPageToolsEnabled: isPageToolsEnabledSafe,
    };
  }, [location.pathname, notifyToolBlocked, toolsDisabledByPage, user, mergedAdds, mergedRemoves, planAllowedPages]);

  const isCurrentPageToolsEnabled = isPageToolsEnabled(location.pathname);

  const blockIfPageToolsDisabled = useCallback(
    (e: any) => {
      if (!user || user.role === "admin") return;
      if (isCurrentPageToolsEnabled) return;

      e.preventDefault();
      e.stopPropagation();
      notifyToolBlocked();
    },
    [isCurrentPageToolsEnabled, notifyToolBlocked, user],
  );

  const blockIfPageToolsDisabledKeyDown = useCallback(
    (e: React.KeyboardEvent<any>) => {
      if (!user || user.role === "admin") return;
      if (isCurrentPageToolsEnabled) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const role = target?.getAttribute?.("role");
      const isInteractiveTag = tag && ["button", "input", "textarea", "select", "a"].includes(tag);
      const isInteractiveRole = role === "button";

      if (!isInteractiveTag && !isInteractiveRole) return;

      e.preventDefault();
      e.stopPropagation();
      notifyToolBlocked();
    },
    [isCurrentPageToolsEnabled, notifyToolBlocked, user],
  );

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

  if (billingBlocked) {
    return <Navigate to="/dashboard/settings?blocked=1" replace />;
  }

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dashboard/gamification", label: "Gamificação", icon: Trophy },
    { to: "/dashboard/sorteios", label: "Sorteios", icon: Gift },
    { to: "/dashboard/roleta", label: "Roleta", icon: Dice5 },
    { to: "/dashboard/whatsapp-link", label: "Link WhatsApp", icon: MessageCircle },
    { to: "/dashboard/workflows", label: "Mapa Mental", icon: Workflow },
    { to: "/dashboard/link-bio", label: "Link na Bio", icon: LinkIcon },
    { to: "/dashboard/settings", label: "Perfil", icon: User },
    { to: "/dashboard/ranking", label: "Ranking Global", icon: Crown },
  ];

  if (user.role === "admin") {
    navItems.push({ to: "/admin", label: "Admin", icon: Shield });
  }

  const visibleNavItems = navItems;

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const visibleAnnouncements = announcements.filter(a => !closedAnnouncements.includes(a.id));

  return (
    <AccessControlContext.Provider value={accessValue}>
    <div className="min-h-screen flex flex-col">
      {visibleAnnouncements.length > 0 && (
        <div className="flex flex-col w-full z-40">
          {visibleAnnouncements.map(a => (
            <div 
              key={a.id} 
              className={cn(
                "w-full px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 relative",
                a.type === 'info' ? 'bg-blue-600 text-white' :
                a.type === 'warning' ? 'bg-yellow-500 text-black' :
                a.type === 'success' ? 'bg-green-600 text-white' :
                'bg-red-600 text-white'
              )}
            >
              <div className="flex items-center justify-center gap-2 flex-1">
                <span className="font-bold">{a.title}:</span>
                <span>{a.message}</span>
              </div>
              <button 
                onClick={() => setClosedAnnouncements(prev => [...prev, a.id])}
                className="p-1 hover:bg-black/10 rounded-full transition-colors absolute right-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main
        className="flex-1 overflow-auto pb-24"
        onPointerDownCapture={blockIfPageToolsDisabled}
        onClickCapture={blockIfPageToolsDisabled}
        onSubmitCapture={blockIfPageToolsDisabled}
        onKeyDownCapture={blockIfPageToolsDisabledKeyDown}
      >
        <div
          className={cn(
            !isCurrentPageToolsEnabled &&
              "[&_button]:opacity-50 [&_button]:cursor-not-allowed [&_input]:opacity-50 [&_input]:cursor-not-allowed [&_textarea]:opacity-50 [&_textarea]:cursor-not-allowed [&_select]:opacity-50 [&_select]:cursor-not-allowed [&_[role=button]]:opacity-50 [&_[role=button]]:cursor-not-allowed",
          )}
        >
          {children}
        </div>
      </main>

      {/* Dock Navigation */}
      {isMinimized ? (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-110"
            aria-label="Restaurar menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      ) : (
      <div className="fixed bottom-4 left-0 right-0 z-50" id="dock-nav">
        <Dock 
          magnification={dockConfig.magnification}
          distance={dockConfig.distance}
          panelHeight={dockConfig.panelHeight}
          baseItemSize={dockConfig.baseItemSize}
        >
          {visibleNavItems.map((item) => {
            const toolsEnabled = isPageToolsEnabled(item.to);
            const active = isActive(item.to);

            return (
              <Link key={item.to} to={item.to} id={`nav-${item.to.split("/").pop()}`}>
                <DockItem
                  className={cn(
                    "aspect-square rounded-full transition-colors",
                    active ? "bg-gradient-to-br from-primary to-secondary" : "bg-muted/50 hover:bg-muted",
                    !toolsEnabled && "opacity-60",
                  )}
                >
                  <DockLabel>{item.label}</DockLabel>
                  <DockIcon>
                    <item.icon
                      className={cn(
                        "h-full w-full",
                        active ? "text-primary-foreground" : "text-muted-foreground",
                      )}
                    />
                  </DockIcon>
                </DockItem>
              </Link>
            );
          })}
          
          {/* Tutorial Button */}
          <button 
            onClick={startTutorial}
            id="tutorial-btn"
            className="group"
            aria-label="Iniciar Tutorial"
          >
            <DockItem
              className="aspect-square rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            >
              <DockLabel>Como usar</DockLabel>
              <DockIcon>
                <Lightbulb className="h-full w-full text-yellow-500" />
              </DockIcon>
            </DockItem>
          </button>

          {/* Dark Mode Toggle */}
          <button onClick={toggleTheme} id="theme-toggle">
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

          {/* Minimize Button */}
          <button onClick={() => setIsMinimized(true)}>
            <DockItem
              className="aspect-square rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            >
              <DockLabel>Minimizar</DockLabel>
              <DockIcon>
                <Minimize2 className="h-full w-full text-muted-foreground" />
              </DockIcon>
            </DockItem>
          </button>
        </Dock>
      </div>
      )}
    </div>
    </AccessControlContext.Provider>
  );
};
