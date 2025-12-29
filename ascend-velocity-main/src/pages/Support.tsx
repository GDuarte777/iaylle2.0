import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Mail, BookOpen, HelpCircle } from "lucide-react";
import { useState } from "react";
import { DotScreenShader } from "@/components/ui/dot-shader-background";

export default function Support() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Support request:", formData);
  };

  const resources = [
    {
      icon: BookOpen,
      title: "Central de Ajuda",
      description: "Tutoriais e guias completos sobre todas as funcionalidades",
      action: "Acessar",
    },
    {
      icon: MessageCircle,
      title: "Chat ao Vivo",
      description: "Fale com nossa equipe em tempo real (horário comercial)",
      action: "Iniciar Chat",
    },
    {
      icon: Mail,
      title: "Email",
      description: "Envie suas dúvidas e receba resposta em até 24h",
      action: "Enviar Email",
    },
    {
      icon: HelpCircle,
      title: "FAQ",
      description: "Respostas rápidas para as perguntas mais comuns",
      action: "Ver FAQ",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <DotScreenShader />
      </div>
      <Navigation />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Como podemos <span className="gradient-text">ajudar</span>?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Estamos aqui para garantir que você tenha a melhor experiência com GameTeam
          </p>
        </div>
      </section>

      {/* Support Resources */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((resource, index) => (
            <GlassCard key={index} hover className="text-center p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center mx-auto mb-4">
                <resource.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {resource.description}
              </p>
              <NeonButton variant="glass" className="w-full text-sm">
                {resource.action}
              </NeonButton>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Envie sua Mensagem</h2>
            <p className="text-xl text-muted-foreground">
              Responderemos o mais rápido possível
            </p>
          </div>

          <GlassCard className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="glass-card border-white/10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="glass-card border-white/10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  placeholder="Como podemos ajudar?"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="glass-card border-white/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Descreva sua dúvida ou problema em detalhes..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="glass-card border-white/10 min-h-[200px]"
                  required
                />
              </div>

              <NeonButton type="submit" variant="neon" className="w-full">
                Enviar Mensagem
              </NeonButton>
            </form>
          </GlassCard>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Dicas Rápidas</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <GlassCard hover className="p-6">
            <h3 className="text-lg font-semibold mb-2">📝 Seja específico</h3>
            <p className="text-muted-foreground text-sm">
              Quanto mais detalhes você fornecer, mais rápido poderemos ajudar
            </p>
          </GlassCard>

          <GlassCard hover className="p-6">
            <h3 className="text-lg font-semibold mb-2">📸 Envie prints</h3>
            <p className="text-muted-foreground text-sm">
              Capturas de tela ajudam muito a entender o problema
            </p>
          </GlassCard>

          <GlassCard hover className="p-6">
            <h3 className="text-lg font-semibold mb-2">⏰ Horário de atendimento</h3>
            <p className="text-muted-foreground text-sm">
              Seg-Sex: 9h-18h | Sáb: 9h-13h
            </p>
          </GlassCard>
        </div>
      </section>

      <Footer />
    </div>
  );
}
