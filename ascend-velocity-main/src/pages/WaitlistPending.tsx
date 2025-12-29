import { Link } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { ShieldAlert, LogOut, Home } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuthStore } from "@/store/authStore";

export default function WaitlistPending() {
  const { logout } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg animate-fade-in-up relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="GameTeam" className="h-12 w-auto" />
        </div>

        <GlassCard className="p-8 text-center border-yellow-500/30">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6 border border-yellow-500/20 animate-pulse">
            <ShieldAlert className="w-10 h-10 text-yellow-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Acesso em Análise</h1>
          
          <p className="text-lg text-muted-foreground mb-6">
            Sua conta foi criada com sucesso, mas a plataforma está operando em modo de <span className="text-foreground font-semibold">Lista de Espera</span>.
          </p>

          <div className="bg-white/5 rounded-xl p-6 mb-8 text-left border border-white/10">
            <p className="text-sm text-muted-foreground mb-2">O que acontece agora?</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5" />
                <span>Um administrador irá analisar seu cadastro.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5" />
                <span>Você receberá uma notificação por email assim que aprovado.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5" />
                <span>Seu acesso está temporariamente bloqueado.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/" className="w-full sm:w-auto">
              <NeonButton variant="glass" className="w-full gap-2">
                <Home className="w-4 h-4" />
                Voltar ao Início
              </NeonButton>
            </Link>
            <button onClick={logout} className="w-full sm:w-auto">
              <NeonButton variant="outline" className="w-full gap-2 text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </NeonButton>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
