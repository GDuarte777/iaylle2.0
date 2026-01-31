import { useCallback, useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ExternalLink, Eye, EyeOff, RefreshCcw, Search, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

type BioPage = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  profile_image: string | null;
  is_published: boolean;
  user_id: string;
  created_at: string;
  user: {
    email: string | null;
  } | null;
};

export default function AdminModeration() {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<BioPage[]>([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bio_pages")
        .select("*, user:profiles(email)")
        .order("created_at", { ascending: false })
        .range(0, 49);

      if (error) throw error;
      setPages((data as any) ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar páginas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePublish = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from("bio_pages").update({ is_published: !current }).eq("id", id);
      if (error) throw error;
      
      setPages(prev => prev.map(p => p.id === id ? { ...p, is_published: !current } : p));
      toast.success(!current ? "Página publicada" : "Página despublicada (banida)");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao alterar status");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter(p => 
      p.slug.toLowerCase().includes(q) || 
      (p.title ?? "").toLowerCase().includes(q) || 
      (p.user?.email ?? "").toLowerCase().includes(q)
    );
  }, [pages, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Moderação de Conteúdo
          </h1>
          <p className="text-muted-foreground">Monitore e modere páginas criadas pelos usuários.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por slug, título ou email..."
              className="pl-10 bg-background/60"
            />
          </div>
          <NeonButton variant="glass" onClick={() => void load()} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Atualizar
          </NeonButton>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">Nenhuma página encontrada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((page) => (
            <GlassCard key={page.id} className="overflow-hidden flex flex-col group">
              <div className="h-32 bg-muted/30 relative">
                {page.profile_image ? (
                  <img src={page.profile_image} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt="Capa" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                    Sem imagem
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                   <a 
                     href={`/bio/${page.slug}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="p-2 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors backdrop-blur-sm"
                     title="Ver página"
                   >
                     <ExternalLink className="w-4 h-4" />
                   </a>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg truncate" title={page.title ?? ""}>
                      {page.title || page.slug}
                    </h3>
                    <p className="text-xs text-muted-foreground">/{page.slug}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-2 ${page.is_published ? 'bg-green-500' : 'bg-red-500'}`} title={page.is_published ? "Publicada" : "Privada/Banida"} />
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {page.description || "Sem descrição"}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={page.user?.email ?? ""}>
                    {page.user?.email ?? "Anon"}
                  </span>
                  
                  <NeonButton 
                    variant={page.is_published ? "outline" : "neon"} 
                    className={`h-8 text-xs ${page.is_published ? "text-red-500 hover:text-red-600 border-red-500/30" : ""}`}
                    onClick={() => togglePublish(page.id, page.is_published)}
                  >
                    {page.is_published ? (
                      <><EyeOff className="w-3 h-3 mr-1" /> Banir/Ocultar</>
                    ) : (
                      <><Eye className="w-3 h-3 mr-1" /> Publicar</>
                    )}
                  </NeonButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
