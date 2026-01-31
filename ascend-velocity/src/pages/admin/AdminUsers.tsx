import { useState, useEffect, useCallback, useMemo, useRef, type Dispatch, type SetStateAction } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Search, MoreVertical, Shield, ShieldAlert, LogIn, Ban, CreditCard, Check, Plus, X, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { usePlansStore } from "@/store/plansStore";
import { getAuthedUser, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { normalizeToolIdList, normalizeToolsDisabledByPage } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  plan: string;
}

type OverridesDraft = {
  add: string[];
  remove: string[];
};

type ToolsDisabledDraft = Record<string, string[]>;

type TeamDetails = {
  teamId: string;
  name: string;
  memberRole: string;
  overrides: OverridesDraft;
};

const AVAILABLE_DASHBOARD_PAGES = [
  { id: "/dashboard", label: "Dashboard (Visão Geral)" },
  { id: "/dashboard/gamification", label: "Gamificação" },
  { id: "/dashboard/sorteios", label: "Sorteios" },
  { id: "/dashboard/roleta", label: "Roleta Criativa" },
  { id: "/dashboard/whatsapp-link", label: "Gerador WhatsApp" },
  { id: "/dashboard/workflows", label: "Mapa Mental" },
  { id: "/dashboard/workflow", label: "Mapa Mental (Editor)" },
  { id: "/dashboard/link-bio", label: "Link na Bio" },
  { id: "/dashboard/settings", label: "Perfil" },
  { id: "/dashboard/ranking", label: "Ranking Global" }
];

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { plans, fetchPlans } = usePlansStore();
  const { user: adminProfile } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingPlanUser, setEditingPlanUser] = useState<User | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userOverridesDraft, setUserOverridesDraft] = useState<OverridesDraft>({ add: [], remove: [] });
  const [userToolsDraft, setUserToolsDraft] = useState<ToolsDisabledDraft>({});
  const [toolInputByPage, setToolInputByPage] = useState<Record<string, string>>({});
  const [savingUserOverrides, setSavingUserOverrides] = useState(false);
  const [userOverridesStatus, setUserOverridesStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [userOverridesStatusText, setUserOverridesStatusText] = useState<string>("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState<string>("");
  const [confirmDialogDescription, setConfirmDialogDescription] = useState<string>("");
  const confirmActionRef = useRef<null | (() => void)>(null);
  const [userTeams, setUserTeams] = useState<TeamDetails[]>([]);
  const [selectedUserPlan, setSelectedUserPlan] = useState<{ name: string | null; allowedPages: string[] | null } | null>(null);

  const [editingTeam, setEditingTeam] = useState<TeamDetails | null>(null);
  const [teamOverridesDraft, setTeamOverridesDraft] = useState<OverridesDraft>({ add: [], remove: [] });
  const [savingTeamOverrides, setSavingTeamOverrides] = useState(false);

  const USER_NEUTRAL_PAGE_ID = "/dashboard/settings";

  const userOverridesDraftRef = useRef<OverridesDraft>(userOverridesDraft);
  const userToolsDraftRef = useRef<ToolsDisabledDraft>(userToolsDraft);
  const userOverridesDirtyRef = useRef(false);
  const userOverridesInFlightRef = useRef(false);
  const userOverridesDebounceRef = useRef<number | null>(null);
  const userOverridesLastSuccessToastAtRef = useRef(0);
  const userOverridesServerSnapshotRef = useRef<{ add: string[]; remove: string[]; tools: ToolsDisabledDraft } | null>(null);
  const userOverridesRealtimeConfirmedRef = useRef(false);
  const flushUserOverridesSaveRef = useRef<(opts?: { force?: boolean; silentSuccess?: boolean }) => void>(() => {
    return;
  });

  useEffect(() => {
    userOverridesRealtimeConfirmedRef.current = false;
    userOverridesDirtyRef.current = false;
    userOverridesInFlightRef.current = false;
    userOverridesServerSnapshotRef.current = null;
    setUserOverridesStatus("idle");
    setUserOverridesStatusText("");

    if (userOverridesDebounceRef.current) {
      window.clearTimeout(userOverridesDebounceRef.current);
      userOverridesDebounceRef.current = null;
    }
  }, [selectedUser?.id]);

  useEffect(() => {
    userOverridesDraftRef.current = userOverridesDraft;
  }, [userOverridesDraft]);

  useEffect(() => {
    userToolsDraftRef.current = userToolsDraft;
  }, [userToolsDraft]);

  const setConfirmDialog = useCallback((args: { title: string; description: string; onConfirm: () => void }) => {
    confirmActionRef.current = args.onConfirm;
    setConfirmDialogTitle(args.title);
    setConfirmDialogDescription(args.description);
    setConfirmDialogOpen(true);
  }, []);

  const markUserOverridesDirty = useCallback((opts?: { immediate?: boolean; silentSuccess?: boolean }) => {
    userOverridesDirtyRef.current = true;
    setUserOverridesStatus("dirty");
    setUserOverridesStatusText("Alterações pendentes");

    if (userOverridesDebounceRef.current) {
      window.clearTimeout(userOverridesDebounceRef.current);
      userOverridesDebounceRef.current = null;
    }

    const delay = opts?.immediate ? 0 : 350;
    userOverridesDebounceRef.current = window.setTimeout(() => {
      userOverridesDebounceRef.current = null;
      flushUserOverridesSaveRef.current({ silentSuccess: opts?.silentSuccess ?? false });
    }, delay);
  }, []);

  const applyUserOverridesChange = useCallback(
    (apply: () => void) => {
      if (detailsLoading) return;

      const run = () => {
        apply();
        markUserOverridesDirty();
      };

      if (userOverridesRealtimeConfirmedRef.current) {
        run();
        return;
      }

      setConfirmDialog({
        title: "Salvar permissões em tempo real?",
        description:
          "As alterações serão aplicadas imediatamente e salvas automaticamente (sem botão Salvar). Você poderá alternar permissões rapidamente.",
        onConfirm: () => {
          userOverridesRealtimeConfirmedRef.current = true;
          run();
        },
      });
    },
    [detailsLoading, markUserOverridesDirty, setConfirmDialog],
  );

  const normalizeOverridesDraft = useCallback((draft: OverridesDraft) => {
    const uniq = (items: string[]) => Array.from(new Set(items.filter((v) => typeof v === "string" && v.trim().length > 0)));
    return { add: uniq(draft.add), remove: uniq(draft.remove) };
  }, []);

  const formatOverridesError = useCallback((message: string) => {
    const key = message.split(":")[0]?.trim() ?? message;
    if (key === "not_authenticated") return "Sessão expirada. Faça login novamente.";
    if (key === "missing_auth") return "Sessão expirada. Faça login novamente.";
    if (key === "invalid_auth") return "Sessão expirada. Faça login novamente.";
    if (key === "forbidden") return "Apenas administradores podem alterar permissões.";
    if (key === "overlapping_permissions") return "Uma página não pode estar em adicionar e remover ao mesmo tempo.";
    if (key === "allowed_pages_add_remove_overlap") return "Uma página não pode estar em adicionar e remover ao mesmo tempo.";
    if (key === "invalid_dashboard_path") return "Caminho inválido. Use apenas páginas do dashboard.";
    if (key === "invalid_tool_overrides") return "Configuração de ferramentas inválida.";
    if (key === "missing_body") return "Requisição inválida. Tente novamente.";
    if (key === "invalid_json") return "Requisição inválida. Tente novamente.";
    if (key === "invalid_body") return "Requisição inválida. Tente novamente.";
    if (key === "missing_user_id") return "Usuário não identificado.";
    if (key === "missing_team_id") return "Equipe não identificada.";
    if (key === "user_not_found") return "Usuário não encontrado.";
    if (key === "profile_update_failed") return "Não foi possível salvar as permissões agora.";
    if (key === "rate_limited") return "Muitas tentativas. Aguarde um momento.";
    if (key === "rate_limit_unavailable") return "Serviço temporariamente indisponível. Tente novamente.";
    if (key === "internal_error") return "Erro interno ao salvar permissões. Tente novamente.";
    return message;
  }, []);

  const getErrorMessage = useCallback((err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;

    if (typeof err === "object" && err !== null) {
      const anyErr = err as any;
      const message = typeof anyErr.message === "string" ? anyErr.message : "";
      const details = typeof anyErr.details === "string" ? anyErr.details : "";
      const hint = typeof anyErr.hint === "string" ? anyErr.hint : "";

      const parts = [message, details, hint].map((v) => v.trim()).filter(Boolean);
      if (parts.length > 0) return parts.join(" - ");

      try {
        return JSON.stringify(err);
      } catch {
        return "Erro desconhecido";
      }
    }

    return String(err);
  }, []);

  const normalizeInvokeErrorMessage = useCallback(async (err: unknown) => {
    const baseMessage = getErrorMessage(err);
    const context = typeof err === "object" && err !== null && "context" in err ? (err as any).context : null;

    if (context && typeof context.text === "function") {
      try {
        const raw = await context.text();
        if (raw) {
          let parsed: unknown = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = null;
          }

          if (parsed && typeof parsed === "object") {
            const maybeError = (parsed as any).error;
            const maybeDetails = (parsed as any).details;
            if (typeof maybeError === "string" && maybeError.trim().length > 0) {
              if (typeof maybeDetails === "string" && maybeDetails.trim().length > 0) {
                return `${maybeError}: ${maybeDetails}`;
              }
              return maybeError;
            }
          }

          return raw;
        }
      } catch {
        return baseMessage;
      }
    }

    return baseMessage;
  }, [getErrorMessage]);

  const flushUserOverridesSave = useCallback(
    async (opts?: { force?: boolean; silentSuccess?: boolean }) => {
      if (!selectedUser?.id) return;
      if (!adminProfile || adminProfile.role !== "admin") return;
      if (detailsLoading) return;

      if (!opts?.force && !userOverridesDirtyRef.current) return;
      if (userOverridesInFlightRef.current) return;

      const normalizedDraft = normalizeOverridesDraft(userOverridesDraftRef.current);
      const add = Array.from(new Set(normalizedDraft.add));
      const remove = Array.from(new Set(normalizedDraft.remove));
      const overlap = add.find((p) => remove.includes(p));
      if (overlap) {
        setUserOverridesStatus("error");
        setUserOverridesStatusText("Conflito: uma página está em adicionar e remover");
        toast.error("Erro ao salvar permissões", {
          description: "Uma página não pode estar em adicionar e remover ao mesmo tempo.",
        });
        return;
      }

      const toolsDisabledByPage = normalizeToolsDisabledByPage(userToolsDraftRef.current);

      userOverridesInFlightRef.current = true;
      userOverridesDirtyRef.current = false;
      setSavingUserOverrides(true);
      setUserOverridesStatus("saving");
      setUserOverridesStatusText("Salvando...");

      try {
        const adminUser = await getAuthedUser();
        if (!adminUser) throw new Error("not_authenticated");

        const { data, error } = await supabase.functions.invoke("admin-access-overrides", {
          body: {
            action: "set_user_overrides",
            userId: selectedUser.id,
            overrides: {
              allowedPagesAdd: add,
              allowedPagesRemove: remove,
              toolsDisabledByPage,
            },
          },
        });

        if (error) {
          throw new Error(await normalizeInvokeErrorMessage(error));
        }

        if (data && typeof data === "object" && "error" in (data as any) && (data as any).error) {
          const rawError = String((data as any).error);
          const rawDetails = (data as any).details;
          if (typeof rawDetails === "string" && rawDetails.trim().length > 0) {
            throw new Error(`${rawError}: ${rawDetails}`);
          }
          throw new Error(rawError);
        }

        const updatedProfile = (data as any)?.profile as
          | { allowed_pages_add?: string[] | null; allowed_pages_remove?: string[] | null; dashboard_config?: any }
          | undefined;

        if (updatedProfile) {
          const nextDraft = {
            add: Array.from(new Set(updatedProfile.allowed_pages_add ?? [])),
            remove: Array.from(new Set(updatedProfile.allowed_pages_remove ?? [])),
          };

          userOverridesDraftRef.current = nextDraft;
          setUserOverridesDraft(nextDraft);

          const toolsRaw = (updatedProfile as any)?.dashboard_config?.access_overrides?.tools_disabled;
          const nextTools = normalizeToolsDisabledByPage(toolsRaw);
          userToolsDraftRef.current = nextTools;
          setUserToolsDraft(nextTools);

          userOverridesServerSnapshotRef.current = { add: nextDraft.add, remove: nextDraft.remove, tools: nextTools };
        }

        setUserOverridesStatus("saved");
        setUserOverridesStatusText("Salvo");

        const now = Date.now();
        if (!opts?.silentSuccess && now - userOverridesLastSuccessToastAtRef.current > 3000) {
          userOverridesLastSuccessToastAtRef.current = now;
          toast.success("Permissões atualizadas");
        }
      } catch (e) {
        const message = getErrorMessage(e);
        setUserOverridesStatus("error");
        setUserOverridesStatusText("Erro ao salvar");
        toast.error("Erro ao salvar permissões", { description: formatOverridesError(message) });

        const snapshot = userOverridesServerSnapshotRef.current;
        if (snapshot) {
          userOverridesDraftRef.current = { add: snapshot.add, remove: snapshot.remove };
          userToolsDraftRef.current = snapshot.tools;
          setUserOverridesDraft({ add: snapshot.add, remove: snapshot.remove });
          setUserToolsDraft(snapshot.tools);
        } else {
          userOverridesDirtyRef.current = true;
        }
      } finally {
        userOverridesInFlightRef.current = false;
        setSavingUserOverrides(false);
        if (userOverridesDirtyRef.current) {
          if (userOverridesDebounceRef.current) {
            window.clearTimeout(userOverridesDebounceRef.current);
            userOverridesDebounceRef.current = null;
          }

          userOverridesDebounceRef.current = window.setTimeout(() => {
            userOverridesDebounceRef.current = null;
            flushUserOverridesSaveRef.current({ silentSuccess: true });
          }, 0);
        }
      }
    },
    [
      adminProfile,
      detailsLoading,
      formatOverridesError,
      getErrorMessage,
      normalizeInvokeErrorMessage,
      normalizeOverridesDraft,
      selectedUser?.id,
    ],
  );

  useEffect(() => {
    flushUserOverridesSaveRef.current = (opts) => {
      void flushUserOverridesSave(opts);
    };
  }, [flushUserOverridesSave]);

  useEffect(() => {
    return () => {
      if (userOverridesDebounceRef.current) {
        window.clearTimeout(userOverridesDebounceRef.current);
        userOverridesDebounceRef.current = null;
      }
    };
  }, []);

  

  const fetchUsers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_admin_users", {
        p_search: query,
        p_limit: 200,
        p_offset: 0
      });

      if (error) throw error;

      const rows = (Array.isArray(data) ? data : []) as any[];
      setUsers(
        rows.map((u) => ({
          id: String(u.id),
          name: String(u.full_name ?? "Sem nome"),
          email: String(u.email ?? ""),
          role: String(u.role ?? "member"),
          status: String(u.status ?? "active"),
          plan: String(u.plan_name ?? "Free")
        })),
      );
    } catch (e) {
      const message = getErrorMessage(e);
      toast.error(`Erro ao carregar usuários: ${message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [getErrorMessage]);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);

    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    void fetchUsers(debouncedSearch);
  }, [debouncedSearch, fetchUsers]);

  useEffect(() => {
    if (!selectedUser?.id) return;

    let cancelled = false;
    setDetailsLoading(true);

    const uniq = (items: string[]) => Array.from(new Set(items.filter((v) => typeof v === "string" && v.trim().length > 0)));

    const load = async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, allowed_pages_add, allowed_pages_remove, dashboard_config")
        .eq("id", selectedUser.id)
        .maybeSingle();

      if (cancelled) return;
      if (profileError) throw profileError;

      setUserOverridesDraft({
        add: uniq((((profile as any)?.allowed_pages_add as string[] | null | undefined) ?? [])),
        remove: uniq((((profile as any)?.allowed_pages_remove as string[] | null | undefined) ?? []))
      });

      const toolsRaw = (profile as any)?.dashboard_config?.access_overrides?.tools_disabled;
      setUserToolsDraft(normalizeToolsDisabledByPage(toolsRaw));

      const { data: subscriptionRow, error: subError } = await supabase
        .from("subscriptions")
        .select("status, plan:plans(name, allowed_pages)")
        .eq("user_id", selectedUser.id)
        .in("status", ["active", "trialing", "past_due"])
        .maybeSingle();
      if (cancelled) return;
      if (subError) throw subError;

      const planName = (subscriptionRow as any)?.plan?.name ? String((subscriptionRow as any).plan.name) : null;
      const planAllowedPagesRaw = (subscriptionRow as any)?.plan?.allowed_pages as string[] | null | undefined;
      const planAllowedPages = Array.isArray(planAllowedPagesRaw) ? uniq(planAllowedPagesRaw) : null;

      if (planName) {
        setSelectedUserPlan({ name: planName, allowedPages: planAllowedPages });
      } else {
        const freePlan = plans.find((p) => p.name === "Free" || p.price === 0);
        setSelectedUserPlan({ name: freePlan?.name ?? "Free", allowedPages: freePlan?.allowedPages ?? null });
      }

      const { data: memberships, error: membersError } = await supabase
        .from("team_members")
        .select("team_id, role, team:teams(id, name)")
        .eq("user_id", selectedUser.id);

      if (cancelled) return;
      if (membersError) throw membersError;

      const list = (((memberships as any) ?? []) as any[]).map((m) => ({
        teamId: String(m.team_id),
        name: String(m.team?.name ?? m.team_id),
        memberRole: String(m.role ?? "member")
      }));

      const teamIds = uniq(list.map((t) => t.teamId));
      const overridesMap: Record<string, OverridesDraft> = {};

      if (teamIds.length > 0) {
        const { data: overridesRows, error: overridesError } = await supabase
          .from("team_access_overrides")
          .select("team_id, allowed_pages_add, allowed_pages_remove")
          .in("team_id", teamIds);

        if (cancelled) return;
        if (overridesError) throw overridesError;

        (((overridesRows as any) ?? []) as any[]).forEach((row) => {
          overridesMap[String(row.team_id)] = {
            add: uniq((((row as any).allowed_pages_add as string[] | null | undefined) ?? [])),
            remove: uniq((((row as any).allowed_pages_remove as string[] | null | undefined) ?? []))
          };
        });
      }

      setUserTeams(
        list.map((t) => ({
          ...t,
          overrides: overridesMap[t.teamId] ?? { add: [], remove: [] }
        })),
      );
    };

    load()
      .catch((e) => {
        const message = getErrorMessage(e);
        toast.error(`Erro ao carregar permissões: ${message}`);
        setUserOverridesDraft({ add: [], remove: [] });
      setUserToolsDraft({});
        setUserTeams([]);
        setSelectedUserPlan(null);
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [getErrorMessage, plans, selectedUser?.id]);

  const normalizePath = (path: string) => {
    if (path.startsWith("/dashboard/workflow")) return "/dashboard/workflow";
    return path;
  };

  const hasWildcard = (paths: string[] | null | undefined) => Array.isArray(paths) && paths.includes("*");

  const pathMatches = (normalizedPath: string, pageId: string) => {
    if (pageId === "/dashboard") return normalizedPath === "/dashboard";
    return normalizedPath === pageId || normalizedPath.startsWith(`${pageId}/`);
  };

  const isIncludedInPlan = (pageId: string) => {
    const normalized = normalizePath(pageId);
    const allowedPages = selectedUserPlan?.allowedPages ?? null;
    if (!allowedPages) return true;
    if (hasWildcard(allowedPages)) return true;
    return allowedPages.some((p) => pathMatches(normalized, normalizePath(p)));
  };

  const setAllAccess = (setter: Dispatch<SetStateAction<OverridesDraft>>, enabled: boolean) => {
    setter((prev) => {
      const addSet = new Set(prev.add);
      const removeSet = new Set(prev.remove);
      if (enabled) addSet.add("*");
      else addSet.delete("*");
      removeSet.delete("*");
      return { add: Array.from(addSet), remove: Array.from(removeSet) };
    });
  };

  const setAllRemoved = (setter: Dispatch<SetStateAction<OverridesDraft>>, enabled: boolean) => {
    setter((prev) => {
      const addSet = new Set(prev.add);
      const removeSet = new Set(prev.remove);
      if (enabled) removeSet.add("*");
      else removeSet.delete("*");
      addSet.delete("*");
      return { add: Array.from(addSet), remove: Array.from(removeSet) };
    });
  };

  const toggleOverride = (
    setter: Dispatch<SetStateAction<OverridesDraft>>,
    target: "add" | "remove",
    path: string,
  ) => {
    setter((prev) => {
      const addSet = new Set(prev.add);
      const removeSet = new Set(prev.remove);

      if (target === "add") {
        if (addSet.has(path)) {
          addSet.delete(path);
        } else {
          addSet.add(path);
          removeSet.delete(path);
        }
      } else {
        if (removeSet.has(path)) {
          removeSet.delete(path);
        } else {
          removeSet.add(path);
          addSet.delete(path);
        }
      }

      return { add: Array.from(addSet), remove: Array.from(removeSet) };
    });
  };

  const setToolInput = (pageKey: string, value: string) => {
    const page = String(pageKey).trim();
    if (!page) return;
    setToolInputByPage((prev) => ({ ...prev, [page]: value }));
  };

  const addToolsToPage = (pageKey: string) => {
    const page = String(pageKey).trim();
    if (!page) return;
    if (page !== "*" && !page.startsWith("/dashboard")) return;

    const raw = toolInputByPage[page] ?? "";
    const toAdd = normalizeToolIdList(raw);
    if (toAdd.length === 0) return;

    setUserToolsDraft((prev) => {
      const existing = prev[page] ?? [];
      const merged = normalizeToolIdList([...existing, ...toAdd].join("\n"));
      const next = { ...prev };
      if (merged.length === 0) {
        delete next[page];
      } else {
        next[page] = merged;
      }
      return next;
    });

    setToolInputByPage((prev) => ({ ...prev, [page]: "" }));
  };

  const removeToolFromPage = (pageKey: string, toolId: string) => {
    const page = String(pageKey).trim();
    if (!page) return;
    setUserToolsDraft((prev) => {
      const existing = prev[page] ?? [];
      const nextList = existing.filter((t) => t !== toolId);
      const next = { ...prev };
      if (nextList.length === 0) {
        delete next[page];
      } else {
        next[page] = nextList;
      }
      return next;
    });
  };

  const saveUserOverrides = async () => {
    if (!selectedUser?.id) return;
    setSavingUserOverrides(true);
    try {
      if (!adminProfile || adminProfile.role !== "admin") throw new Error("forbidden");
      const adminUser = await getAuthedUser();
      if (!adminUser) throw new Error("not_authenticated");

      const add = Array.from(new Set(userOverridesDraft.add));
      const remove = Array.from(new Set(userOverridesDraft.remove));
      const overlap = add.find((p) => remove.includes(p));
      if (overlap) throw new Error("overlapping_permissions");

      const { data, error } = await supabase.functions.invoke("admin-access-overrides", {
        body: {
          action: "set_user_overrides",
          userId: selectedUser.id,
          overrides: {
            allowedPagesAdd: add,
            allowedPagesRemove: remove,
            toolsDisabledByPage: normalizeToolsDisabledByPage(userToolsDraft)
          }
        }
      });

      if (error) {
        throw new Error(await normalizeInvokeErrorMessage(error));
      }

      if (data && typeof data === "object" && "error" in (data as any) && (data as any).error) {
        const rawError = String((data as any).error);
        const rawDetails = (data as any).details;
        if (typeof rawDetails === "string" && rawDetails.trim().length > 0) {
          throw new Error(`${rawError}: ${rawDetails}`);
        }
        throw new Error(rawError);
      }

      const updatedProfile = (data as any)?.profile as
        | { allowed_pages_add?: string[] | null; allowed_pages_remove?: string[] | null; dashboard_config?: any }
        | undefined;

      if (updatedProfile) {
        setUserOverridesDraft({
          add: Array.from(new Set(updatedProfile.allowed_pages_add ?? [])),
          remove: Array.from(new Set(updatedProfile.allowed_pages_remove ?? []))
        });

        const toolsRaw = (updatedProfile as any)?.dashboard_config?.access_overrides?.tools_disabled;
        setUserToolsDraft(normalizeToolsDisabledByPage(toolsRaw));
      }

      toast.success("Permissões do usuário atualizadas");
    } catch (e) {
      const message = getErrorMessage(e);
      toast.error(`Erro ao salvar permissões: ${formatOverridesError(message)}`);
    } finally {
      setSavingUserOverrides(false);
    }
  };

  const openTeamOverrides = (team: TeamDetails) => {
    setEditingTeam(team);
    setTeamOverridesDraft({ add: team.overrides.add ?? [], remove: team.overrides.remove ?? [] });
  };

  const saveTeamOverrides = async () => {
    if (!editingTeam?.teamId) return;
    setSavingTeamOverrides(true);
    try {
      if (!adminProfile || adminProfile.role !== "admin") throw new Error("forbidden");
      const adminUser = await getAuthedUser();
      if (!adminUser) throw new Error("not_authenticated");

      const add = Array.from(new Set(teamOverridesDraft.add));
      const remove = Array.from(new Set(teamOverridesDraft.remove));
      const overlap = add.find((p) => remove.includes(p));
      if (overlap) throw new Error("overlapping_permissions");

      const { data: before, error: beforeError } = await supabase
        .from("team_access_overrides")
        .select("allowed_pages_add, allowed_pages_remove")
        .eq("team_id", editingTeam.teamId)
        .maybeSingle();
      if (beforeError) throw beforeError;

      const { error: upsertError } = await supabase
        .from("team_access_overrides")
        .upsert(
          {
            team_id: editingTeam.teamId,
            allowed_pages_add: add,
            allowed_pages_remove: remove,
            updated_at: new Date().toISOString()
          },
          { onConflict: "team_id" },
        );
      if (upsertError) throw upsertError;

      await supabase.rpc("insert_audit_log", {
        actor_id: adminUser.id,
        entity_table: "team_access_overrides",
        entity_id: editingTeam.teamId,
        action: "admin_access_overrides_set_team",
        old_data: {
          allowed_pages_add: ((before as any)?.allowed_pages_add as string[] | null | undefined) ?? [],
          allowed_pages_remove: ((before as any)?.allowed_pages_remove as string[] | null | undefined) ?? []
        },
        new_data: { allowed_pages_add: add, allowed_pages_remove: remove }
      });

      setUserTeams((prev) =>
        prev.map((t) => (t.teamId === editingTeam.teamId ? { ...t, overrides: { add, remove } } : t)),
      );
      setEditingTeam(null);
      toast.success("Permissões da equipe atualizadas");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Erro ao salvar permissões da equipe: ${formatOverridesError(message)}`);
    } finally {
      setSavingTeamOverrides(false);
    }
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    try {
      if (!adminProfile || adminProfile.role !== "admin") throw new Error("forbidden");
      if (adminProfile.id === id && newRole === "member") {
        toast.error("Você não pode remover seu próprio acesso de administrador");
        return;
      }
      const adminUser = await getAuthedUser();
      if (!adminUser) throw new Error("not_authenticated");

      const { data: before, error: beforeError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", id)
        .maybeSingle();
      if (beforeError) throw beforeError;

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);

      if (error) throw error;

      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      if (selectedUser?.id === id) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }

      await supabase.rpc("insert_audit_log", {
        actor_id: adminUser.id,
        entity_table: "profiles",
        entity_id: id,
        action: "admin_role_updated",
        old_data: { role: (before as any)?.role ?? currentRole },
        new_data: { role: newRole }
      });
      toast.success(`Permissão alterada para ${newRole}!`);
    } catch (error) {
      console.error('Error updating role:', error);
      const message = error instanceof Error ? error.message : String(error);
      const friendly = message === "forbidden" ? "Apenas administradores podem alterar permissões." : "Erro ao alterar permissão";
      toast.error(friendly);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    try {
      if (!adminProfile || adminProfile.role !== "admin") throw new Error("forbidden");
      if (adminProfile.id === id) {
        toast.error("Você não pode bloquear seu próprio acesso");
        return;
      }
      const adminUser = await getAuthedUser();
      if (!adminUser) throw new Error("not_authenticated");

      const { data: before, error: beforeError } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", id)
        .maybeSingle();
      if (beforeError) throw beforeError;

      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
      if (selectedUser?.id === id) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }

      await supabase.rpc("insert_audit_log", {
        actor_id: adminUser.id,
        entity_table: "profiles",
        entity_id: id,
        action: "admin_status_updated",
        old_data: { status: (before as any)?.status ?? currentStatus },
        new_data: { status: newStatus }
      });
      toast.success(`Status alterado para ${newStatus === 'active' ? 'Ativo' : 'Bloqueado'}!`);
    } catch (error) {
      console.error('Error updating status:', error);
      const message = error instanceof Error ? error.message : String(error);
      const friendly = message === "forbidden" ? "Apenas administradores podem alterar status." : "Erro ao alterar status";
      toast.error(friendly);
    }
  };

  const changePlan = async (userId: string, planId: string | null, newPlanName: string) => {
    try {
      const normalizeInvokeErrorMessage = async (err: unknown) => {
        const baseMessage = err instanceof Error ? err.message : String(err);
        const context = typeof err === "object" && err !== null && "context" in err ? (err as any).context : null;

        if (context && typeof context.text === "function") {
          try {
            const raw = await context.text();
            if (raw) {
              let parsed: unknown = null;
              try {
                parsed = JSON.parse(raw);
              } catch (e) {
                parsed = null;
              }

              if (parsed && typeof parsed === "object") {
                const maybeError = (parsed as any).error;
                const maybeDetails = (parsed as any).details;
                if (typeof maybeError === "string" && maybeError.trim().length > 0) {
                  if (typeof maybeDetails === "string" && maybeDetails.trim().length > 0) {
                    return `${maybeError}: ${maybeDetails}`;
                  }
                  return maybeError;
                }
              }

              return raw;
            }
          } catch (e) {
            return baseMessage;
          }
        }

        return baseMessage;
      };

      const invokeAdminStripeSubscription = async (payload: Record<string, unknown>) => {
        try {
          const { data, error } = await supabase.functions.invoke("admin-stripe-subscription", {
            body: payload
          });

          if (error) {
            throw new Error(await normalizeInvokeErrorMessage(error));
          }

          if (data && typeof data === "object" && "error" in (data as any) && (data as any).error) {
            throw new Error(String((data as any).error));
          }

          return data;
        } catch (err) {
          throw new Error(await normalizeInvokeErrorMessage(err));
        }
      };

      if (planId) {
        const res = await invokeAdminStripeSubscription({
          action: "change_plan",
          userId,
          planId,
          returnUrl: `${window.location.origin}/admin/users`
        });

        if (res && typeof res === "object" && (res as any).code === "missing_payment_method") {
          const portalUrl = (res as any).portalUrl as string | undefined;
          toast.error("O usuário precisa adicionar um método de pagamento.", {
            description: portalUrl ? "Abra o portal do Stripe para adicionar um cartão." : undefined,
            action: portalUrl
              ? {
                  label: "Abrir portal",
                  onClick: () => window.open(portalUrl, "_blank", "noreferrer")
                }
              : undefined
          });
          return;
        }
      } else {
        await invokeAdminStripeSubscription({
          action: "cancel",
          userId
        });
      }

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlanName } : u));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, plan: newPlanName });
      }

      if (editingPlanUser && editingPlanUser.id === userId) {
        setEditingPlanUser({ ...editingPlanUser, plan: newPlanName });
      }

      await fetchUsers(debouncedSearch);

      toast.success(`Plano alterado para ${newPlanName}`);
    } catch (error) {
      console.error('Error updating plan:', error);
      const message = error instanceof Error ? error.message : String(error);

      let friendlyMessage = message;
      if (message.includes("missing_auth") || message.includes("invalid_auth")) friendlyMessage = "Sessão expirada. Faça login novamente.";
      if (message.includes("forbidden")) friendlyMessage = "Você não tem permissão de administrador para essa ação.";
      if (message.includes("rate_limited")) friendlyMessage = "Muitas solicitações. Tente novamente em alguns segundos.";
      if (message.includes("plan_not_found")) friendlyMessage = "Plano não encontrado.";
      if (message.includes("plan_without_gateway_id")) friendlyMessage = "O plano selecionado não possui ID do Stripe (price).";
      if (message.includes("stripe_not_configured")) friendlyMessage = "Stripe não está configurado no servidor.";
      if (message.toLowerCase().includes("no such price")) friendlyMessage = "O ID do preço do Stripe é inválido ou não existe neste ambiente.";
      if (message.toLowerCase().includes("no such customer")) friendlyMessage = "Cliente Stripe não encontrado para este usuário.";

      toast.error(`Erro ao alterar plano: ${friendlyMessage}`);
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      toast.loading("Gerando acesso...", { id: "impersonate" });
      const { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: { userId }
      });

      if (error) throw error;
      
      const link = data?.link;
      if (!link) throw new Error("Link não gerado");

      // Adiciona o redirect para o dashboard
      const url = new URL(link);
      url.searchParams.set("redirect_to", `${window.location.origin}/dashboard`);
      
      // Abre em aba anônima (sugestão) ou nova aba
      window.open(url.toString(), '_blank');
      
      toast.success("Acesso gerado! Link aberto em nova aba.", { id: "impersonate" });
      toast.info("Use uma janela anônima se não quiser sair da sua conta admin.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar acesso", { id: "impersonate" });
    }
  };

  const filteredUsers = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Usuários</h1>
          <p className="text-muted-foreground">Gerencie acessos e permissões.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuário..."
            className="w-full bg-muted/10 border border-border rounded-xl pl-10 pr-4 py-2 focus:border-purple-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <GlassCard className="p-6 text-center text-muted-foreground">Carregando usuários...</GlassCard>
        ) : filteredUsers.length === 0 ? (
          <GlassCard className="p-6 text-center text-muted-foreground">Nenhum usuário encontrado.</GlassCard>
        ) : (
          filteredUsers.map((user) => (
          <GlassCard key={user.id} className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex flex-shrink-0 items-center justify-center text-white font-bold text-lg">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold flex items-center gap-2 truncate">
                  {user.name}
                  {user.role === "admin" && <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400 fill-purple-400/20 flex-shrink-0" />}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-muted/20 border border-border whitespace-nowrap">
                  <span className="text-muted-foreground">Plano:</span>
                  <span className="text-foreground font-semibold">{user.plan}</span>
                </div>

                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase whitespace-nowrap ${
                  user.status === 'active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
                    : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                }`}>
                  {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-muted/10 transition-colors ml-auto sm:ml-0 self-end sm:self-center">
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-border">
                  <DropdownMenuLabel>Ações da Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  
                  <DropdownMenuItem 
                    className="cursor-pointer gap-2"
                    onClick={() => setEditingPlanUser(user)}
                  >
                    <CreditCard className="w-4 h-4" />
                    Gerenciar Plano
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => toggleRole(user.id, user.role)} className="cursor-pointer gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    {user.role === "admin" ? "Remover Admin" : "Tornar Admin"}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => toggleStatus(user.id, user.status)} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                    <Ban className="w-4 h-4" />
                    {user.status === "active" ? "Bloquear Acesso" : "Desbloquear"}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="cursor-pointer gap-2"
                    onClick={() => handleImpersonate(user.id)}
                  >
                    <LogIn className="w-4 h-4" />
                    Acessar Conta
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    className="cursor-pointer gap-2"
                    onClick={() => setSelectedUser(user)}
                  >
                    <Search className="w-4 h-4" />
                    Ver detalhes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </GlassCard>
          ))
        )}
      </div>

      {/* Modal de Detalhes do Usuário */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 border-border rounded-2xl p-4 sm:p-6 gap-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                {selectedUser?.name.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{selectedUser?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>
            <DialogDescription className="sr-only">Gerencie permissões e equipes do usuário selecionado.</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm bg-muted/20 p-3 rounded-xl border border-border">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Plano atual</p>
                  <p className="font-medium">{selectedUser.plan}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Status</p>
                  <p className="font-medium">
                    {selectedUser.status === "active" ? "Ativo" : selectedUser.status === "blocked" ? "Bloqueado" : selectedUser.status}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Tipo de acesso</p>
                  <p className="font-medium">{selectedUser.role === "admin" ? "Administrador" : "Membro"}</p>
                </div>
              </div>

              <div className="space-y-4">
                {detailsLoading ? (
                  <div className="py-6 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Carregando permissões...
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissões extras (usuário)</div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {userOverridesStatus === "saving" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : userOverridesStatus === "saved" ? (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : userOverridesStatus === "error" ? (
                          <X className="w-4 h-4 text-destructive" />
                        ) : null}
                        <span>{userOverridesStatusText}</span>
                      </div>

                      {userOverridesDraft.add.some(id => !isIncludedInPlan(id)) && (
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                          <ShieldAlert className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                          <div className="text-sm text-yellow-700 dark:text-yellow-400">
                            <p className="font-semibold">Atenção: Permissões fora do plano</p>
                            <p>Você está concedendo acesso a páginas que não fazem parte do plano <strong>{selectedUserPlan?.name}</strong>. O usuário terá acesso independentemente do plano.</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card/50 p-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">Liberar todas as páginas</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            Plano: {selectedUserPlan?.name ?? selectedUser.plan}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Label htmlFor="user-all-access" className="sr-only">
                            Liberar todas as páginas
                          </Label>
                          <Switch
                            id="user-all-access"
                            checked={userOverridesDraft.add.includes("*")}
                            onCheckedChange={(checked) =>
                              applyUserOverridesChange(() => setAllAccess(setUserOverridesDraft, !!checked))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {AVAILABLE_DASHBOARD_PAGES.map((page) => {
                          const selected = userOverridesDraft.add.includes(page.id);
                          const allAllowed = userOverridesDraft.add.includes("*");
                          const inPlan = isIncludedInPlan(page.id);

                          const handleToggle = () => {
                            const isAdding = !selected;
                            applyUserOverridesChange(() => {
                              toggleOverride(setUserOverridesDraft, "add", page.id);
                            });
                            if (isAdding && !inPlan) {
                              toast.warning("Atenção: Fora do plano", {
                                description: "Esta página não faz parte do plano do usuário.",
                                duration: 3000
                              });
                            }
                          };

                          return (
                            <div
                              key={`add:${page.id}`}
                              onClick={handleToggle}
                              onKeyDown={(e) => {
                                if (allAllowed) return;
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleToggle();
                                }
                              }}
                              role="button"
                              tabIndex={allAllowed ? -1 : 0}
                              aria-disabled={allAllowed}
                              className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                                selected
                                  ? "bg-primary/5 border-primary/20"
                                  : "bg-card border-border hover:border-primary/20 hover:bg-muted/50"
                              } ${allAllowed ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={handleToggle}
                                  onClick={(e) => e.stopPropagation()}
                                  disabled={allAllowed}
                                  className="mt-1"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                                    <div className="text-sm font-medium truncate">{page.label}</div>
                                    <div
                                      className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                        inPlan
                                          ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                                          : "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                                      }`}
                                    >
                                      {inPlan ? "No plano" : "Fora do plano"}
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">{page.id}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissões removidas (usuário)</div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card/50 p-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">Revogar todas as páginas</div>
                          <div className="text-[10px] text-muted-foreground truncate">Bloqueia todas as páginas do dashboard</div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Label htmlFor="user-all-block" className="sr-only">
                            Revogar todas as páginas
                          </Label>
                          <Switch
                            id="user-all-block"
                            checked={userOverridesDraft.remove.includes("*")}
                            onCheckedChange={(checked) =>
                              applyUserOverridesChange(() => setAllRemoved(setUserOverridesDraft, !!checked))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {AVAILABLE_DASHBOARD_PAGES.map((page) => {
                          const allAllowed = userOverridesDraft.remove.includes("*");
                          const selected = allAllowed || userOverridesDraft.remove.includes(page.id);
                          const handleToggle = () => {
                            if (allAllowed) return;
                            applyUserOverridesChange(() => {
                              toggleOverride(setUserOverridesDraft, "remove", page.id);
                            });
                          };
                          return (
                            <div
                              key={`remove:${page.id}`}
                              onClick={handleToggle}
                              onKeyDown={(e) => {
                                if (allAllowed) return;
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleToggle();
                                }
                              }}
                              role="button"
                              tabIndex={allAllowed ? -1 : 0}
                              aria-disabled={allAllowed}
                              className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                                selected
                                  ? "bg-red-500/10 border-red-500/20"
                                  : "bg-card border-border hover:border-red-500/20 hover:bg-muted/50"
                              } ${allAllowed ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={handleToggle}
                                  onClick={(e) => e.stopPropagation()}
                                  disabled={allAllowed}
                                  className="mt-1"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium truncate">{page.label}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">{page.id}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ferramentas desativadas (usuário)</div>
                      <div className="text-[11px] text-muted-foreground">
                        Use IDs de botões/inputs (ex: o atributo <span className="font-mono">id</span>). Um por linha ou separado por vírgula.
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-xl border border-border bg-card/50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">Todas as páginas</div>
                              <div className="text-[10px] text-muted-foreground truncate">Aplicar via *</div>
                            </div>
                          </div>

                          <div className="mt-2">
                            {(userToolsDraft["*"] ?? []).length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {(userToolsDraft["*"] ?? []).map((toolId) => (
                                  <div
                                    key={`*:${toolId}`}
                                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/20 px-2 py-1 text-xs"
                                  >
                                    <span className="font-mono">{toolId}</span>
                                    <button
                                      type="button"
                                      className="p-0.5 rounded-full hover:bg-muted"
                                      onClick={() => applyUserOverridesChange(() => removeToolFromPage("*", toolId))}
                                      aria-label={`Remover ${toolId}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">Nenhuma ferramenta desativada globalmente.</div>
                            )}

                            <div className="mt-3 flex items-center gap-2">
                              <Input
                                value={toolInputByPage["*"] ?? ""}
                                onChange={(e) => setToolInput("*", e.target.value)}
                                placeholder="Ex: create-button\nsubmit-form"
                                className="h-9 text-xs bg-background/60"
                              />
                              <NeonButton
                                type="button"
                                variant="glass"
                                className="h-9 px-3"
                                onClick={() => applyUserOverridesChange(() => addToolsToPage("*"))}
                                disabled={normalizeToolIdList(toolInputByPage["*"] ?? "").length === 0}
                              >
                                <Plus className="w-4 h-4" />
                              </NeonButton>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {AVAILABLE_DASHBOARD_PAGES.map((page) => (
                            <div key={`tools:${page.id}`} className="rounded-xl border border-border bg-card/50 p-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{page.label}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{page.id}</div>
                              </div>
                              <div className="mt-2">
                                {(userToolsDraft[page.id] ?? []).length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {(userToolsDraft[page.id] ?? []).map((toolId) => (
                                      <div
                                        key={`${page.id}:${toolId}`}
                                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/20 px-2 py-1 text-xs"
                                      >
                                        <span className="font-mono">{toolId}</span>
                                        <button
                                          type="button"
                                          className="p-0.5 rounded-full hover:bg-muted"
                                          onClick={() => applyUserOverridesChange(() => removeToolFromPage(page.id, toolId))}
                                          aria-label={`Remover ${toolId}`}
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">Nenhuma ferramenta desativada nesta página.</div>
                                )}

                                <div className="mt-3 flex items-center gap-2">
                                  <Input
                                    value={toolInputByPage[page.id] ?? ""}
                                    onChange={(e) => setToolInput(page.id, e.target.value)}
                                    placeholder="Ex: create-button\nsubmit-form"
                                    className="h-9 text-xs bg-background/60"
                                  />
                                  <NeonButton
                                    type="button"
                                    variant="glass"
                                    className="h-9 px-3"
                                    onClick={() => applyUserOverridesChange(() => addToolsToPage(page.id))}
                                    disabled={normalizeToolIdList(toolInputByPage[page.id] ?? "").length === 0}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </NeonButton>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {userTeams.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipes</div>
                        <div className="space-y-2">
                          {userTeams.map((t) => (
                            <div key={t.teamId} className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-card/50">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{t.name}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{t.memberRole}</div>
                              </div>
                              <button
                                type="button"
                                className="text-xs text-primary hover:underline px-2 py-1"
                                onClick={() => openTeamOverrides(t)}
                              >
                                Editar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <NeonButton className="w-full sm:w-auto" variant="glass" onClick={() => setSelectedUser(null)}>
                  Fechar
                </NeonButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          setConfirmDialogOpen(open);
          if (!open) {
            confirmActionRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const fn = confirmActionRef.current;
                setConfirmDialogOpen(false);
                confirmActionRef.current = null;
                fn?.();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border">
          <DialogHeader>
            <DialogTitle>Permissões da equipe: {editingTeam?.name}</DialogTitle>
            <DialogDescription className="sr-only">Ajuste permissões de páginas para a equipe selecionada.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissões extras (equipe)</div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card/50 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">Liberar todas as páginas</div>
                  <div className="text-[10px] text-muted-foreground truncate">Aplicável a todos os membros da equipe</div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Label htmlFor="team-all-access" className="sr-only">
                    Liberar todas as páginas
                  </Label>
                  <Switch
                    id="team-all-access"
                    checked={(teamOverridesDraft.add ?? []).includes("*")}
                    onCheckedChange={(checked) => setAllAccess(setTeamOverridesDraft, !!checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_DASHBOARD_PAGES.map((page) => {
                  const selected = teamOverridesDraft.add.includes(page.id);
                  const allAllowed = teamOverridesDraft.add.includes("*");
                  const handleToggle = () => {
                    toggleOverride(setTeamOverridesDraft, "add", page.id);
                  };
                  return (
                    <div
                      key={`team:add:${page.id}`}
                      onClick={handleToggle}
                      onKeyDown={(e) => {
                        if (allAllowed) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggle();
                        }
                      }}
                      role="button"
                      tabIndex={allAllowed ? -1 : 0}
                      aria-disabled={allAllowed}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                        selected ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:border-primary/20 hover:bg-muted/50"
                      } ${allAllowed ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={handleToggle}
                          onClick={(e) => e.stopPropagation()}
                          disabled={allAllowed}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{page.label}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{page.id}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissões removidas (equipe)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_DASHBOARD_PAGES.map((page) => {
                  const selected = teamOverridesDraft.remove.includes(page.id);
                  const handleToggle = () => {
                    toggleOverride(setTeamOverridesDraft, "remove", page.id);
                  };
                  return (
                    <div
                      key={`team:remove:${page.id}`}
                      onClick={handleToggle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggle();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                        selected ? "bg-red-500/10 border-red-500/20" : "bg-card border-border hover:border-red-500/20 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={handleToggle}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{page.label}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{page.id}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <NeonButton className="w-full sm:w-auto" variant="glass" onClick={() => setEditingTeam(null)}>
                Cancelar
              </NeonButton>
              <NeonButton className="w-full sm:w-auto sm:ml-auto" onClick={() => void saveTeamOverrides()} disabled={savingTeamOverrides}>
                {savingTeamOverrides ? "Salvando..." : "Salvar permissões da equipe"}
              </NeonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Alteração de Plano */}
      <Dialog open={!!editingPlanUser} onOpenChange={(open) => !open && setEditingPlanUser(null)}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border">
          <DialogHeader>
            <DialogTitle>Alterar Plano de {editingPlanUser?.name}</DialogTitle>
            <DialogDescription className="sr-only">Selecione um plano para aplicar ao usuário.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => editingPlanUser && changePlan(editingPlanUser.id, plan.id, plan.name)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    editingPlanUser?.plan === plan.name
                      ? "bg-purple-100 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/50"
                      : "bg-muted/30 border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-bold">{plan.name}</span>
                    <span className="text-sm text-muted-foreground">
                      R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {plan.interval === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  {editingPlanUser?.plan === plan.name && (
                    <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] shrink-0 ml-2" />
                  )}
                </button>
              ))}

              <button
                onClick={() => editingPlanUser && changePlan(editingPlanUser.id, null, "Free")}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  editingPlanUser?.plan === "Free"
                    ? "bg-purple-100 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/50"
                    : "bg-muted/30 border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-bold">Free</span>
                  <span className="text-sm text-muted-foreground">Gratuito</span>
                </div>
                {editingPlanUser?.plan === "Free" && (
                  <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] shrink-0 ml-2" />
                )}
              </button>
            </div>
            
            <NeonButton className="w-full" variant="glass" onClick={() => setEditingPlanUser(null)}>
              Cancelar
            </NeonButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
