import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, CheckCircle, UserX, Star, FileText, Target, TrendingUp, Calendar, Search, Grid3x3, List, Edit, Trash2, ChevronLeft, ChevronRight, Lightbulb, Award, BarChart3, Zap, Crown, X } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GlassCard } from "@/components/GlassCard";
import { GlowCard } from "@/components/ui/spotlight-card";
import { DashboardLayout, useAccessControl } from "@/components/DashboardLayout";
import { fetchAffiliates, fetchCalendarStatuses, fetchCalendarStatusesForMonth, addAffiliate as apiAddAffiliate, fetchAwardedAchievements, updateAffiliate as apiUpdateAffiliate, deleteAffiliate as apiDeleteAffiliate, deleteMonthData as apiDeleteMonthData } from "@/hooks/useAffiliates";
import "@/lib/legacyCalendar";
import { useStatusConfig } from "@/store/statusConfig";
import { useBannerStore } from "@/store/bannerStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { NeonButton } from "@/components/NeonButton";
import { AffiliateCalendarModal } from "@/components/AffiliateCalendarModal";
import { getAuthedUser, getSessionSafe, supabase } from "@/lib/supabase";
import { useSubscription } from "@/hooks/useSubscription";
import { useTutorial } from "@/hooks/useTutorial";
import { calculateAchievementsForAffiliate } from "@/lib/gamificationUtils";

