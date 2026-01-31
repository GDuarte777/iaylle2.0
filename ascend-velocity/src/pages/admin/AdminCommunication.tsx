import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { AlertTriangle, Bell, Info, Megaphone, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "danger";
  active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
};

export default function AdminCommunication() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "success" | "danger">("info");
  const [active, setActive] = useState(true);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements((data as any) ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar avisos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async () => {
    if (!title || !message) {
      toast.error("Preencha título e mensagem");
      return;
    }

    try {
      const payload = {
        title,
        message,
        type,
        active,
        start_at: startAt || new Date().toISOString(),
        end_at: endAt || null,
      };

      const { error } = await supabase.from("system_announcements").insert(payload);
      if (error) throw error;

      toast.success("Aviso criado com sucesso!");
      setIsEditing(false);
      resetForm();
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar aviso");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este aviso?")) return;
    try {
      const { error } = await supabase.from("system_announcements").delete().eq("id", id);
      if (error) throw error;
      toast.success("Aviso excluído");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir aviso");
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from("system_announcements").update({ active: !current }).eq("id", id);
      if (error) throw error;
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: !current } : a));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar status");
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("info");
    setActive(true);
    setStartAt("");
    setEndAt("");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Central de Comunicação
          </h1>
          <p className="text-muted-foreground">Gerencie avisos e notificações globais para os usuários.</p>
        </div>

        <NeonButton variant="neon" onClick={() => setIsEditing(!isEditing)} className="gap-2">
          {isEditing ? "Cancelar" : <><Plus className="w-4 h-4" /> Novo Aviso</>}
        </NeonButton>
      </div>

      {isEditing && (
        <GlassCard className="p-6 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-semibold mb-4">Novo Aviso</h2>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Manutenção Programada" />
            </div>
            
            <div className="grid gap-2">
              <Label>Mensagem</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Ex: O sistema ficará instável entre 02:00 e 04:00..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informação (Azul)</SelectItem>
                    <SelectItem value="warning">Alerta (Amarelo)</SelectItem>
                    <SelectItem value="success">Sucesso (Verde)</SelectItem>
                    <SelectItem value="danger">Perigo (Vermelho)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-8">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label>Ativo imediatamente</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Início (opcional)</Label>
                <Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Fim (opcional)</Label>
                <Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <NeonButton variant="neon" onClick={handleSubmit}>
                Publicar Aviso
              </NeonButton>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Carregando...</div>
        ) : announcements.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">Nenhum aviso encontrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Aviso</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Switch 
                      checked={a.active} 
                      onCheckedChange={() => handleToggleActive(a.id, a.active)} 
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{a.title}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[300px]">{a.message}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full border capitalize ${
                      a.type === 'info' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      a.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      a.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {a.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-muted-foreground">
                      <span>Início: {a.start_at ? format(new Date(a.start_at), "dd/MM/yyyy HH:mm") : "Imediato"}</span>
                      <span>Fim: {a.end_at ? format(new Date(a.end_at), "dd/MM/yyyy HH:mm") : "Indeterminado"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <NeonButton variant="glass" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-4 h-4" />
                    </NeonButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>
    </div>
  );
}
