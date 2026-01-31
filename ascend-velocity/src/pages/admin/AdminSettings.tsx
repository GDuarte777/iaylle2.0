import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Flag, Plus, RefreshCcw, Search, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";

type FeatureFlagRow = {
  key: string;
  description: string | null;
  enabled: boolean;
  updated_at: string;
};

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);

  const [accessLoading, setAccessLoading] = useState(true);
  const [accessSaving, setAccessSaving] = useState(false);
  const [blockedToolMessage, setBlockedToolMessage] = useState(
    "Esta funcionalidade não está disponível no seu plano atual ou não foi liberada para sua conta.",
  );

  const [newKey, setNewKey] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEnabled, setNewEnabled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("key, description, enabled, updated_at")
        .order("key", { ascending: true });

      if (error) throw error;
      setFlags(((data as any) ?? []) as FeatureFlagRow[]);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Erro ao carregar flags: ${message}`);
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    setAccessLoading(true);

    const run = async () => {
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

    run()
      .catch(() => {
      })
      .finally(() => {
        if (!cancelled) setAccessLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const saveAccessControl = useCallback(async () => {
    const msg = blockedToolMessage.trim();
    if (!msg) {
      toast.error("Informe a mensagem de bloqueio");
      return;
    }

    setAccessSaving(true);
    try {
      const { error } = await supabase.from("app_settings").upsert(
        {
          key: "access_control",
          value: {
            blocked_tool_message: msg,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      if (error) throw error;
      toast.success("Configuração salva");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error("Erro ao salvar configuração", { description: message });
    } finally {
      setAccessSaving(false);
    }
  }, [blockedToolMessage]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return flags;
    return flags.filter((f) => {
      return f.key.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q);
    });
  }, [flags, search]);

  const setFlagEnabled = useCallback(async (key: string, enabled: boolean) => {
    setSavingKey(key);
    try {
      const { error } = await supabase.from("feature_flags").update({ enabled }).eq("key", key);
      if (error) throw error;
      setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Erro ao atualizar flag: ${message}`);
    } finally {
      setSavingKey(null);
    }
  }, []);

  const createFlag = useCallback(async () => {
    const key = newKey.trim();
    if (!key) {
      toast.error("Informe uma key");
      return;
    }
    setSavingKey(key);
    try {
      const { error } = await supabase.from("feature_flags").insert({
        key,
        description: newDescription.trim() || null,
        enabled: newEnabled,
      });
      if (error) throw error;
      toast.success("Flag criada");
      setNewKey("");
      setNewDescription("");
      setNewEnabled(false);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Erro ao criar flag: ${message}`);
    } finally {
      setSavingKey(null);
    }
  }, [load, newDescription, newEnabled, newKey]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Configurações Globais
          </h1>
          <p className="text-muted-foreground">Feature flags e parâmetros globais.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por key ou descrição..."
              className="pl-10 bg-background/60"
            />
          </div>
          <NeonButton variant="glass" onClick={() => void load()} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Atualizar
          </NeonButton>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-semibold">Feature Flags</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <div className="text-sm font-medium">Key</div>
            <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="ex: billing_block" />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <div className="text-sm font-medium">Descrição</div>
            <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="ex: Bloqueia cobrança por uso excedido" />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="new-flag-enabled" checked={newEnabled} onCheckedChange={setNewEnabled} />
            <Label htmlFor="new-flag-enabled">Ativada</Label>
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <NeonButton variant="neon" onClick={() => void createFlag()} className="gap-2" disabled={savingKey === newKey.trim()}>
              <Plus className="w-4 h-4" />
              Criar
            </NeonButton>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">Nenhuma flag encontrada.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.key}>
                  <TableCell className="font-medium">{f.key}</TableCell>
                  <TableCell className="text-muted-foreground">{f.description ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-3">
                      <Switch
                        checked={f.enabled}
                        disabled={savingKey === f.key}
                        onCheckedChange={(checked) => void setFlagEnabled(f.key, checked)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-semibold">Controle de Acesso</h2>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium">Mensagem de bloqueio (toast)</div>
            <Textarea
              value={blockedToolMessage}
              onChange={(e) => setBlockedToolMessage(e.target.value)}
              className="min-h-[110px] bg-background/60"
              disabled={accessLoading || accessSaving}
            />
          </div>

          <div className="flex justify-end">
            <NeonButton
              variant="neon"
              disabled={accessLoading || accessSaving}
              onClick={() => void saveAccessControl()}
            >
              Salvar
            </NeonButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
