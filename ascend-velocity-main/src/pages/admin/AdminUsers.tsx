import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Search, MoreVertical, Shield, ShieldAlert, LogIn, Ban, CreditCard } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePlansStore } from "@/store/plansStore";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  plan: string;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const { plans, fetchPlans } = usePlansStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingPlanUser, setEditingPlanUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, [fetchPlans]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;

      if (data) {
        setUsers(data.map(u => ({
          id: u.id,
          name: u.full_name || 'Sem nome',
          email: u.email || '',
          role: u.role || 'member',
          status: u.status || 'active',
          plan: u.plan_status || 'Free'
        })));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);

      if (error) throw error;

      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
      toast.success(`Permissão alterada para ${newRole}!`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erro ao alterar permissão');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
      toast.success(`Status alterado para ${newStatus === 'active' ? 'Ativo' : 'Bloqueado'}!`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const changePlan = async (userId: string, planId: string | null, newPlanName: string) => {
    try {
      if (planId) {
        const { error } = await supabase.functions.invoke('admin-stripe-subscription', {
          body: {
            action: 'change_plan',
            userId,
            planId,
          },
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.functions.invoke('admin-stripe-subscription', {
          body: {
            action: 'cancel',
            userId,
          },
        });

        if (error) throw error;
      }

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlanName } : u));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, plan: newPlanName });
      }

      await fetchUsers();

      toast.success(`Plano alterado para ${newPlanName}`);
    } catch (error) {
      console.error('Error updating plan:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Erro ao alterar plano: ${message}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando usuários...</div>;
  }

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
        {users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).map((user) => (
          <GlassCard key={user.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {user.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  {user.name}
                  {user.role === "admin" && <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400 fill-purple-400/20" />}
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-muted/20 border border-border">
                <span className="text-muted-foreground">Plano:</span>
                <span className="text-foreground">{user.plan}</span>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                user.status === 'active' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
                  : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
              }`}>
                {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-muted/10 transition-colors ml-auto sm:ml-0">
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-border">
                  <DropdownMenuLabel>Ações da Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer gap-2">
                      <CreditCard className="w-4 h-4" />
                      Alterar Plano
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-background/95 backdrop-blur-xl border-border ml-1">
                      {plans.map((plan) => (
                        <DropdownMenuItem 
                          key={plan.id} 
                          onClick={() => changePlan(user.id, plan.id, plan.name)}
                          className="cursor-pointer gap-2 justify-between"
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-medium">{plan.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {plan.interval === 'monthly' ? 'mês' : 'ano'}
                            </span>
                          </div>
                          {user.plan === plan.name && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem 
                        onClick={() => changePlan(user.id, null, "Free")}
                        className="cursor-pointer gap-2"
                      >
                        {user.plan === "Free" && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        <span>Free (plano grátis)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          await changePlan(user.id, null, "Free");
                          if (user.status === 'active') {
                            await toggleStatus(user.id, user.status);
                          }
                        }}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                      >
                        <Ban className="w-4 h-4" />
                        Bloquear acesso (sem acesso à plataforma)
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuItem onClick={() => toggleRole(user.id, user.role)} className="cursor-pointer gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    {user.role === "admin" ? "Remover Admin" : "Tornar Admin"}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => toggleStatus(user.id, user.status)} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                    <Ban className="w-4 h-4" />
                    {user.status === "active" ? "Bloquear Acesso" : "Desbloquear"}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem 
                    className="cursor-pointer gap-2"
                    onClick={() => setSelectedUser(user)}
                  >
                    <LogIn className="w-4 h-4" />
                    Ver detalhes do usuário
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Modal de Detalhes do Usuário */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md bg-background/95 border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{selectedUser.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedUser(null)}
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Plano atual</p>
                <p className="font-medium">{selectedUser.plan}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="font-medium">
                  {selectedUser.status === "active" ? "Ativo" : selectedUser.status === "blocked" ? "Bloqueado" : selectedUser.status}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Tipo de acesso</p>
                <p className="font-medium">{selectedUser.role === "admin" ? "Administrador" : "Membro"}</p>
              </div>
            </div>

            <NeonButton className="w-full" onClick={() => setSelectedUser(null)}>
              Fechar
            </NeonButton>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Plano */}
      <Dialog open={!!editingPlanUser} onOpenChange={(open) => !open && setEditingPlanUser(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Alterar Plano de {editingPlanUser?.name}</DialogTitle>
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
                  <div className="flex flex-col items-start">
                    <span className="font-bold">{plan.name}</span>
                    <span className="text-sm text-muted-foreground">
                      R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {plan.interval === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  {editingPlanUser?.plan === plan.name && (
                    <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
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
                <div className="flex flex-col items-start">
                  <span className="font-bold">Free</span>
                  <span className="text-sm text-muted-foreground">Plano gratuito</span>
                </div>
                {editingPlanUser?.plan === "Free" && (
                  <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={async () => {
                  if (editingPlanUser) {
                    await changePlan(editingPlanUser.id, null, "Free");
                    if (editingPlanUser.status === 'active') {
                      await toggleStatus(editingPlanUser.id, editingPlanUser.status);
                    }
                  }
                }}
                className="w-full p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Ban className="w-4 h-4" />
                Bloquear acesso (Remover plano e bloquear)
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
