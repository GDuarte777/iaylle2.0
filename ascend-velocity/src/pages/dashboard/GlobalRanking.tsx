
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Trophy, Users, Shield, Crown, Medal, ChevronLeft, ChevronRight } from "lucide-react";

interface RankingUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  active_affiliates_count: number;
  rank?: number;
}

export default function GlobalRanking() {
  const { user } = useAuthStore();
  const [isParticipating, setIsParticipating] = useState(false);
  const [rankingData, setRankingData] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    if (user) {
      checkParticipationStatus();
    }
  }, [user]);

  useEffect(() => {
    fetchRanking();
  }, [page, isParticipating]); // Refetch when page or participation changes

  const checkParticipationStatus = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("participating_in_ranking")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setIsParticipating(data?.participating_in_ranking || false);
    } catch (error) {
      console.error("Error checking participation status:", error);
    }
  };

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const [{ data: total, error: countError }, { data: rows, error: rowsError }] = await Promise.all([
        supabase.rpc("get_global_ranking_count"),
        supabase.rpc("get_global_ranking", { p_page: page, p_page_size: itemsPerPage })
      ]);

      if (countError) throw countError;
      if (rowsError) throw rowsError;

      const totalCount = typeof total === "number" ? total : 0;
      setTotalUsers(totalCount);

      const from = (page - 1) * itemsPerPage;
      const dataWithRank = (rows || []).map((item: any, index: number) => ({
        ...item,
        rank: from + index + 1
      }));

      setRankingData(dataWithRank as RankingUser[]);
    } catch (error) {
      console.error("Error fetching ranking:", error);
      toast.error("Erro ao carregar ranking");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleParticipation = async (checked: boolean) => {
    if (!user) return;
    
    // Optimistic update
    const previousState = isParticipating;
    setIsParticipating(checked);

    try {
      const { data, error } = await supabase.rpc("set_ranking_participation", { p_enabled: checked });
      if (error) throw error;

      setIsParticipating(!!data);
      toast.success(checked ? "Você entrou no ranking!" : "Você saiu do ranking.");
      fetchRanking();
    } catch (error) {
      console.error("Error updating participation:", error);
      setIsParticipating(previousState); // Revert on error
      toast.error("Erro ao atualizar status de participação");
    }
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500 animate-bounce" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300 fill-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;
    return <span className="font-bold text-muted-foreground w-6 text-center">{rank}º</span>;
  };

  const getRowStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30";
    if (rank === 2) return "bg-gradient-to-r from-gray-300/10 to-transparent border-gray-300/30";
    if (rank === 3) return "bg-gradient-to-r from-amber-700/10 to-transparent border-amber-700/30";
    return "hover:bg-white/5";
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-primary animate-pulse" />
              Ranking Global
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Veja as maiores guildas da plataforma e acompanhe seu desempenho em relação a outras gestoras.
              O ranking é baseado na quantidade de afiliados ativos.
            </p>
          </div>

          <GlassCard className="p-4 flex items-center gap-4 border-l-4 border-l-primary w-full md:w-auto">
            <div className={`p-3 rounded-full ${isParticipating ? 'bg-green-500/10' : 'bg-muted'}`}>
              <Shield className={`w-6 h-6 ${isParticipating ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm md:text-base">
                  {isParticipating ? "Sair do Ranking" : "Participar do Ranking Guildas"}
                </span>
                <Switch
                  checked={isParticipating}
                  onCheckedChange={handleToggleParticipation}
                  aria-label={isParticipating ? "Sair do Ranking" : "Participar do Ranking Guildas"}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {isParticipating 
                  ? "Seu perfil está visível para todos" 
                  : "Ative para comparar seu desempenho"}
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Ranking List */}
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Top Guildas
            </h2>
          </div>

          <div className="divide-y divide-border/50">
            {loading ? (
              // Skeleton Loading
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              ))
            ) : rankingData.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma guilda encontrada no ranking.</p>
                {!isParticipating && (
                  <p className="text-sm mt-2 text-primary cursor-pointer hover:underline" onClick={() => handleToggleParticipation(true)}>
                    Seja o primeiro a participar!
                  </p>
                )}
              </div>
            ) : (
              rankingData.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 flex items-center gap-4 transition-colors ${getRowStyle(item.rank!)} ${user?.id === item.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  {/* Rank Position */}
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    {getRankIcon(item.rank!)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-background shadow-sm">
                    <AvatarImage src={item.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {item.full_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {item.full_name || "Usuário Anônimo"}
                      </h3>
                      {user?.id === item.id && (
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                          VOCÊ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Líder de Guilda
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-lg md:text-xl font-bold text-foreground">
                      {item.active_affiliates_count}
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
                      Afiliados Ativos
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border/50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="gap-2"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
