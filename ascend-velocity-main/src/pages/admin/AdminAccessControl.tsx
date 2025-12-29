import { useAuthStore } from "@/store/authStore";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, Clock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function AdminAccessControl() {
  const { waitlistMode, toggleWaitlistMode, getWaitlistUsers, approveUser, rejectUser } = useAuthStore();
  const waitlistUsers = getWaitlistUsers();

  const handleToggle = async () => {
    await toggleWaitlistMode();
    toast.success(!waitlistMode ? "Lista de espera ativada!" : "Lista de espera desativada!");
  };

  const handleApprove = (userId: string, userName: string) => {
    approveUser(userId);
    toast.success(`${userName} foi aprovado!`);
  };

  const handleReject = (userId: string, userName: string) => {
    rejectUser(userId);
    toast.info(`${userName} foi removido da lista.`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Controle de Acesso</h1>
        <p className="text-muted-foreground">Gerencie quem pode entrar na plataforma.</p>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-5 h-5 ${waitlistMode ? "text-neon-blue dark:text-neon-blue text-cyan-600" : "text-muted-foreground"}`} />
              <h2 className="text-xl font-semibold">Modo Lista de Espera</h2>
            </div>
            <p className="text-muted-foreground">
              Quando ativado, novos usuários precisarão de aprovação manual para acessar a plataforma.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="waitlist-mode" className="text-sm font-medium">
              {waitlistMode ? "Ativado" : "Desativado"}
            </Label>
            <Switch 
              id="waitlist-mode" 
              checked={waitlistMode}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>
      </GlassCard>

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6 text-yellow-500" />
          Aguardando Aprovação
          {waitlistUsers.length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500 text-xs px-2 py-1 rounded-full">
              {waitlistUsers.length}
            </span>
          )}
        </h2>

        {waitlistUsers.length === 0 ? (
          <GlassCard className="p-8 text-center flex flex-col items-center justify-center border-dashed border-border bg-card/50">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Check className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">Nenhum usuário na fila</p>
            <p className="text-muted-foreground">Todos os usuários registrados estão ativos.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waitlistUsers.map((user) => (
              <GlassCard key={user.id} className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h3 className="font-bold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registrado em: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <NeonButton 
                    variant="neon" 
                    className="flex-1"
                    onClick={() => handleApprove(user.id, user.name)}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aprovar
                  </NeonButton>
                  <NeonButton 
                    variant="outline" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleReject(user.id, user.name)}
                  >
                    <X className="w-4 h-4" />
                  </NeonButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
