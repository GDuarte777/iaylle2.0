import { useEffect, useState } from "react";
import { Users, DollarSign, TrendingUp, Activity } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/lib/supabase";

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
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [{ count: usersCount }, paymentsResult, { data: subsData, count: subsTotal }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("payments")
            .select("amount_cents, paid_at")
            .eq("status", "paid")
            .gte("paid_at", startOfMonth),
          supabase
            .from("subscriptions")
            .select("id, status, started_at", { count: "exact" }),
        ]);

        const totalUsers = usersCount ?? 0;

        const payments = paymentsResult.data as { amount_cents: number; paid_at: string }[] | null;
        const monthlyRevenueCents = (payments || [])
          .filter((p) => p.paid_at && p.paid_at >= startOfMonth)
          .reduce((sum, p) => sum + (p.amount_cents || 0), 0);
        const monthlyRevenue = monthlyRevenueCents / 100;

        const last7DaysRevenueCents = (payments || [])
          .filter((p) => p.paid_at && p.paid_at >= sevenDaysAgo)
          .reduce((sum, p) => sum + (p.amount_cents || 0), 0);
        const last7DaysRevenue = last7DaysRevenueCents / 100;

        const subs = (subsData as { id: string; status: string; started_at: string | null }[]) || [];
        const newSubs = subs.filter((s) => s.started_at && s.started_at >= startOfMonth).length;
        const activeSubs = subs.filter((s) => s.status === "active").length;
        const totalSubs = subsTotal ?? subs.length;
        const retention = totalSubs > 0 ? Math.round((activeSubs / totalSubs) * 100) : 0;

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
            value: `R$ ${last7DaysRevenue.toFixed(2).replace(".", ",")}`,
            change: "",
            icon: DollarSign,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-100 dark:bg-green-400/10",
          },
          {
            label: "Receita Mensal",
            value: `R$ ${monthlyRevenue.toFixed(2).replace(".", ",")}`,
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
      } catch {
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
