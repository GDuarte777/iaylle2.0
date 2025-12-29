import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Copy, 
  ExternalLink, 
  Smartphone, 
  Send,
  CheckCircle2,
  History,
  Trash2,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { GlassCard } from "@/components/GlassCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

interface WhatsAppLink {
  id: string;
  phone: string;
  message: string;
  link: string;
  created_at: string;
}

export default function WhatsAppGenerator() {
  const { user } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [history, setHistory] = useState<WhatsAppLink[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Clean phone number (remove non-digits)
  const cleanPhone = (number: string) => {
    return number.replace(/\D/g, "");
  };

  // Format phone for display (simple mask)
  const formatPhoneDisplay = (val: string) => {
    // Basic logic to keep input clean, real masking can be complex
    return val;
  };

  useEffect(() => {
    const cleaned = cleanPhone(phone);
    if (!cleaned) {
      setGeneratedLink("");
      return;
    }

    // Encode message
    const encodedMessage = encodeURIComponent(message);
    const link = `https://wa.me/${cleaned}${message ? `?text=${encodedMessage}` : ""}`;
    setGeneratedLink(link);
  }, [phone, message]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const { data, error } = await supabase
        .from('whatsapp_links')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveToHistory = async () => {
    if (!user || !generatedLink) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_links')
        .insert({
          user_id: user.id,
          phone,
          message,
          link: generatedLink
        })
        .select()
        .single();

      if (error) throw error;

      setHistory([data, ...history]);
      toast.success('Link salvo no histórico!');
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error('Erro ao salvar link');
    }
  };

  const deleteFromHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory(history.filter(item => item.id !== id));
      toast.success('Link removido do histórico');
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Erro ao remover link');
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Link copiado com sucesso!");
  };

  const openLink = (url: string) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6 pb-24">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <MessageCircle className="w-6 h-6 text-green-500" />
            </div>
            Gerador de Link WhatsApp
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie links diretos para o seu WhatsApp com mensagens personalizadas.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <GlassCard className="p-6 border-green-500/20">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Número do WhatsApp
                </label>
                <Input
                  placeholder="Ex: 5511999999999 (DDD + Número)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-background/50 dark:bg-muted/20 border-border focus:border-green-500 transition-all font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Insira o código do país (ex: 55 para Brasil) seguido do DDD e número.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Mensagem Pré-definida (Opcional)
                </label>
                <Textarea
                  placeholder="Ex: Olá! Vim pelo Instagram e gostaria de mais informações."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-background/50 dark:bg-muted/20 border-border focus:border-green-500 transition-all min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Essa mensagem aparecerá automaticamente no campo de texto do seu cliente.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Preview & Action Section */}
        <div className="space-y-6">
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Seu Link Gerado
              </CardTitle>
              <CardDescription>
                Copie e use na sua Bio, Stories ou anúncios.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted dark:bg-muted/20 border border-border font-mono text-sm break-all min-h-[60px] flex items-center text-muted-foreground">
                {generatedLink || "Preencha o número para gerar o link..."}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => copyToClipboard(generatedLink)} 
                  disabled={!generatedLink}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link
                </Button>
                
                <Button 
                  onClick={() => openLink(generatedLink)} 
                  disabled={!generatedLink}
                  variant="outline"
                  className="flex-1 border-green-500/30 hover:bg-green-500/10 text-green-600 dark:text-green-400"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Testar Link
                </Button>

                <Button 
                  onClick={saveToHistory} 
                  disabled={!generatedLink || !user}
                  variant="outline"
                  className="flex-1 border-green-500/30 hover:bg-green-500/10 text-green-600 dark:text-green-400"
                  title={user ? "Salvar no Histórico" : "Faça login para salvar"}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>

              {/* Preview Mockup */}
              {message && (
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-sm font-medium mb-3 text-muted-foreground">Pré-visualização no WhatsApp:</p>
                  <div className="bg-[#E5DDD5] dark:bg-[#0b141a] p-4 rounded-lg max-w-sm mx-auto shadow-inner">
                    <div className="bg-[#DCF8C6] dark:bg-[#005c4b] p-3 rounded-lg rounded-tr-none shadow-sm inline-block max-w-full">
                      <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                        {message}
                      </p>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 text-right mt-1">
                        12:00
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-green-500" />
            Links Recentes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <GlassCard key={item.id} className="p-4 flex flex-col gap-3 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-lg truncate">{item.phone}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.message || "Sem mensagem"}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-background/80 rounded-md p-1 backdrop-blur-sm">
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive/80" onClick={() => deleteFromHistory(item.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => {
                    setPhone(item.phone);
                    setMessage(item.message);
                    toast.success("Dados carregados!");
                  }}>
                    Carregar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => {
                    navigator.clipboard.writeText(item.link);
                    toast.success("Link copiado!");
                  }}>
                    <Copy className="w-3 h-3 mr-1" /> Copiar
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
