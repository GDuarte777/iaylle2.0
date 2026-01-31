import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Palette, Link as LinkIcon, Check, Image as ImageIcon, Layout, Type, Eye, Trash2, Edit } from "lucide-react";
import { NeonButton } from "@/components/NeonButton";

interface LinkBioTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LinkBioTutorialModal({ isOpen, onClose }: LinkBioTutorialModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl h-[80vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader className="p-6 pb-2 border-b border-white/10">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <NeonButton variant="neon" className="pointer-events-none w-8 h-8 p-0 flex items-center justify-center">
              <span className="text-lg">💡</span>
            </NeonButton>
            Como usar o Link na Bio
          </DialogTitle>
          <DialogDescription>
            Guia completo para personalizar sua página e gerenciar seus links.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="appearance" className="h-full flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="w-full justify-start bg-muted/20 p-1">
                <TabsTrigger value="appearance" className="flex-1 gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Palette className="w-4 h-4" />
                  Aparência & Temas
                </TabsTrigger>
                <TabsTrigger value="links" className="flex-1 gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <LinkIcon className="w-4 h-4" />
                  Links & Produtos
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-6">
              <TabsContent value="appearance" className="mt-0 space-y-8">
                {/* Seção de Temas */}
                <section className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
                    <Layout className="w-5 h-5" />
                    Temas e Layouts
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-2">
                      <div className="h-24 rounded-lg bg-black/40 w-full mb-2 flex flex-col justify-center gap-2 p-3 border border-white/5">
                        <div className="h-2 w-3/4 bg-white/20 rounded-full mx-auto" />
                        <div className="h-8 w-full bg-white/5 rounded-md border border-white/10" />
                        <div className="h-8 w-full bg-white/5 rounded-md border border-white/10" />
                      </div>
                      <h4 className="font-medium">Clássico</h4>
                      <p className="text-sm text-muted-foreground">Lista simples e elegante, perfeita para quem quer foco direto nos links.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-2">
                      <div className="h-24 rounded-lg bg-black/40 w-full mb-2 p-3 border border-white/5 grid grid-cols-2 gap-2">
                         <div className="bg-white/5 rounded-md border border-white/10" />
                         <div className="bg-white/5 rounded-md border border-white/10" />
                         <div className="bg-white/5 rounded-md border border-white/10" />
                         <div className="bg-white/5 rounded-md border border-white/10" />
                      </div>
                      <h4 className="font-medium">Grade</h4>
                      <p className="text-sm text-muted-foreground">Visual moderno em cards, ideal para destacar múltiplos conteúdos visualmente.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-2">
                      <div className="h-24 rounded-lg bg-black/40 w-full mb-2 p-2 border border-white/5 flex items-center justify-center">
                         <div className="w-2/3 h-full bg-white/5 rounded-md border border-white/10 flex flex-col p-1 gap-1">
                            <div className="flex-1 bg-white/10 rounded-sm w-full" />
                            <div className="h-1.5 w-1/2 bg-white/20 rounded-full" />
                            <div className="h-3 w-full bg-primary/20 rounded-sm" />
                         </div>
                      </div>
                      <h4 className="font-medium">Loja</h4>
                      <p className="text-sm text-muted-foreground">Vitrine de produtos completa, otimizada para vendas e conversão.</p>
                    </div>
                  </div>
                </section>

                {/* Seção de Personalização */}
                <section className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
                    <Edit className="w-5 h-5" />
                    Personalização Avançada
                  </h3>
                  <div className="grid gap-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/10">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Type className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Tipografia e Cores</h4>
                        <p className="text-sm text-muted-foreground">
                          Escolha entre fontes Sans, Serif ou Mono. Personalize a cor do texto e dos botões para combinar com sua marca.
                          As alterações são refletidas em tempo real na pré-visualização ao lado.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/10">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Layout className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Estilo dos Botões</h4>
                        <p className="text-sm text-muted-foreground">
                          Mais de 8 estilos disponíveis: Glassmorphism, Neon, Minimal, Brutalist, entre outros.
                          Ajuste a transparência e cor de fundo para criar efeitos únicos.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="links" className="mt-0 space-y-8">
                {/* Adicionando Links */}
                <section className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
                    <LinkIcon className="w-5 h-5" />
                    Adicionando Itens
                  </h3>
                  <div className="bg-muted/10 rounded-xl p-6 space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                          <p className="text-sm">Clique no botão <strong>"Adicionar Link"</strong> no topo da lista.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                          <p className="text-sm">Escolha o tipo: <strong>Simples</strong> (apenas link) ou <strong>Produto</strong> (com preço e imagem).</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                          <p className="text-sm">Preencha o título e a URL (obrigatórios).</p>
                        </div>
                      </div>
                      <div className="w-full md:w-1/3 bg-black/40 rounded-lg p-4 border border-white/5">
                        <div className="space-y-3">
                          <div className="h-8 bg-white/10 rounded w-full animate-pulse" />
                          <div className="h-8 bg-white/10 rounded w-3/4 animate-pulse" />
                          <div className="h-20 bg-white/5 rounded w-full border border-dashed border-white/10 flex items-center justify-center text-xs text-muted-foreground">
                            <ImageIcon className="w-4 h-4 mr-2" /> Upload Imagem
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Gerenciamento */}
                <section className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
                    <Eye className="w-5 h-5" />
                    Gerenciamento e Visibilidade
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/10 border border-white/5">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Edit className="w-4 h-4 text-blue-400" />
                        Edição Rápida
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Clique no ícone de lápis em qualquer card para abrir o modo de edição.
                        Você pode alterar preços, imagens e descrições a qualquer momento.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/10 border border-white/5">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Trash2 className="w-4 h-4 text-red-400" />
                        Remoção Segura
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Ao excluir um item, pediremos confirmação. A remoção é permanente e apaga as imagens associadas.
                      </p>
                    </div>
                  </div>
                </section>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
