import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useStatusConfig } from "@/store/statusConfig";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const LandingNew = lazy(() => import("./pages/LandingNew"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Support = lazy(() => import("./pages/Support"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

import { AdminLayout } from "./components/layouts/AdminLayout";
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));
const AdminBilling = lazy(() => import("./pages/admin/AdminBilling"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminCommunication = lazy(() => import("./pages/admin/AdminCommunication"));
const AdminModeration = lazy(() => import("./pages/admin/AdminModeration"));
const Gamification = lazy(() => import("./pages/dashboard/Gamification"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const Raffle = lazy(() => import("./pages/dashboard/Raffle"));
const LinkBio = lazy(() => import("./pages/dashboard/LinkBio"));
const WhatsAppGenerator = lazy(() => import("./pages/dashboard/WhatsAppGenerator"));
const CreativeRoulette = lazy(() => import("./pages/dashboard/CreativeRoulette"));
const WorkflowEditor = lazy(() => import("./pages/dashboard/WorkflowEditor"));
const WorkflowList = lazy(() => import("./pages/dashboard/WorkflowList"));
const GlobalRanking = lazy(() => import("./pages/dashboard/GlobalRanking"));
const BioPage = lazy(() => import("@/pages/public/BioPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminAccessControl = lazy(() => import("./pages/admin/AdminAccessControl"));
const WaitlistPending = lazy(() => import("./pages/WaitlistPending"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-neon-blue" />
    </div>
  );
}

function PerformanceTracker({ userId }: { userId: string | null }) {
  const location = useLocation();
  const lastPathRef = useRef<string>(location.pathname + location.search);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!userId) return;

    const conn = (navigator as any).connection as
      | {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        }
      | undefined;

    const route = location.pathname + location.search;
    const prev = lastPathRef.current;
    lastPathRef.current = route;

    const startMark = `route-start:${route}`;
    const endMark = `route-end:${route}`;
    const measureName = `route-render:${prev}=>${route}`;

    performance.mark(startMark);

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        const entries = performance.getEntriesByName(measureName);
        const last = entries[entries.length - 1];

        const payload = {
          user_id: userId,
          route,
          metric_name: "route_render_ms",
          metric_value: last?.duration ?? null,
          metric_unit: "ms",
          user_agent: navigator.userAgent,
          effective_type: conn?.effectiveType ?? null,
          downlink: conn?.downlink ?? null,
          rtt: conn?.rtt ?? null,
          device_memory: (navigator as any).deviceMemory ?? null,
          hardware_concurrency: navigator.hardwareConcurrency ?? null,
        };

        void supabase.from("performance_metrics").insert(payload);

        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
      });

      void raf2;
    });

    return () => {
      cancelAnimationFrame(raf1);
    };
  }, [location.pathname, location.search, userId]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!userId) return;

    const onLoad = () => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return;

      const conn = (navigator as any).connection as
        | {
            effectiveType?: string;
            downlink?: number;
            rtt?: number;
          }
        | undefined;

      const base = {
        user_id: userId,
        route: window.location.pathname + window.location.search,
        metric_unit: "ms",
        user_agent: navigator.userAgent,
        effective_type: conn?.effectiveType ?? null,
        downlink: conn?.downlink ?? null,
        rtt: conn?.rtt ?? null,
        device_memory: (navigator as any).deviceMemory ?? null,
        hardware_concurrency: navigator.hardwareConcurrency ?? null,
      };

      const metrics = [
        { ...base, metric_name: "ttfb_ms", metric_value: nav.responseStart - nav.requestStart },
        { ...base, metric_name: "dom_content_loaded_ms", metric_value: nav.domContentLoadedEventEnd },
        { ...base, metric_name: "load_ms", metric_value: nav.loadEventEnd },
      ];

      void supabase.from("performance_metrics").insert(metrics);
    };

    if (document.readyState === "complete") {
      onLoad();
      return;
    }

    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, [userId]);

  return null;
}

const App = () => {
  const { initialize, user } = useAuthStore();
  const { initializeFromSupabase } = useStatusConfig();
  const lastLifecycleMarkRef = useRef(0);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    void initializeFromSupabase();
  }, [user?.id, initializeFromSupabase]);

  useEffect(() => {
    const mark = () => {
      const now = Date.now();
      if (now - lastLifecycleMarkRef.current < 1200) return false;
      lastLifecycleMarkRef.current = now;
      return true;
    };

    const resume = async (persisted: boolean) => {
      if (!mark()) return;

      window.dispatchEvent(new CustomEvent("app:resume", { detail: { persisted } }));

      if (!isSupabaseConfigured) return;

      try {
        await supabase.auth.getSession();
      } catch {
        void 0;
      }

      try {
        await (supabase as any)?.auth?.refreshSession?.();
      } catch {
        void 0;
      }

      try {
        (supabase as any)?.realtime?.connect?.();
      } catch {
        void 0;
      }

      try {
        queryClient.invalidateQueries();
      } catch {
        void 0;
      }

      if (user?.id) {
        void supabase.from("performance_metrics").insert({
          user_id: user.id,
          route: window.location.pathname + window.location.search,
          metric_name: "app_resume",
          metric_value: persisted ? 1 : 0,
          metric_unit: "flag",
          user_agent: navigator.userAgent,
        });
      }
    };

    const suspend = (persisted: boolean) => {
      if (!mark()) return;

      window.dispatchEvent(new CustomEvent("app:suspend", { detail: { persisted } }));

      if (!isSupabaseConfigured) return;
      try {
        (supabase as any)?.realtime?.disconnect?.();
      } catch {
        void 0;
      }
    };

    const onPageShow = (e: PageTransitionEvent) => {
      void resume(Boolean((e as any)?.persisted));
    };

    const onPageHide = (e: PageTransitionEvent) => {
      suspend(Boolean((e as any)?.persisted));
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void resume(false);
      }
      if (document.visibilityState === "hidden") {
        suspend(false);
      }
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user?.id]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <PerformanceTracker userId={user?.id ?? null} />
            <Routes>
              <Route path="/" element={<LandingNew />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />

              <Route path="/dahsboard" element={<Navigate to="/dashboard" replace />} />

              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/gamification" element={<Gamification />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/sorteios" element={<Raffle />} />
              <Route path="/dashboard/link-bio" element={<LinkBio />} />
              <Route path="/dashboard/whatsapp-link" element={<WhatsAppGenerator />} />
              <Route path="/dashboard/roleta" element={<CreativeRoulette />} />
              <Route path="/dashboard/workflows" element={<WorkflowList />} />
              <Route path="/dashboard/workflow/:id?" element={<WorkflowEditor />} />
              <Route path="/dashboard/ranking" element={<GlobalRanking />} />
              <Route path="/waitlist-pending" element={<WaitlistPending />} />

              <Route path="/bio/:username" element={<BioPage />} />

              <Route path="/admin" element={<AdminLayout><AdminOverview /></AdminLayout>} />
              <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
              <Route path="/admin/communication" element={<AdminLayout><AdminCommunication /></AdminLayout>} />
              <Route path="/admin/moderation" element={<AdminLayout><AdminModeration /></AdminLayout>} />
              <Route path="/admin/access" element={<AdminLayout><AdminAccessControl /></AdminLayout>} />
              <Route path="/admin/plans" element={<AdminLayout><AdminPlans /></AdminLayout>} />
              <Route path="/admin/billing" element={<AdminLayout><AdminBilling /></AdminLayout>} />
              <Route path="/admin/audit" element={<AdminLayout><AdminAuditLogs /></AdminLayout>} />
              <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
