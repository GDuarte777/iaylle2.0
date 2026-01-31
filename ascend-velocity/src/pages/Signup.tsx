import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { FaGoogle } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signupWithEmail, loginWithGoogle, waitlistMode } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectRaw = searchParams.get("redirect");
  const redirect = redirectRaw && redirectRaw.startsWith("/") ? redirectRaw : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
    if (!name.trim()) { toast.error("Informe seu nome completo."); return; }
    if (!emailValid) { toast.error("Informe um e-mail válido."); return; }
    if (!passValid) { toast.error("A senha deve ter 8+ caracteres, maiúscula, minúscula e número."); return; }
    if (password !== confirmPassword) { toast.error("As senhas não correspondem."); return; }

    const result = await signupWithEmail(name, email, password);

    if (result.success) {
      if (waitlistMode) {
        toast.success("Sua conta foi criada e está na lista de espera. Assim que um admin aprovar, você poderá acessar a plataforma.");
      } else {
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
      navigate("/login");
    } else {
      const msg = result.error || "Erro ao criar conta.";
      if (result.error === 'config_missing') {
        toast.error("Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
        return;
      }
      if (msg.includes('already registered')) {
        toast.error("Este e-mail já está cadastrado.");
      } else if (msg.toLowerCase().includes('password')) {
        toast.error("Senha fraca. Ajuste os requisitos mínimos.");
      } else if (msg.toLowerCase().includes('email')) {
        toast.error("E-mail inválido.");
      } else {
        toast.error(msg);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle(redirect);
    if (!result.success) {
      toast.error(result.error || "Erro ao conectar com Google");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo className="h-12 w-auto" alt="Guildas" />
        </Link>

        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Crie sua conta</h1>
            <p className="text-muted-foreground">
              Comece grátis por 14 dias. Sem cartão de crédito.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 border border-gray-200 dark:border-transparent font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              <FaGoogle className="w-5 h-5" />
              Criar com Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background dark:bg-[#0A0A0A] px-2 text-muted-foreground">
                  Ou use seu email
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-card border-border dark:border-white/10"
                required
              />
            </div>

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
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-card border-border dark:border-white/10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-card border-white/10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <NeonButton type="submit" variant="neon" className="w-full">
              Criar Conta Grátis
            </NeonButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-neon-blue hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </GlassCard>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Ao criar uma conta, você concorda com nossos{" "}
          <Link to="/" className="text-neon-blue hover:underline">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link to="/" className="text-neon-blue hover:underline">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
