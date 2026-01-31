import { useEffect, useState } from "react";
import { Users, DollarSign, TrendingUp, Activity } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Stat {
  label: string;
  value: string;
  change: string;
  icon: typeof Users;
  color: string;
  bg: string;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stat[]>([
    { label: "Usuários Totais", value: "–", change: "", icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-400/10" },
    { label: "Assinaturas Ativas", value: "0", change: "", icon: Activity, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-400/10" },
    { label: "Receita (últimos 7 dias)", value: "R$ 0,00", change: "", icon: DollarSign, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-400/10" },
    { label: "Receita Mensal", value: "R$ 0,00", change: "", icon: DollarSign, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-400/10" },
    { label: "Novos Assinantes (mês)", value: "0", change: "", icon: TrendingUp, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-400/10" },
    { label: "Taxa de Retenção", value: "0%", change: "", icon: Activity, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-400/10" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
        const { data, error } = await supabase.rpc("get_admin_overview_metrics");
        if (error) throw error;

        const metrics = (data as any) ?? {};
        const totalUsers = Number(metrics.total_users ?? 0);
        const activeSubs = Number(metrics.active_subscriptions ?? 0);
        const last7DaysRevenueCents = Number(metrics.revenue_last7_cents ?? 0);
        const monthlyRevenueCents = Number(metrics.revenue_month_cents ?? 0);
        const newSubs = Number(metrics.new_subscriptions_month ?? 0);
        const retention = Number(metrics.retention_percent ?? 0);

        setStats([
          {
            label: "Usuários Totais",
            value: String(totalUsers),
            change: "",
            icon: Users,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-100 dark:bg-blue-400/10",
          },
          {
            label: "Assinaturas Ativas",
            value: String(activeSubs),
            change: "",
            icon: Activity,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-100 dark:bg-purple-400/10",
          },
          {
            label: "Receita (últimos 7 dias)",
            value: currency.format((last7DaysRevenueCents || 0) / 100),
            change: "",
            icon: DollarSign,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-100 dark:bg-green-400/10",
          },
          {
            label: "Receita Mensal",
            value: currency.format((monthlyRevenueCents || 0) / 100),
            change: "",
            icon: DollarSign,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-100 dark:bg-green-400/10",
          },
          {
            label: "Novos Assinantes (mês)",
            value: String(newSubs),
            change: "",
            icon: TrendingUp,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-100 dark:bg-purple-400/10",
          },
          {
            label: "Taxa de Retenção",
            value: `${retention}%`,
            change: "",
            icon: Activity,
            color: "text-orange-600 dark:text-orange-400",
            bg: "bg-orange-100 dark:bg-orange-400/10",
          },
        ]);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        toast.error("Erro ao carregar métricas", { description: message });
        setStats([
          { label: "Usuários Totais", value: "N/D", change: "", icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-400/10" },
          { label: "Assinaturas Ativas", value: "N/D", change: "", icon: Activity, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-400/10" },
          { label: "Receita (últimos 7 dias)", value: "N/D", change: "", icon: DollarSign, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-400/10" },
          { label: "Receita Mensal", value: "N/D", change: "", icon: DollarSign, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-400/10" },
          { label: "Novos Assinantes (mês)", value: "N/D", change: "", icon: TrendingUp, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-400/10" },
          { label: "Taxa de Retenção", value: "N/D", change: "", icon: Activity, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-400/10" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Visão Geral</h1>
        <p className="text-muted-foreground">Bem-vindo de volta, Administrador.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <GlassCard key={i} className="p-6 hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              {!loading && stat.change && (
                <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Placeholder para gráficos futuros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6 h-[300px] flex items-center justify-center border-dashed border-2 border-border bg-card/50">
          <p className="text-muted-foreground">Gráfico de Receita (Em breve)</p>
        </GlassCard>
        <GlassCard className="p-6 h-[300px] flex items-center justify-center border-dashed border-2 border-border bg-card/50">
          <p className="text-muted-foreground">Gráfico de Usuários (Em breve)</p>
        </GlassCard>
      </div>
    </div>
  );
}
