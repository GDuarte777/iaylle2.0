import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { FileText, RefreshCcw, Search } from "lucide-react";
import { NeonButton } from "@/components/NeonButton";

type AuditLogRow = {
  id: string;
  actor_id: string | null;
  entity_table: string;
  entity_id: string | null;
  action: string;
  created_at: string;
};

type ProfileLite = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export default function AdminAuditLogs() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [actors, setActors] = useState<Record<string, ProfileLite>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, actor_id, entity_table, entity_id, action, created_at")
        .order("created_at", { ascending: false })
        .range(0, 199);

      if (error) throw error;

      const rows = ((data as any) ?? []) as AuditLogRow[];
      setLogs(rows);

      const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter((id): id is string => !!id)));
      if (actorIds.length === 0) {
        setActors({});
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", actorIds);

      if (profilesError) throw profilesError;

      const map: Record<string, ProfileLite> = {};
      (((profilesData as any) ?? []) as ProfileLite[]).forEach((p) => {
        map[p.id] = p;
      });
      setActors(map);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(`Erro ao carregar logs: ${message}`);
      setLogs([]);
      setActors({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const actor = l.actor_id ? actors[l.actor_id] : undefined;
      const actorEmail = actor?.email?.toLowerCase() ?? "";
      const actorName = actor?.full_name?.toLowerCase() ?? "";
      return (
        l.entity_table.toLowerCase().includes(q) ||
        (l.entity_id ?? "").toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        actorEmail.includes(q) ||
        actorName.includes(q)
      );
    });
  }, [actors, logs, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Logs de Auditoria
          </h1>
          <p className="text-muted-foreground">Acompanhe alterações feitas por admins e sistema.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por tabela, ação, actor, id..."
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
        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">Nenhum log encontrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Ator</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => {
                const actor = l.actor_id ? actors[l.actor_id] : undefined;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{actor?.full_name ?? "Sistema"}</span>
                        <span className="text-xs text-muted-foreground">{actor?.email ?? l.actor_id ?? ""}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{l.entity_table}</TableCell>
                    <TableCell className="capitalize">{l.action.toLowerCase()}</TableCell>
                    <TableCell className="text-muted-foreground">{l.entity_id ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </GlassCard>
    </div>
  );
}

