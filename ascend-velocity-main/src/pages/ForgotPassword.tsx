import { useState } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement password reset logic
    console.log("Reset password for:", email);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="GameTeam" className="h-12 w-auto" />
        </Link>

        <GlassCard className="p-8">
          {!sent ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Esqueceu a senha?</h1>
                <p className="text-muted-foreground">
                  Enviaremos instruções para redefinir sua senha
                </p>
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
                    className="glass-card border-white/10"
                    required
                  />
                </div>

                <NeonButton type="submit" variant="neon" className="w-full">
                  Enviar Instruções
                </NeonButton>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center mx-auto mb-4">
                <img src={logo} alt="GameTeam" className="h-8 w-auto" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Email enviado!</h2>
              <p className="text-muted-foreground mb-6">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <Link to="/login">
                <NeonButton variant="glass" className="w-full">
                  Voltar para Login
                </NeonButton>
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para login
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
