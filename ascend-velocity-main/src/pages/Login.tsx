import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { FaGoogle } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginWithEmail, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) { toast.error("Informe um e-mail válido."); return; }
    if (!password) { toast.error("Informe sua senha."); return; }

    const result = await loginWithEmail(email, password);

    if (result.success) {
      toast.success("Bem-vindo de volta!");
      navigate("/dashboard");
    } else {
      if (result.error === 'config_missing') {
        toast.error("Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
        return;
      }
      const msg = result.error || "Credenciais inválidas.";
      toast.error(msg);
    }
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    if (!result.success) {
      toast.error(result.error || "Erro ao conectar com Google");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="GameTeam" className="h-12 w-auto" />
        </Link>

        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta</h1>
            <p className="text-muted-foreground">
              Entre para acessar seu dashboard
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 border border-gray-200 dark:border-transparent font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              <FaGoogle className="w-5 h-5" />
              Continuar com Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background dark:bg-[#0A0A0A] px-2 text-muted-foreground">
                  Ou entre com email
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-card border-border dark:border-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-neon-blue hover:underline"
                >
                  Esqueceu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-card border-border dark:border-white/10"
                required
              />
            </div>

            <NeonButton type="submit" variant="neon" className="w-full">
              Entrar
            </NeonButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Não tem uma conta?{" "}
              <Link to="/signup" className="text-neon-blue hover:underline font-medium">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </GlassCard>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Ao continuar, você concorda com nossos{" "}
          <Link to="/" className="text-neon-blue hover:underline">
            Termos de Uso
          </Link>
        </p>
      </div>
    </div>
  );
}