function DashboardInner() {
  const navigate = useNavigate();
  const access = useAccessControl();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewMode, setViewMode] = useState("grid");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [metricsSearch, setMetricsSearch] = useState("");
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [metricsMonthIdx, setMetricsMonthIdx] = useState(new Date().getMonth());
  const [metricsYear, setMetricsYear] = useState(new Date().getFullYear());
  const [metricsAffiliates, setMetricsAffiliates] = useState<any[]>([]);

  const baseAffiliatesRef = useRef<any[]>([]);
  const calendarStatusesRef = useRef<Record<string, string>>({});
  const awardedAchievementsRef = useRef<Record<string, Record<string, boolean>>>({});

  const { config: bannerConfig, updateConfig: updateBannerConfig, initializeFromSupabase: initializeBannerFromSupabase } = useBannerStore();
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [bannerForm, setBannerForm] = useState(bannerConfig);
  const [isRulesTutorialOpen, setIsRulesTutorialOpen] = useState(false);

  // Sync bannerForm with bannerConfig when modal opens
  useEffect(() => {
    if (isEditingBanner) {
      setBannerForm(bannerConfig);
    }
  }, [isEditingBanner, bannerConfig]);

  const handleSaveBanner = async () => {
    if (access && !access.canUseTool("dashboard-banner-save")) {
      access.notifyToolBlocked();
      return;
    }
    await updateBannerConfig(bannerForm);
    setIsEditingBanner(false);
    toast.success("Banner atualizado com sucesso!");
  };

  useEffect(() => {
    void initializeBannerFromSupabase();
  }, [initializeBannerFromSupabase]);

  const { classes, levels, achievements, initializeFromSupabase } = useStatusConfig();

  const { subscription } = useSubscription();
  const { startDashboardTutorial } = useTutorial();
  const isFreeUser = !subscription;
  const [freeUsageLimit, setFreeUsageLimit] = useState<number | null>(null);

  const getLevelInfo = useCallback((points: number) => {
    let currentLevel = levels[0];
    let nextLevel = levels[levels.length - 1];

    for (let i = 0; i < levels.length; i++) {
      if (points >= levels[i].minXP) {
        currentLevel = levels[i];
        if (i < levels.length - 1) {
          nextLevel = levels[i + 1];
        } else {
          nextLevel = { ...levels[i], minXP: levels[i].minXP * 1.5 }; // Estimativa para último nível
        }
      }
    }

    const progress = Math.min(100, Math.max(0, ((points - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100));
    
    return { currentLevel, nextLevel, progress };
  }, [levels]);

  useEffect(() => {
    void initializeFromSupabase();
  }, [initializeFromSupabase]);

  useEffect(() => {
    const run = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "billing_settings")
          .maybeSingle();

        if (error) {
          setFreeUsageLimit(null);
          return;
        }

        const value = (data as any)?.value as { free_usage_limit?: number } | undefined;
        if (typeof value?.free_usage_limit === "number") {
          setFreeUsageLimit(value.free_usage_limit);
        } else {
          setFreeUsageLimit(null);
        }
      } catch {
        setFreeUsageLimit(null);
      }
    };

    void run();
  }, []);

  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [baseAffiliates, setBaseAffiliates] = useState<any[]>([]);
  const [calendarStatuses, setCalendarStatuses] = useState<Record<string, string>>({});
  const [awardedAchievements, setAwardedAchievements] = useState<Record<string, Record<string, boolean>>>({});
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [isClearingMonth, setIsClearingMonth] = useState(false);
  const [isClearingMonthLoading, setIsClearingMonthLoading] = useState(false);
  const [isAddingAffiliate, setIsAddingAffiliate] = useState(false);

  const lastAddAffiliateStartedAtRef = useRef<number | null>(null);
  const addAffiliateAbortRef = useRef<AbortController | null>(null);
  const reconnectRealtimeRef = useRef<(() => void) | null>(null);

  const filteredAffiliates = affiliates.filter((affiliate) => {
    if (!affiliateSearch.trim()) return true;
    const query = affiliateSearch.toLowerCase();
    return (
      (affiliate.name || "").toLowerCase().includes(query) ||
      (affiliate.username || "").toLowerCase().includes(query)
    );
  });

  const buildAffiliateList = useCallback((rows: any[], statuses: Record<string, string>, awards: Record<string, Record<string, boolean>>) => {
    const ym = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

    return rows.map((r: any) => {
      const id = r.id;
      const ig = typeof r.instagram === 'string' ? r.instagram.trim() : '';
      const username = ig ? (ig.startsWith('@') ? ig : `@${ig}`) : '';

      const entries = Object.entries(statuses).filter(([k]) => (k as string).startsWith(`${id}:`));
      const inMonth = entries.filter(([k]) => (k as string).includes(`:${ym}-`));

      const posted = inMonth.filter(([, v]) => {
        const cls = classes.find((c) => c.key === v);
        return cls?.type === 'positive';
      }).length;
      const notPosted = inMonth.filter(([, v]) => {
        const cls = classes.find((c) => c.key === v);
        return cls?.type === 'negative';
      }).length;
      const noAnalysis = inMonth.filter(([, v]) => v === 'sem_analise').length;
      const salesPosts = inMonth.filter(([, v]) => v === 'postou_vendas').length;

      const pointsBase = inMonth.reduce((acc, [, v]) => {
        const cls = classes.find((c) => c.key === v);
        return acc + (cls?.points || 0);
      }, 0);

      const affiliateAwards = awards[id] || {};
      const myAchievements = achievements.filter((ach) => {
        return Object.keys(affiliateAwards).some((k) => k === ach.id || k.startsWith(`${ach.id}@`));
      });
      const achievementPoints = achievements.reduce((acc, ach) => {
        const count = Object.keys(affiliateAwards).filter((k) => k === ach.id || k.startsWith(`${ach.id}@`)).length;
        return acc + (count * ach.xp);
      }, 0);

      const points = pointsBase + achievementPoints;

      const totalDays = posted + notPosted;
      const performance = totalDays > 0 ? Math.round((posted / totalDays) * 100) : 0;

      const { currentLevel } = getLevelInfo(points);

      return {
        id,
        name: r.name,
        username,
        points,
        level: currentLevel.name,
        performance,
        posted,
        notPosted,
        noAnalysis,
        salesPosts,
        instagramLink: r.instagram_link,
        notes: r.notes,
        myAchievements
      };
    });
  }, [year, monthIdx, classes, achievements, getLevelInfo]);

  const updateAffiliateList = useCallback((rows: any[], statuses: Record<string, string>, dbAwards: Record<string, Record<string, boolean>>) => {
    // Merge DB awards with dynamically calculated awards
    const mergedAwards = { ...dbAwards };
    rows.forEach(r => {
        const dynamic = calculateAchievementsForAffiliate(r.id, achievements, statuses);
        mergedAwards[r.id] = { ...(mergedAwards[r.id] || {}), ...dynamic };
    });

    const list = buildAffiliateList(rows, statuses, mergedAwards);
    setAffiliates(list);
  }, [buildAffiliateList, achievements]);

  // Trigger update when achievements change
  useEffect(() => {
    if (baseAffiliatesRef.current.length > 0) {
      updateAffiliateList(baseAffiliatesRef.current, calendarStatusesRef.current, awardedAchievementsRef.current);
    }
  }, [achievements, updateAffiliateList]);

  const applyBaseAffiliatesUpdate = useCallback((updater: (current: any[]) => any[]) => {
    setBaseAffiliates((current) => {
      const next = updater(current);
      baseAffiliatesRef.current = next;
      updateAffiliateList(next, calendarStatusesRef.current, awardedAchievementsRef.current);
      return next;
    });
  }, [updateAffiliateList]);

  const loadBaseAffiliates = useCallback(async () => {
    try {
      const rows = await fetchAffiliates();
      setBaseAffiliates(rows);
      baseAffiliatesRef.current = rows;
      // Use existing references for statuses and awards
      updateAffiliateList(rows, calendarStatusesRef.current, awardedAchievementsRef.current);
    } catch (error) {
      console.error("Error loading affiliates:", error);
    }
  }, [updateAffiliateList]);

  const loadMetrics = useCallback(async () => {
    try {
      const [allStatuses, monthStatuses, awards] = await Promise.all([
        fetchCalendarStatuses(),
        fetchCalendarStatusesForMonth(year, monthIdx),
        fetchAwardedAchievements()
      ]);

      const combinedStatuses = { ...allStatuses, ...monthStatuses };
      (window as any).__calendarStatuses = combinedStatuses;
      (window as any).__awardedAchievements = awards;

      setCalendarStatuses(combinedStatuses);
      setAwardedAchievements(awards);
      calendarStatusesRef.current = combinedStatuses;
      awardedAchievementsRef.current = awards;
      // Pass the fetched awards (from DB) to updateAffiliateList
      updateAffiliateList(baseAffiliatesRef.current, combinedStatuses, awards);
    } catch (error) {
      console.error("Error loading metrics:", error);
    }
  }, [year, monthIdx, updateAffiliateList]);

  const refreshData = useCallback(async () => {
    await Promise.all([loadBaseAffiliates(), loadMetrics()]);
  }, [loadBaseAffiliates, loadMetrics]);

  const handleClearMonth = async () => {
    if (access && !access.canUseTool("dashboard-month-clear")) {
      access.notifyToolBlocked();
      return;
    }
    if (isFreeUser && typeof freeUsageLimit === "number") {
      const limit = Math.max(0, freeUsageLimit);
      if (limit > 0 && affiliates.length >= limit) {
        toast.error("Limite do plano Free atingido. Faça upgrade para continuar.");
        navigate("/dashboard/settings");
        return;
      }
    }

    setIsClearingMonthLoading(true);
    const ok = await apiDeleteMonthData(year, monthIdx);
    if (ok) {
      toast.success("Dados do mês apagados com sucesso");
      setIsClearingMonth(false);
      await loadMetrics();
    } else {
      toast.error("Erro ao apagar dados do mês");
    }
    setIsClearingMonthLoading(false);
  };

  useEffect(() => {
    void loadBaseAffiliates();
  }, [loadBaseAffiliates]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    let channel: any;
    let cancelled = false;
    let retryTimer: number | null = null;
    let retries = 0;

    const scheduleRetry = () => {
      if (cancelled) return;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      const delayMs = Math.min(30000, 1000 * Math.pow(2, retries));
      retries = Math.min(6, retries + 1);
      retryTimer = window.setTimeout(() => {
        void run();
      }, delayMs);
    };

    const run = async () => {
      const user = await getAuthedUser();

      if (cancelled || !user) return;

      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }

      channel = supabase
        .channel(`realtime:affiliates:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'affiliates',
            filter: `owner_user_id=eq.${user.id}`
          },
          (payload) => {
            const eventType = payload?.eventType as string | undefined;
            const nextRow = payload?.new as any;
            const prevRow = payload?.old as any;

            if (eventType === "DELETE") {
              const removedId = prevRow?.id;
              if (removedId) {
                applyBaseAffiliatesUpdate((current) => current.filter((row) => row?.id !== removedId));
              }
              return;
            }

            if (!nextRow?.id) return;

            if (nextRow.status && nextRow.status !== "active") {
              applyBaseAffiliatesUpdate((current) => current.filter((row) => row?.id !== nextRow.id));
              return;
            }

            applyBaseAffiliatesUpdate((current) => {
              const existingIndex = current.findIndex((row) => row?.id === nextRow.id);
              if (existingIndex >= 0) {
                const next = [...current];
                next[existingIndex] = { ...current[existingIndex], ...nextRow };
                return next;
              }
              return [nextRow, ...current];
            });
          }
        )
        .subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            retries = 0;
            if (retryTimer !== null) {
              window.clearTimeout(retryTimer);
              retryTimer = null;
            }
            return;
          }

          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            scheduleRetry();
          }
        });
    };

    reconnectRealtimeRef.current = () => {
      if (cancelled) return;
      retries = 0;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
      void run();
    };

    void run();

    return () => {
      cancelled = true;
      reconnectRealtimeRef.current = null;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [applyBaseAffiliatesUpdate]);

  useEffect(() => {
    if (!isAddingAffiliate) return;

    let rafId = 0;
    const tick = () => {
      const startedAt = lastAddAffiliateStartedAtRef.current;
      if (typeof startedAt !== 'number') return;

      const elapsed = Date.now() - startedAt;
      if (elapsed > 15000) {
        try {
          addAffiliateAbortRef.current?.abort();
        } catch (error) {
          void error;
        }
        addAffiliateAbortRef.current = null;
        lastAddAffiliateStartedAtRef.current = null;
        setIsAddingAffiliate(false);
        void loadBaseAffiliates();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isAddingAffiliate, loadBaseAffiliates]);

  useEffect(() => {
    const onResume = () => {
      if (document.visibilityState === 'visible') {
        if (isAddingAffiliate) {
          try {
            addAffiliateAbortRef.current?.abort();
          } catch (error) {
            void error;
          }
          addAffiliateAbortRef.current = null;
          lastAddAffiliateStartedAtRef.current = null;
          setIsAddingAffiliate(false);
        }

        try {
          (supabase as any)?.realtime?.connect?.();
        } catch (error) {
          void error;
        }
        void getSessionSafe(2500).catch(() => void 0);
        reconnectRealtimeRef.current?.();
        refreshData();
      }
    };
    const onSuspend = () => {
      if (isAddingAffiliate) {
        try {
          addAffiliateAbortRef.current?.abort();
        } catch (error) {
          void error;
        }
        addAffiliateAbortRef.current = null;
        lastAddAffiliateStartedAtRef.current = null;
        setIsAddingAffiliate(false);
      }
    };
    const onAward = () => loadMetrics();
    const onCalendarStatusUpdated = () => loadMetrics();

    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('online', onResume);
    window.addEventListener('pageshow', onResume);
    window.addEventListener('resume', onResume as EventListener);
    window.addEventListener('freeze', onSuspend as EventListener);
    window.addEventListener('pagehide', onSuspend);
    window.addEventListener('achievement-awarded', onAward as EventListener);
    window.addEventListener('calendar-status-updated', onCalendarStatusUpdated as EventListener);

    return () => {
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('online', onResume);
      window.removeEventListener('pageshow', onResume);
      window.removeEventListener('resume', onResume as EventListener);
      window.removeEventListener('freeze', onSuspend as EventListener);
      window.removeEventListener('pagehide', onSuspend);
      window.removeEventListener('achievement-awarded', onAward as EventListener);
      window.removeEventListener('calendar-status-updated', onCalendarStatusUpdated as EventListener);
    };
  }, [refreshData, loadMetrics, isAddingAffiliate]);

  const [form, setForm] = useState({ nome: "", instagram: "", link: "", observacoes: "" });

  const changeMetricsMonth = (dir: "prev" | "next") => {
    const delta = dir === "prev" ? -1 : 1;
    const d = new Date(metricsYear, metricsMonthIdx + delta, 1);
    setMetricsYear(d.getFullYear());
    setMetricsMonthIdx(d.getMonth());
  };

  const metricsMonthLabel = new Date(metricsYear, metricsMonthIdx, 1).toLocaleString("pt-BR", { month: "long" });

  const refreshMetricsData = useCallback(async () => {
    try {
      const [rows, allStatuses, monthStatuses, awards] = await Promise.all([
        fetchAffiliates(),
        fetchCalendarStatuses(),
        fetchCalendarStatusesForMonth(metricsYear, metricsMonthIdx),
        fetchAwardedAchievements()
      ]);
      
      const combinedStatuses = { ...allStatuses, ...monthStatuses };
      
      const ym = `${metricsYear}-${String(metricsMonthIdx + 1).padStart(2, '0')}`;
      
      const list = rows.map((r: any) => {
        const id = r.id;
        const ig = typeof r.instagram === 'string' ? r.instagram.trim() : '';
        const username = ig ? (ig.startsWith('@') ? ig : `@${ig}`) : '';
        
        const entries = Object.entries(combinedStatuses).filter(([k]) => (k as string).startsWith(`${id}:`));
        const inMonth = entries.filter(([k]) => (k as string).includes(`:${ym}-`));
        
        const posted = inMonth.filter(([, v]) => {
          const cls = classes.find((c) => c.key === v);
          return cls?.type === 'positive';
        }).length;
        const notPosted = inMonth.filter(([, v]) => {
          const cls = classes.find((c) => c.key === v);
          return cls?.type === 'negative';
        }).length;
        const noAnalysis = inMonth.filter(([, v]) => v === 'sem_analise').length;
        const salesPosts = inMonth.filter(([, v]) => v === 'postou_vendas').length;
        
        const pointsBase = inMonth.reduce((acc, [, v]) => {
          const cls = classes.find((c) => c.key === v);
          return acc + (cls?.points || 0);
        }, 0);
        
        const affiliateAwards = awards[id] || {};
        const achievementPoints = achievements.reduce((acc, ach) => {
          const count = Object.keys(affiliateAwards).filter((k) => k === ach.id || k.startsWith(`${ach.id}@`)).length;
          return acc + (count * ach.xp);
        }, 0);

        const points = pointsBase + achievementPoints;
        
        const totalDays = posted + notPosted;
        const performance = totalDays > 0 ? Math.round((posted / totalDays) * 100) : 0;
        
        const { currentLevel } = getLevelInfo(points);
        
        return { 
          id, 
          name: r.name, 
          username, 
          points, 
          level: currentLevel.name, 
          performance, 
          posted, 
          notPosted, 
          noAnalysis, 
          salesPosts 
        };
      });
      
      setMetricsAffiliates(list);
    } catch (error) {
      console.error("Error refreshing metrics data:", error);
    }
  }, [metricsYear, metricsMonthIdx, classes, achievements, getLevelInfo]);

  useEffect(() => {
    refreshMetricsData();
  }, [refreshMetricsData]);

  const monthLabel = new Date(year, monthIdx, 1).toLocaleString("pt-BR", { month: "long" });

  const openCalendarForAffiliate = (affiliate: any) => {
    (window as any).openLegacyCalendar?.({ id: affiliate.id, nome: affiliate.name });
  };

  const addAffiliate = async () => {
    if (access && !access.canUseTool("dashboard-affiliate-add")) {
      access.notifyToolBlocked();
      return;
    }
    const { nome, instagram, link, observacoes } = form;
    if (!nome.trim()) {
      toast("Preencha o nome");
      return;
    }

    if (isFreeUser && typeof freeUsageLimit === "number") {
      const limit = Math.max(0, freeUsageLimit);
      if (limit > 0 && affiliates.length >= limit) {
        toast.error("Limite do plano Free atingido. Faça upgrade para continuar.");
        navigate("/dashboard/settings");
        return;
      }
    }
    
    if (isAddingAffiliate) return;

    try {
      addAffiliateAbortRef.current?.abort();
    } catch (error) {
      void error;
    }
    const controller = new AbortController();
    addAffiliateAbortRef.current = controller;

    lastAddAffiliateStartedAtRef.current = Date.now();
    setIsAddingAffiliate(true);
    try {
      const ig = instagram.trim();

      const newAffiliate = await apiAddAffiliate(
        nome.trim(),
        ig ? ig : null,
        link.trim(),
        observacoes?.trim(),
        { signal: controller.signal },
      );
      
      if (newAffiliate) {
        setForm({ nome: "", instagram: "", link: "", observacoes: "" });
        toast.success("Afiliada adicionada com sucesso");
        applyBaseAffiliatesUpdate((current) => {
          return [newAffiliate, ...current.filter((row) => row?.id !== newAffiliate.id)];
        });
        if (activeTab === "metricas") {
          void refreshMetricsData();
        }
        void refreshData();
      } else {
        void refreshData();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes('abort')) {
        void loadBaseAffiliates();
      } else {
        console.error("Error adding affiliate:", error);
        toast.error("Erro ao adicionar afiliada. Tente novamente.");
      }
    } finally {
      lastAddAffiliateStartedAtRef.current = null;
      addAffiliateAbortRef.current = null;
      setIsAddingAffiliate(false);
    }
  };

  const [isDeletingAffiliate, setIsDeletingAffiliate] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState<{ id: string; name: string } | null>(null);

  const confirmDeleteAffiliate = (affiliate: { id: string; name: string }) => {
    setAffiliateToDelete({ id: affiliate.id, name: affiliate.name });
    setIsDeletingAffiliate(true);
  };

  const handleDeleteAffiliate = async () => {
    if (!affiliateToDelete) return;

    if (access && !access.canUseTool("dashboard-affiliate-delete")) {
      access.notifyToolBlocked();
      return;
    }

    if (isFreeUser && typeof freeUsageLimit === "number") {
      const limit = Math.max(0, freeUsageLimit);
      if (limit > 0 && affiliates.length >= limit) {
        toast.error("Limite do plano Free atingido. Faça upgrade para continuar.");
        navigate("/dashboard/settings");
        return;
      }
    }

    const ok = await apiDeleteAffiliate(affiliateToDelete.id);
    if (ok) {
      toast.success("Afiliada removida com sucesso");
      setIsDeletingAffiliate(false);
      setAffiliateToDelete(null);
      applyBaseAffiliatesUpdate((current) => current.filter((row) => row?.id !== affiliateToDelete.id));
      if (activeTab === "metricas") {
        await refreshMetricsData();
      }
    }
  };

  const [isEditingAffiliate, setIsEditingAffiliate] = useState(false);
  const [editingAffiliateData, setEditingAffiliateData] = useState<any>(null);

  const openEditAffiliate = (affiliate: any) => {
    setEditingAffiliateData({ ...affiliate, instagram: affiliate.username.replace('@', '') });
    setIsEditingAffiliate(true);
  };

  const handleSaveAffiliate = async () => {
    if (!editingAffiliateData) return;

    if (access && !access.canUseTool("dashboard-affiliate-save")) {
      access.notifyToolBlocked();
      return;
    }

    if (isFreeUser && typeof freeUsageLimit === "number") {
      const limit = Math.max(0, freeUsageLimit);
      if (limit > 0 && affiliates.length >= limit) {
        toast.error("Limite do plano Free atingido. Faça upgrade para continuar.");
        navigate("/dashboard/settings");
        return;
      }
    }

    const name = String(editingAffiliateData.name || '').trim();
    const instagram = String(editingAffiliateData.instagram || '').trim();
    if (!name) {
      toast.error("Preencha o nome");
      return;
    }
    const ok = await apiUpdateAffiliate(editingAffiliateData.id, { 
      name, 
      instagram: instagram ? instagram : null,
      instagram_link: editingAffiliateData.instagramLink,
      notes: editingAffiliateData.notes
    });
    if (ok) {
      toast.success("Afiliada atualizada com sucesso");
      setIsEditingAffiliate(false);
      setEditingAffiliateData(null);
      applyBaseAffiliatesUpdate((current) => current.map((row) => row?.id === editingAffiliateData.id ? { ...row, name, instagram: instagram ? instagram : null, instagram_link: editingAffiliateData.instagramLink, notes: editingAffiliateData.notes } : row));
      if (activeTab === "metricas") {
        await refreshMetricsData();
      }
    }
  };

  const changeMonth = (dir: "prev" | "next") => {
    const delta = dir === "prev" ? -1 : 1;
    const d = new Date(year, monthIdx + delta, 1);
    setYear(d.getFullYear());
    setMonthIdx(d.getMonth());
  };

  return (
    <>
      <div className="bg-background">
      {/* Header com gradiente neon */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${bannerConfig.gradientFrom} ${bannerConfig.gradientVia} ${bannerConfig.gradientTo} opacity-10`} />
        <div className="glass-card border-b border-border/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 animate-fade-in" id="dashboard-banner">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                      {bannerConfig.title}
                    </h1>
                    <button 
                      onClick={() => setIsEditingBanner(true)}
                      className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-primary transition-colors" 
                      title="Editar Banner"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    {bannerConfig.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição do Banner */}
      <Dialog open={isEditingBanner} onOpenChange={setIsEditingBanner}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg bg-background/90 backdrop-blur-2xl border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Personalizar Banner</DialogTitle>
          <div className={`relative h-32 bg-gradient-to-br ${bannerForm.gradientFrom} ${bannerForm.gradientVia} ${bannerForm.gradientTo}`}>
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />
            <div className="absolute bottom-6 left-8">
              <h2 className="text-2xl font-bold text-foreground">Personalizar Banner</h2>
              <p className="text-sm text-muted-foreground">Edite o título e visual do painel</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título do Painel</label>
                <div className="relative group">
                  <input
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full bg-muted/50 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-muted font-medium"
                    placeholder="Ex: Painel de Gestão"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</label>
                <div className="relative group">
                  <input
                    value={bannerForm.description}
                    onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                    className="w-full bg-muted/50 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-muted font-medium"
                    placeholder="Ex: Acompanhe o desempenho..."
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estilo do Gradiente</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { from: 'from-primary', via: 'via-secondary', to: 'to-accent', label: 'Neon' },
                    { from: 'from-blue-500', via: 'via-cyan-500', to: 'to-teal-500', label: 'Ocean' },
                    { from: 'from-purple-500', via: 'via-pink-500', to: 'to-red-500', label: 'Sunset' },
                    { from: 'from-green-500', via: 'via-emerald-500', to: 'to-lime-500', label: 'Nature' },
                    { from: 'from-yellow-500', via: 'via-orange-500', to: 'to-red-500', label: 'Fire' },
                    { from: 'from-gray-500', via: 'via-gray-400', to: 'to-gray-300', label: 'Mono' },
                  ].map((theme, i) => (
                    <button
                      key={i}
                      onClick={() => setBannerForm({ ...bannerForm, gradientFrom: theme.from, gradientVia: theme.via, gradientTo: theme.to })}
                      className={`h-12 rounded-xl bg-gradient-to-r ${theme.from} ${theme.via} ${theme.to} opacity-80 hover:opacity-100 transition-all duration-300 ring-2 ring-offset-2 ring-offset-background ${
                        bannerForm.gradientFrom === theme.from ? 'ring-primary scale-105' : 'ring-transparent hover:scale-105'
                      }`}
                      title={theme.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsEditingBanner(false)}
                className="flex-1 px-6 py-3 rounded-xl font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-300"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveBanner}
                className="flex-[2] px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeletingAffiliate} onOpenChange={setIsDeletingAffiliate}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Remover Afiliado</DialogTitle>
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Remover Afiliado?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja remover <strong>{affiliateToDelete?.name}</strong>? Esta ação não pode ser desfeita e todos os dados serão perdidos.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeletingAffiliate(false)}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors duration-300"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteAffiliate}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-destructive text-white shadow-lg shadow-destructive/25 hover:shadow-destructive/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isClearingMonth} onOpenChange={setIsClearingMonth}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Apagar dados do mês</DialogTitle>
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Apagar dados do mês?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Esta ação remove todos os registros de todas as afiliadas para {monthLabel} de {year}. Esta operação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsClearingMonth(false)}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted transition-colors duration-300"
                disabled={isClearingMonthLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleClearMonth}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-destructive text-white shadow-lg shadow-destructive/25 hover:shadow-destructive/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100"
                disabled={isClearingMonthLoading}
              >
                {isClearingMonthLoading ? "Apagando..." : "Sim, apagar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Afiliado */}
      <Dialog open={isEditingAffiliate} onOpenChange={setIsEditingAffiliate}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg bg-white/90 dark:bg-black/90 backdrop-blur-2xl border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Editar Afiliado</DialogTitle>
          <div className="relative h-24 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px]" />
            <div className="absolute bottom-6 left-8">
              <h2 className="text-2xl font-bold text-foreground">Editar Afiliado</h2>
              <p className="text-sm text-muted-foreground">Atualize os dados do perfil</p>
            </div>
          </div>

          {editingAffiliateData && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</label>
                  <div className="relative group">
                    <input
                      value={editingAffiliateData.name}
                      onChange={(e) => setEditingAffiliateData({ ...editingAffiliateData, name: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium"
                      placeholder="Nome do afiliado"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Instagram (sem @)</label>
                  <div className="relative group">
                    <input
                      value={editingAffiliateData.instagram}
                      onChange={(e) => setEditingAffiliateData({ ...editingAffiliateData, instagram: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium"
                      placeholder="usuario"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link do Instagram</label>
                  <div className="relative group">
                    <input
                      value={editingAffiliateData.instagramLink || ""}
                      onChange={(e) => setEditingAffiliateData({ ...editingAffiliateData, instagramLink: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações</label>
                  <div className="relative group">
                    <input
                      value={editingAffiliateData.notes || ""}
                      onChange={(e) => setEditingAffiliateData({ ...editingAffiliateData, notes: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/50 rounded-2xl px-4 py-3 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium"
                      placeholder="Anotações gerais..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsEditingAffiliate(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-300"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveAffiliate}
                  className="flex-[2] px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog do Tutorial de Regras */}
      <Dialog open={isRulesTutorialOpen} onOpenChange={setIsRulesTutorialOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-none shadow-2xl rounded-3xl p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Como funcionam as Regras
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Esta aba exibe as regras atuais e ativas do seu sistema de gamificação.
              </p>
              
              <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/20 space-y-3">
                <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Edit className="w-4 h-4 text-secondary" />
                  Sincronização Automática
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Essa aba "Regras" serve para explicar o funcionamento de cada ferramenta da gamificação.
                  <br /><br />
                  Ao criar ou editar um novo <strong>nível</strong>, <strong>classe</strong> (pontuação) ou <strong>conquista</strong> na página de <span className="text-foreground font-medium">Gamificação</span>, essas alterações aparecerão automaticamente nos campos respectivos desta aba "Regras".
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <span>Configure os pontos e regras no painel "Gamificação".</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <span>Visualize aqui como o sistema de níveis, classes e conquistas funcionam para os suas afiliadas.</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  <span>Após ter configurado as regras do seu jeito, você pode mostrar essa aba de Regras para que suas afiliadas entendam como funciona a sua gamificação.</span>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={() => setIsRulesTutorialOpen(false)} className="w-full sm:w-auto">
                Entendi
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div id="dashboard-tabs">
              <TabsList className="relative h-auto bg-gray-100/50 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 p-1.5 rounded-2xl inline-flex w-full sm:w-auto shadow-sm">
                <TabsTrigger 
                  value="dashboard" 
                  className="relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-2 sm:px-6 py-3 text-xs sm:text-sm font-medium text-muted-foreground transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-md dark:data-[state=active]:shadow-sm dark:data-[state=active]:shadow-black/50 hover:text-foreground dark:hover:text-white min-w-0 sm:min-w-[120px]"
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span className="truncate">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="gamificacao" 
                  aria-label="Regras"
                  className="relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-2 sm:px-6 py-3 text-xs sm:text-sm font-medium text-muted-foreground transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-md dark:data-[state=active]:shadow-sm dark:data-[state=active]:shadow-black/50 hover:text-foreground dark:hover:text-white min-w-0 sm:min-w-[120px]"
                >
                  <FileText className="w-4 h-4 shrink-0" aria-hidden="true" focusable="false" />
                  <span className="truncate">Regras</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="metricas" 
                  className="relative z-10 flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-2 sm:px-6 py-3 text-xs sm:text-sm font-medium text-muted-foreground transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-md dark:data-[state=active]:shadow-sm dark:data-[state=active]:shadow-black/50 hover:text-foreground dark:hover:text-white min-w-0 sm:min-w-[120px]"
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span className="truncate">Ranking</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {activeTab === 'dashboard' && (
              <Button
                onClick={startDashboardTutorial}
                variant="outline"
                className="flex gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-foreground px-6"
              >
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Como usar
              </Button>
            )}
          </div>

          {/* ABA 1 - DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Cards de indicadores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative" id="dashboard-stats">
              <GlassCard hover className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold text-foreground">{baseAffiliates.length}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total de Afiliadas Ativas</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard hover className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 group-hover:border-accent/40 transition-all duration-300">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold text-foreground">{affiliates.length > 0 ? Math.round(affiliates.reduce((acc, a) => acc + (a.performance || 0), 0) / affiliates.length) : 0}%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Taxa Média de Cumprimento</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard hover className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 group-hover:border-secondary/40 transition-all duration-300">
                    <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold text-foreground">{affiliates.filter(a => (a.posted || 0) === 0).length}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Afiliadas sem postagem no mês</div>
                    <div className="text-xs text-muted-foreground/70">Com base no mês selecionado</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard hover className="group">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{affiliates.length > 0 ? [...affiliates].sort((a, b) => (b.points || 0) - (a.points || 0))[0].name : 'N/A'}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Afiliada Destaque</div>
                    <div className="text-xs text-muted-foreground/70">{affiliates.length > 0 ? `${[...affiliates].sort((a, b) => (b.points || 0) - (a.points || 0))[0].points} pts` : 'Sem dados'}</div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Adicionar Nova Afiliada */}
            <GlassCard className="animate-scale-in" id="dashboard-add-affiliate">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground">Adicionar Nova Afiliada</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground">Nome Completo</label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="" className="glass-card border-border/50 focus:border-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground">Instagram (sem @)</label>
                  <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="" className="glass-card border-border/50 focus:border-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground">Link do Instagram</label>
                  <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://instagram.com/usuario" className="glass-card border-border/50 focus:border-primary transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-foreground">Observações</label>
                  <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="" className="glass-card border-border/50 focus:border-primary transition-all" />
                </div>
              </div>
              <Button onClick={addAffiliate} disabled={isAddingAffiliate} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 sm:py-6 text-sm sm:text-lg font-semibold transition-all duration-300 disabled:opacity-60">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {isAddingAffiliate ? "Adicionando..." : "Adicionar Afiliada"}
              </Button>
            </GlassCard>

            {/* Gerenciar Afiliadas */}
            <GlassCard id="dashboard-list">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground">Gerenciar Afiliadas</span>
                </h2>
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full xl:w-auto mt-4 sm:mt-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative glass-card flex items-center justify-between sm:justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-xs sm:text-sm font-medium whitespace-nowrap min-w-[100px] text-center">{monthLabel} de {year}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => changeMonth("prev")} className="p-1 hover:bg-primary/10 rounded-lg text-primary hover:scale-110 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => changeMonth("next")} className="p-1 hover:bg-primary/10 rounded-lg text-primary hover:scale-110 transition-all"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 justify-between sm:justify-start">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setViewMode("grid")}
                          className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "glass-card border border-border/50"}`}
                        >
                          <Grid3x3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setViewMode("list")}
                          className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "glass-card border border-border/50"}`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => setIsClearingMonth(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 h-9 rounded-lg text-xs sm:text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors border border-destructive/30 whitespace-nowrap"
                        title="Apagar dados do mês"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Apagar mês</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative w-full xl:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={affiliateSearch}
                      onChange={(e) => setAffiliateSearch(e.target.value)}
                      placeholder="Buscar afiliada..."
                      className="pl-9 w-full glass-card border-border/50 focus:border-primary transition-all text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAffiliates.map((affiliate) => (
                    <div 
                      key={affiliate.id} 
                      className="group relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent p-1 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-black/40"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative h-full rounded-xl bg-gray-50/50 dark:bg-black/40 p-4 transition-colors duration-300 group-hover:bg-white dark:group-hover:bg-black/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative w-12 h-12 shrink-0">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse group-hover:animate-none" />
                            <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-lg bg-white dark:bg-white/10 rounded-full border-2 border-primary/20 group-hover:border-primary transition-colors duration-300">
                              {affiliate.name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                              {affiliate.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mb-0.5">
                              {affiliate.username}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium">
                              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {affiliate.points} pts
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {affiliate.level}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Performance</span>
                            <span className={affiliate.performance && affiliate.performance >= 80 ? "text-green-500" : "text-primary"}>
                              {affiliate.performance ? `${affiliate.performance}%` : "0%"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                affiliate.performance && affiliate.performance >= 80 
                                  ? "bg-gradient-to-r from-green-500 to-emerald-400" 
                                  : "bg-gradient-to-r from-primary to-blue-400"
                              }`}
                              style={{ width: `${affiliate.performance || 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Conquistas */}
                        <div className="mb-4">
                          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-between">
                            <span>Conquistas</span>
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                              {affiliate.myAchievements?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                            {(!affiliate.myAchievements || affiliate.myAchievements.length === 0) && (
                               <div className="text-[10px] text-muted-foreground/50 italic w-full text-center py-1">
                                 Nenhuma conquista
                               </div>
                            )}
                            {affiliate.myAchievements?.map((ach: any) => (
                               <Tooltip key={ach.id} delayDuration={0}>
                                 <TooltipTrigger asChild>
                                   <div className="w-7 h-7 shrink-0 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 flex items-center justify-center text-sm hover:scale-110 hover:shadow-sm hover:border-yellow-500/50 transition-all cursor-help group/ach">
                                     {ach.icon?.startsWith("http") ? (
                                        <img src={ach.icon} alt="" className="w-full h-full object-cover rounded-lg" />
                                      ) : (
                                        <span className="leading-none group-hover/ach:animate-bounce">{ach.icon || "🏆"}</span>
                                      )}
                                   </div>
                                 </TooltipTrigger>
                                 <TooltipContent side="top" className="max-w-[200px]">
                                   <div className="flex items-start gap-2">
                                     <div className="shrink-0 text-lg">{ach.icon || "🏆"}</div>
                                     <div>
                                       <div className="text-xs font-bold text-foreground">{ach.title}</div>
                                       <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{ach.description}</div>
                                       <div className="text-[10px] text-yellow-500 font-bold mt-1">+{ach.xp} XP</div>
                                     </div>
                                   </div>
                                 </TooltipContent>
                               </Tooltip>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 py-3 border-t border-gray-200 dark:border-white/5 mb-4">
                          <div className="text-center p-2 rounded-lg bg-gray-100/50 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
                            <div className="text-accent font-bold text-sm">{affiliate.posted}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Dia Positivo</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-gray-100/50 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
                            <div className="text-destructive font-bold text-sm">{affiliate.notPosted}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Dia Negativo</div>
                          </div>
                        </div>

                        <div className="flex gap-2 mb-3">
                          <button 
                            onClick={() => openEditAffiliate(affiliate)} 
                            className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300 flex items-center justify-center group/btn"
                            title="Editar"
                            aria-label="Editar afiliado"
                          >
                            <Edit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button 
                            onClick={() => {
                              if (affiliate.instagramLink) {
                                window.open(affiliate.instagramLink, '_blank');
                              } else {
                                toast.error("Link do Instagram não cadastrado");
                              }
                            }}
                            className={`flex-1 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground transition-all duration-300 flex items-center justify-center group/btn ${
                              affiliate.instagramLink 
                                ? "hover:text-[#E1306C] hover:bg-[#E1306C]/10" 
                                : "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                            }`}
                            title={affiliate.instagramLink ? "Visitar Instagram" : "Link não cadastrado"}
                            aria-label="Visitar Instagram do afiliado"
                          >
                            <FaInstagram className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button 
                            onClick={() => confirmDeleteAffiliate(affiliate)} 
                            className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-all duration-300 flex items-center justify-center group/btn"
                            title="Excluir"
                            aria-label="Excluir afiliado"
                          >
                            <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </div>

                        <button 
                          onClick={() => openCalendarForAffiliate(affiliate)} 
                          className="w-full h-9 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-300 flex items-center justify-center gap-2 group/btn font-medium text-sm"
                          title="Calendário"
                          aria-label="Ver calendário"
                        >
                          <Calendar className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          <span>Calendário</span>
                        </button>

                        {affiliate.noRegistro && (
                          <button
                            onClick={() => openCalendarForAffiliate(affiliate)}
                            className="w-full mt-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-2.5 text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                          >
                            Começar a marcar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAffiliates.map((affiliate) => (
                    <div key={affiliate.id} className="glass-card-hover border border-border/50 rounded-2xl p-4 group">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative w-12 h-12 shrink-0">
                            <div className="absolute inset-0 bg-primary/20 rounded-full" />
                            <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-lg bg-white dark:bg-white/10 rounded-full border-2 border-primary/20 group-hover:border-primary transition-colors duration-300">
                              {affiliate.name.charAt(0)}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                              {affiliate.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mb-1">
                              {affiliate.username}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
                              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {affiliate.points} pts
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {affiliate.level}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className={affiliate.performance && affiliate.performance >= 80 ? "text-green-500" : "text-primary"}>
                                {affiliate.performance ? `${affiliate.performance}%` : "0%"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-accent font-bold text-sm">{affiliate.posted}</div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Dia Positivo</div>
                            </div>
                            <div className="text-center">
                              <div className="text-destructive font-bold text-sm">{affiliate.notPosted}</div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Dia Negativo</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => openEditAffiliate(affiliate)} 
                              className="w-10 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-300 flex items-center justify-center group/btn"
                              title="Editar"
                              aria-label="Editar afiliado"
                            >
                              <Edit className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button 
                              onClick={() => {
                                if (affiliate.instagramLink) {
                                  window.open(affiliate.instagramLink, '_blank');
                                } else {
                                  toast.error("Link do Instagram não cadastrado");
                                }
                              }}
                              className={`w-10 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground transition-all duration-300 flex items-center justify-center group/btn ${
                                affiliate.instagramLink 
                                  ? "hover:text-[#E1306C] hover:bg-[#E1306C]/10" 
                                  : "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                              }`}
                              title={affiliate.instagramLink ? "Visitar Instagram" : "Link não cadastrado"}
                              aria-label="Visitar Instagram do afiliado"
                            >
                              <FaInstagram className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button 
                              onClick={() => openCalendarForAffiliate(affiliate)} 
                              className="w-10 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-secondary hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-all duration-300 flex items-center justify-center group/btn tutorial-calendar-btn"
                              title="Calendário"
                              aria-label="Ver calendário"
                            >
                              <Calendar className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button 
                              onClick={() => confirmDeleteAffiliate(affiliate)} 
                              className="w-10 h-9 rounded-lg bg-gray-100 dark:bg-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-all duration-300 flex items-center justify-center group/btn"
                              title="Excluir"
                              aria-label="Excluir afiliado"
                            >
                              <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {affiliate.noRegistro && (
                        <button
                          onClick={() => openCalendarForAffiliate(affiliate)}
                          className="w-full mt-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg py-2.5 text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                        >
                          Começar a marcar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* ABA 2 - GAMIFICAÇÃO */}
          <TabsContent value="gamificacao" className="space-y-6 sm:space-y-8 animate-fade-in">
            <GlassCard>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-secondary/10 border border-secondary/20">
                      <Award className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-foreground">Sistema de Gamificação</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Acompanhe pontuação, níveis e conquistas das suas afiliadas</p>
                </div>
                <Button
                  onClick={() => setIsRulesTutorialOpen(true)}
                  variant="outline"
                  className="flex gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-foreground px-4 self-start sm:self-center"
                >
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Como funciona
                </Button>
              </div>

              {/* Como Funciona a Pontuação */}
              <div className="mb-8">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Como Funciona a Pontuação</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Cada ação registrada no calendário gera pontos (XP). Exemplo: Ao marcar "Postou Completo", você ganha 5 XP imediatamente. Esses pontos ajudam você a subir de nível e desbloquear novas recompensas.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {classes.map((statusClass) => {
                    let Icon = FileText;
                    if (statusClass.key === 'postou_vendas') Icon = Zap;
                    if (statusClass.key === 'postou') Icon = CheckCircle;
                    if (statusClass.key === 'nao_postou') Icon = UserX;
                    if (statusClass.key === 'sem_analise') Icon = Calendar;
                    const color = statusClass.bg || '#9b184e';
                    const textColor = statusClass.textColor || '#111827';

                    return (
                      <div
                        key={statusClass.key}
                        className="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl h-full flex flex-col"
                        style={{
                          borderColor: `${color}60`,
                          boxShadow: `0 8px 30px -10px ${color}40`
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] transition-opacity duration-300 group-hover:opacity-20"
                          style={{ background: color }}
                        />
                        
                        <div className="relative flex-1 flex flex-col justify-between bg-white/50 dark:bg-black/20 p-5 backdrop-blur-md">
                          {/* Header with Icon and Points */}
                          <div className="flex items-center justify-between mb-4 w-full">
                            <div
                              className="rounded-xl p-2.5 bg-white/50 dark:bg-black/20 border shadow-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0 dark:!text-white"
                              style={{ 
                                color: textColor,
                                borderColor: `${color}30`
                              }}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div
                              className="px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm whitespace-nowrap ml-2 shrink-0 dark:!text-white dark:!border-white/20 dark:!bg-white/10"
                              style={{
                                background: `${color}20`,
                                borderColor: `${color}40`,
                                color: textColor,
                              }}
                            >
                              +{statusClass.points} pts
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-start text-left">
                            <h4 className="text-lg font-bold text-foreground mb-2 dark:group-hover:text-white transition-colors break-words">
                              {statusClass.label}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed dark:group-hover:text-muted-foreground/80 break-words">
                              {statusClass.description || ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Como Funciona a Conquista */}
              <div className="mb-8">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-1">
                    <Crown className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Como Funciona a Conquista</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Conquistas são marcos especiais de dedicação. Exemplo: Manter uma sequência de 5 dias postando sem falhar libera um bônus extra de 50 XP. Elas podem ser mensais, semanais ou únicas.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="group relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent p-1 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-black/40 h-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      
                      <div className="relative flex h-full flex-col justify-between rounded-xl bg-white dark:bg-black/40 p-5 backdrop-blur-md transition-colors duration-300 group-hover:bg-white/80 dark:group-hover:bg-black/30">
                        {/* Header with Icon and Points */}
                        <div className="flex items-center justify-between mb-4 w-full">
                          <div className="rounded-xl p-2.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-yellow-500 shadow-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0">
                            {achievement.icon?.startsWith("http") ? (
                              <img src={achievement.icon} alt="" className="w-6 h-6 object-cover rounded-md" />
                            ) : (
                              <span className="text-xl leading-none">{achievement.icon || "🏆"}</span>
                            )}
                          </div>
                          <div className="px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-500 whitespace-nowrap ml-2 shrink-0">
                            +{achievement.xp} XP
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-start text-left">
                          <h4 className="text-lg font-bold text-foreground mb-2 dark:group-hover:text-white transition-colors break-words">
                            {achievement.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed dark:group-hover:text-muted-foreground/80 break-words">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Como Funcionam os Níveis */}
              <div className="mb-8">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 mb-1">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Como Funcionam os Níveis</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Seu nível reflete sua experiência total acumulada. Quanto mais XP você ganha, mais alto você sobe na hierarquia.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {levels.map((level, index) => {
                    const nextLevel = levels[index + 1];
                    const xpRange = nextLevel ? `${level.minXP} - ${nextLevel.minXP} XP` : `${level.minXP}+ XP`;
                    
                    return (
                      <div key={level.id} className="group relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent p-1 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-black/40 h-full">
                        <div className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
                        
                        <div className="relative flex h-full flex-col justify-between rounded-xl bg-white dark:bg-black/40 p-5 backdrop-blur-md transition-colors duration-300 group-hover:bg-white/80 dark:group-hover:bg-black/30">
                          {/* Header with Level Badge */}
                          <div className="flex items-center justify-between mb-4 w-full">
                            <div className={`rounded-xl p-2.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0`}>
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-[10px] font-bold text-white overflow-hidden`}>
                                {level.icon?.startsWith("http") ? (
                                  <img src={level.icon} alt="" className="w-full h-full object-cover" />
                                ) : level.icon ? (
                                  <span className="text-sm leading-none">{level.icon}</span>
                                ) : (
                                  level.name.charAt(0)
                                )}
                              </div>
                            </div>
                            <div className="px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm bg-primary/10 border-primary/20 text-primary whitespace-nowrap ml-2 shrink-0">
                              Nível {index + 1}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-start text-left">
                            <h4 className="text-lg font-bold text-foreground mb-2 dark:group-hover:text-white transition-colors break-words">
                              {level.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed dark:group-hover:text-muted-foreground/80 break-words">
                              Faixa de XP: <span className="font-mono font-bold text-foreground">{xpRange}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dica */}
              <div className="glass-card border-l-4 border-primary rounded-xl p-4 mb-8">
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground mb-1 text-sm sm:text-base">Dica:</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Complete conquistas para ganhar pontos extras! Cada conquista tem sua própria recompensa em pontos.</div>
                  </div>
                </div>
              </div>

              

            </GlassCard>
          </TabsContent>

          {/* ABA 3 - MÉTRICAS */}
          <TabsContent value="metricas" className="space-y-6 sm:space-y-8 animate-fade-in">
            <GlassCard>


              {/* Ranking de Pontuação */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-secondary" />
                    <span className="text-foreground">Ranking de Pontuação</span>
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <div className="relative w-full sm:w-auto">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input value={metricsSearch} onChange={(e) => setMetricsSearch(e.target.value)} placeholder="Buscar afiliada..." className="pl-10 w-full sm:w-64 glass-card border-border/50 focus:border-primary transition-all" />
                    </div>
                    <div className="relative glass-card flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-border/50">
                      <Calendar className="w-4 h-4 text-primary" />
                      <button onClick={() => changeMetricsMonth("prev")} className="text-primary hover:scale-110 transition-transform"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-xs sm:text-sm font-medium">{metricsMonthLabel} de {metricsYear}</span>
                      <button onClick={() => changeMetricsMonth("next")} className="text-primary hover:scale-110 transition-transform"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[...metricsAffiliates]
                    .sort((a, b) => b.points - a.points) // Sort globally first to determine true ranks
                    .map((affiliate, index) => ({ ...affiliate, rank: index + 1 })) // Assign true rank
                    .filter(a => a.name.toLowerCase().includes(metricsSearch.toLowerCase())) // Then filter
                    .map((affiliate) => {
                      const { currentLevel, nextLevel, progress } = getLevelInfo(affiliate.points);
                      const isFirstPlace = affiliate.rank === 1; // Use true rank for styling

                      return (
                        <div key={affiliate.id} className={`glass-card-hover rounded-2xl border border-border/50 group relative overflow-hidden transition-all duration-500 ${isFirstPlace ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30 pt-9 pb-5 px-4' : 'p-4'}`}>
                          {/* Efeito de brilho para o primeiro lugar */}
                          {isFirstPlace && (
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                          )}
                          
                          <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap relative z-10">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 transition-all duration-300 relative ${isFirstPlace ? 'bg-yellow-500/20 text-yellow-500 border-2 border-yellow-500' : 'bg-primary/20 text-primary border-2 border-primary/40 group-hover:border-primary'}`}>
                              
                              {isFirstPlace && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                                  <div className="relative">
                                    <Crown 
                                      className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] animate-bounce" 
                                      style={{ 
                                        animationDuration: '2s',
                                        filter: 'drop-shadow(0 0 5px rgba(234, 179, 8, 0.5))' 
                                      }} 
                                    />
                                    <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full animate-pulse" />
                                  </div>
                                </div>
                              )}
                              
                              {affiliate.rank}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className={`font-semibold text-sm sm:text-base ${isFirstPlace ? 'text-yellow-500' : 'text-foreground'}`}>
                                  {affiliate.name}
                                </div>
                                {isFirstPlace && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 font-bold uppercase tracking-wider border border-yellow-500/30">Líder</span>}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1.5">{currentLevel.name}</div>
                              
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground whitespace-nowrap">XP: {affiliate.points}/{nextLevel.minXP}</div>
                                <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${isFirstPlace ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-primary'}`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-center justify-center px-2 sm:px-4 border-l border-border/30 min-w-[90px]">
                              <div className="font-bold text-accent text-base sm:text-lg">{affiliate.posted || 0}</div>
                              <div className="flex gap-2 mt-0.5">
                                <span className="text-xs text-accent" title="Postou">✅{affiliate.posted || 0}</span>
                                <span className="text-xs text-destructive" title="Não Postou">❌{affiliate.notPosted || 0}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 hidden sm:block">Postagens</div>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="text-right min-w-[80px]">
                                <div className={`font-bold text-lg sm:text-xl ${isFirstPlace ? 'text-yellow-500 drop-shadow-sm' : 'text-foreground'}`}>
                                  {affiliate.points} pts
                                </div>
                                <div className="text-xs text-muted-foreground">Total acumulado</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rodapé */}
      <footer className="glass-card text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground mt-8 sm:mt-12 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <Link to="/support" className="hover:text-primary transition-colors smooth-transition">Condições e suporte</Link>
            <span className="hidden sm:inline">|</span>
            <Link to="/privacy" className="hover:text-primary transition-colors smooth-transition">Política de Privacidade</Link>
          </div>
        </div>
      </footer>
      </div>
      {isCalendarOpen && selectedAffiliate && (
        <AffiliateCalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          affiliate={affiliates.find(a => a.id === selectedAffiliate.id) || selectedAffiliate}
          calendarStatuses={calendarStatuses}
          classes={classes}
        />
      )}
    </>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardInner />
    </DashboardLayout>
  );
}
