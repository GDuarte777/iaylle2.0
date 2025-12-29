import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Link as LinkIcon, 
  Instagram, 
  Twitter, 
  Facebook, 
  Youtube, 
  Linkedin, 
  Plus, 
  Trash2, 
  GripVertical, 
  Palette, 
  Smartphone,
  Eye,
  Save,
  Share2,
  Image as ImageIcon,
  Type,
  ShoppingBag,
  Search,
  Menu,
  Home,
  User,
  Phone,
  Mail,
  MapPin,
  X,
  Sun,
  Moon,
  Pencil,
  Globe,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  Music2,
  Loader2
} from "lucide-react";
import { 
  FaWhatsapp, 
  FaInstagram, 
  FaTwitter, 
  FaFacebook, 
  FaYoutube, 
  FaTiktok, 
  FaLinkedin, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt 
} from "react-icons/fa";
import { motion, Reorder } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  enabled: boolean;
  animation?: "none" | "pulse" | "bounce" | "glow";
  type?: "simple" | "product" | "featured";
  price?: string;
  description?: string;
  image?: string;
  category?: string;
  currency?: string;
  buttonLabel?: string;
  badgeLabel?: string;
  badgeColor?: string;
}

interface ThemeConfig {
  backgroundType: "solid" | "gradient" | "image";
  backgroundColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  backgroundImage: string;
  layout: "classic" | "grid" | "shop";
  buttonStyle: "rounded" | "square" | "pill" | "glass" | "neon" | "glitch" | "brutalist" | "minimal" | "liquid" | "cyberpunk";
  buttonColor: string;
  buttonTextColor: string;
  buttonTransparency: number;
  textColor: string;
  fontFamily: "sans" | "serif" | "mono";
  // Shop Specific Config
  shopLogo?: string;
  shopHeaderType?: 'text' | 'image';
  shopHeaderText?: string;
  shopHeaderImage?: string;
  shopHeaderFontFamily?: "sans" | "serif" | "mono";
  shopHeaderFontSize?: "sm" | "base" | "lg" | "xl" | "2xl";
  shopHeaderFontWeight?: "normal" | "medium" | "bold" | "extrabold";
  shopBannerShowTitle?: boolean;
  shopBannerShowSubtitle?: boolean;
  shopBannerImage?: string;
  shopBannerTitle?: string;
  shopBannerSubtitle?: string;
  shopCategories?: { id: string; name: string; image?: string }[];
  shopSocials?: { id: string; icon: string; url: string }[];
  shopThemeMode?: 'dark' | 'light';
}

const hexToRgba = (hex: string, alpha: number) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const defaultThemeConfig: ThemeConfig = {
  backgroundType: "gradient",
  backgroundColor: "#000000",
  backgroundGradientFrom: "#0f172a",
  backgroundGradientTo: "#3b0764",
  backgroundImage: "",
  layout: "classic",
  buttonStyle: "glass",
  buttonColor: "#ffffff",
  buttonTextColor: "#ffffff",
  buttonTransparency: 10,
  textColor: "#ffffff",
  fontFamily: "sans",
  shopHeaderType: 'text',
  shopHeaderText: 'Sua Marca',
  shopHeaderFontFamily: 'sans',
  shopHeaderFontSize: 'lg',
  shopHeaderFontWeight: 'bold',
  shopBannerShowTitle: true,
  shopBannerShowSubtitle: true,
  shopBannerTitle: "Nova Coleção",
  shopBannerSubtitle: "Confira os destaques da semana",
  shopCategories: [
    { id: '1', name: 'Lançamentos' },
    { id: '2', name: 'Promoções' },
    { id: '3', name: 'Populares' }
  ],
  shopSocials: [],
  shopThemeMode: 'dark'
};

const copyToClipboard = (value: string) => {
  if (!value) return;
  navigator.clipboard.writeText(value);
  toast.success("Copiado para a área de transferência!");
};

const isValidDomain = (value: string) => {
  const domain = value.trim().toLowerCase();
  if (!domain) return false;
  const regex = /^(?!:\/\/)([a-z0-9-]+\.)+[a-z]{2,}$/;
  return regex.test(domain);
};

export default function LinkBio() {
  console.log("LinkBio component rendering...");
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  // Preview State
  const [activeTab, setActiveTab] = useState("design");
  const [username, setUsername] = useState("@suamarca");
  const [bio, setBio] = useState("Criadora de Conteúdo | Lifestyle");
  const [profileImage, setProfileImage] = useState("https://github.com/shadcn.png");
  const [newCategory, setNewCategory] = useState("");
  const [newSocial, setNewSocial] = useState({ icon: "instagram", url: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  
  // Publish State
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [slug, setSlug] = useState("suamarca");
  const [isPublished, setIsPublished] = useState(false);

  // Add Link Modal State
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [newLinkData, setNewLinkData] = useState<{
    title: string;
    url: string;
    type: "simple" | "product";
    price: string;
    description: string;
    category: string;
    image: string;
    animation: "none" | "pulse" | "bounce" | "glow";
    currency: string;
    buttonLabel: string;
    badgeLabel: string;
    badgeColor: string;
  }>({
    title: "",
    url: "",
    type: "simple",
    price: "",
    description: "",
    category: "",
    image: "",
    animation: "none",
    currency: "R$",
    buttonLabel: "Comprar",
    badgeLabel: "Promoção",
    badgeColor: "#000000"
  });

  // Links State
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultThemeConfig);

  // Fetch Data on Mount
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 1. Get Bio Page
        const { data: existingPage, error: existingPageError } = await supabase
          .from('bio_pages')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingPageError) throw existingPageError;

        let page = existingPage;

        if (!page) {
          // Create default page if not exists
          const defaultSlug = user.email.split('@')[0] + '-' + Math.random().toString(36).substr(2, 4);
          const { data: newPage, error: createError } = await supabase
            .from('bio_pages')
            .insert({
              user_id: user.id,
              slug: defaultSlug,
              title: user.name,
              description: 'Bem-vindo ao meu espaço!',
              profile_image: user.avatar,
              theme_config: defaultThemeConfig
            })
            .select()
            .single();
            
          if (createError) throw createError;
          page = newPage;
        }

        if (page) {
          setPageId(page.id);
          setUsername(page.title || user.name);
          setBio(page.description || "");
          setProfileImage(page.profile_image || user.avatar || "");
          setSlug(page.slug);
          setIsPublished(page.is_published);
          setThemeConfig(page.theme_config as ThemeConfig || defaultThemeConfig);

          // 2. Get Links
          const { data: pageLinks, error: linksError } = await supabase
            .from('bio_links')
            .select('*')
            .eq('page_id', page.id)
            .order('order_index', { ascending: true });

          if (linksError) throw linksError;

          setLinks(pageLinks?.map(l => ({
            id: l.id,
            title: l.title,
            url: l.url,
            enabled: l.is_active,
            type: l.type as any,
            animation: l.animation as any,
            price: l.price,
            description: l.description,
            image: l.image,
            category: l.category,
            currency: l.currency,
            buttonLabel: l.button_label,
            badgeLabel: l.badge_label,
            badgeColor: l.badge_color
          })) || []);
        }

      } catch (error) {
        console.error('Error fetching bio data:', error);
        toast.error('Erro ao carregar dados.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Save Changes
  const saveChanges = async (publishedOverride?: boolean) => {
    if (!pageId || !user) return;

    try {
      setIsSaving(true);
      
      const publishedState = publishedOverride !== undefined ? publishedOverride : isPublished;

      // 1. Update Page Info & Theme
      const { error: pageError } = await supabase
        .from('bio_pages')
        .update({
          title: username,
          description: bio,
          profile_image: profileImage,
          slug: slug,
          is_published: publishedState,
          theme_config: themeConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId);

      if (pageError) throw pageError;

      const keptIds: string[] = [];

      for (const link of links) {
        const payload: any = {
          page_id: pageId,
          title: link.title,
          url: link.url,
          type: link.type,
          is_active: link.enabled,
          order_index: links.indexOf(link),
          animation: link.animation,
          price: link.price,
          image: link.image,
          category: link.category,
          description: link.description,
          currency: link.currency,
          button_label: link.buttonLabel,
          badge_label: link.badgeLabel,
          badge_color: link.badgeColor
        };

        if (link.id.length > 20) {
          await supabase.from('bio_links').update(payload).eq('id', link.id);
          keptIds.push(link.id);
        } else {
          const { data } = await supabase.from('bio_links').insert(payload).select().single();
          if (data) {
            keptIds.push(data.id);
            setLinks(prev => prev.map(p => p.id === link.id ? { ...p, id: data.id } : p));
          }
        }
      }

      const { data: dbLinks } = await supabase.from('bio_links').select('id').eq('page_id', pageId);
      if (dbLinks) {
        const toDelete = dbLinks.filter(db => !keptIds.includes(db.id)).map(db => db.id);
        if (toDelete.length > 0) {
          await supabase.from('bio_links').delete().in('id', toDelete);
        }
      }

      toast.success("Alterações salvas com sucesso!");

    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublished(true);
    await saveChanges();
    setIsPublishOpen(false);
    toast.success("Sua página está no ar!");
  };

  const openAddLinkModal = () => {
    setNewLinkData({
      title: "",
      url: "",
      type: themeConfig.layout === 'shop' ? 'product' : 'simple',
      price: "",
      description: "",
      category: themeConfig.shopCategories?.[0]?.name || "",
      image: "",
      animation: "none",
      currency: "R$",
      buttonLabel: "Comprar",
      badgeLabel: "Promoção",
      badgeColor: "#000000"
    });
    setIsAddLinkOpen(true);
  };

  const openEditLinkModal = (link: LinkItem) => {
    setNewLinkData({
      title: link.title,
      url: link.url,
      type: (link.type === 'featured' ? 'product' : link.type) || (themeConfig.layout === 'shop' ? 'product' : 'simple'),
      price: link.price || "",
      description: link.description || "",
      category: link.category || "",
      image: link.image || "",
      animation: link.animation || "none",
      currency: link.currency || "R$",
      buttonLabel: link.buttonLabel || "Comprar",
      badgeLabel: link.badgeLabel || "Promoção",
      badgeColor: link.badgeColor || "#000000"
    });
    setEditingLinkId(link.id);
    setIsAddLinkOpen(true);
  };

  const confirmAddLink = () => {
    if (!newLinkData.title) {
      toast.error("Por favor, insira um título.");
      return;
    }

    if (editingLinkId) {
      // Update existing link
      setLinks(links.map(l => l.id === editingLinkId ? {
        ...l,
        title: newLinkData.title,
        url: newLinkData.url,
        type: newLinkData.type,
        animation: newLinkData.animation,
        price: newLinkData.type === 'product' ? (newLinkData.price || "0,00") : undefined,
        description: newLinkData.type === 'product' ? newLinkData.description : undefined,
        category: newLinkData.type === 'product' ? newLinkData.category : undefined,
        image: newLinkData.type === 'product' ? newLinkData.image : l.image,
        currency: newLinkData.type === 'product' ? newLinkData.currency : undefined,
        buttonLabel: newLinkData.type === 'product' ? newLinkData.buttonLabel : undefined,
        badgeLabel: newLinkData.type === 'product' ? newLinkData.badgeLabel : undefined,
        badgeColor: newLinkData.type === 'product' ? newLinkData.badgeColor : undefined
      } : l));
      toast.success("Item atualizado com sucesso!");
    } else {
      // Add new link
      const newLink: LinkItem = {
        id: Math.random().toString(36).substring(7),
        title: newLinkData.title,
        url: newLinkData.url || "https://",
        enabled: true,
        animation: newLinkData.animation,
        type: newLinkData.type,
        price: newLinkData.type === 'product' ? (newLinkData.price || "0,00") : undefined,
        description: newLinkData.type === 'product' ? newLinkData.description : undefined,
        category: newLinkData.type === 'product' ? newLinkData.category : undefined,
        image: newLinkData.type === 'product' ? newLinkData.image : undefined,
        currency: newLinkData.type === 'product' ? newLinkData.currency : undefined,
        buttonLabel: newLinkData.type === 'product' ? newLinkData.buttonLabel : undefined,
        badgeLabel: newLinkData.type === 'product' ? newLinkData.badgeLabel : undefined,
        badgeColor: newLinkData.type === 'product' ? newLinkData.badgeColor : undefined
      };
      setLinks([...links, newLink]);
      toast.success("Item adicionado com sucesso!");
    }
    
    setIsAddLinkOpen(false);
    setEditingLinkId(null);
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const updateLink = (id: string, field: keyof LinkItem, value: any) => {
    setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'bg' | 'shop-banner' | 'shop-logo' | 'shop-header') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'profile') setProfileImage(reader.result as string);
        else if (target === 'bg') setThemeConfig({ ...themeConfig, backgroundImage: reader.result as string });
        else if (target === 'shop-banner') setThemeConfig({ ...themeConfig, shopBannerImage: reader.result as string });
        else if (target === 'shop-logo') setThemeConfig({ ...themeConfig, shopLogo: reader.result as string });
        else if (target === 'shop-header') setThemeConfig({ ...themeConfig, shopHeaderImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThemeConfig({
          ...themeConfig,
          shopCategories: themeConfig.shopCategories?.map(cat => 
            cat.id === categoryId ? { ...cat, image: reader.result as string } : cat
          )
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addCategory = () => {
    if (newCategory.trim()) {
      setThemeConfig({
        ...themeConfig,
        shopCategories: [...(themeConfig.shopCategories || []), { id: Math.random().toString(36).substr(2, 9), name: newCategory }]
      });
      setNewCategory("");
    }
  };

  const removeCategory = (id: string) => {
    setThemeConfig({
      ...themeConfig,
      shopCategories: themeConfig.shopCategories?.filter(c => c.id !== id)
    });
  };

  const addSocial = () => {
    if (newSocial.url.trim()) {
      setThemeConfig({
        ...themeConfig,
        shopSocials: [...(themeConfig.shopSocials || []), { id: Math.random().toString(36).substr(2, 9), ...newSocial }]
      });
      setNewSocial({ ...newSocial, url: "" });
    }
  };

  const removeSocial = (id: string) => {
    setThemeConfig({
      ...themeConfig,
      shopSocials: themeConfig.shopSocials?.filter(s => s.id !== id)
    });
  };

  const handleSave = async () => {
    await saveChanges();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Loader2 className="w-8 h-8 animate-spin text-neon-blue" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
      `}</style>
      <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 lg:h-[calc(100vh-140px)]">
          
          {/* Editor Section */}
          <div className="lg:col-span-7 flex flex-col h-auto lg:h-full order-1 lg:order-none">
            <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl lg:text-3xl font-bold mb-1 lg:mb-2 flex items-center gap-2 lg:gap-3">
                  <LinkIcon className="w-5 h-5 lg:w-8 lg:h-8 text-neon-blue" />
                  Link na Bio
                </h1>
                <p className="text-xs lg:text-base text-muted-foreground">
                  Personalize sua árvore de links com design único.
                </p>
              </div>
              
              <div className="flex gap-2">
                <NeonButton 
                  variant="neon" 
                  className="flex-1 sm:flex-none justify-center gap-2 min-w-[120px]"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Salvando..." : "Salvar"}
                </NeonButton>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0, 242, 255, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPublishOpen(true)}
                  className="relative group overflow-hidden bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/20 hover:border-neon-blue text-foreground dark:text-white rounded-full px-6 py-2.5 flex items-center gap-3 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <Globe className="w-4 h-4 text-neon-blue" />
                  <span className="font-bold text-sm">Publicar</span>
                </motion.button>
              </div>
            </div>

            {/* Publish Dialog */}
            <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
              <DialogContent className="bg-background border-border text-foreground dark:text-white w-[95%] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl sm:rounded-2xl gap-0">
                <DialogHeader className="space-y-2 mb-4">
                  <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-neon-blue" />
                    Publicar seu Site
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">
                    Configure como seus visitantes acessarão sua página.
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="default" className="mt-2 sm:mt-4">
                  <TabsList className="w-full bg-muted/50 dark:bg-muted/20 border border-border h-10 sm:h-11">
                    <TabsTrigger value="default" className="flex-1 text-xs sm:text-sm">Domínio Padrão</TabsTrigger>
                    <TabsTrigger value="custom" className="flex-1 text-xs sm:text-sm">Domínio Próprio</TabsTrigger>
                  </TabsList>

                  <TabsContent value="default" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                    <div className="space-y-4">
                       <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20">
                          <h3 className="text-neon-blue font-bold mb-2 flex items-center gap-2 text-sm sm:text-base">
                            <Check className="w-4 h-4" />
                            Domínio Gratuito Ativo
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                            Seu site está acessível através do domínio padrão da IAylle.
                          </p>
                       </div>

                       <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Seu Link Personalizado</Label>
                          <div className="flex items-center gap-2">
                             <div className="flex-1 flex items-center bg-muted/50 dark:bg-black/20 border border-border dark:border-white/10 rounded-lg px-3 h-10 sm:h-12">
                                <span className="text-muted-foreground dark:text-gray-500 mr-1 text-xs sm:text-sm">iaylle.bio/</span>
                                <input 
                                  value={slug}
                                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                                  className="bg-transparent border-none outline-none text-foreground dark:text-white flex-1 font-medium text-xs sm:text-sm"
                                  placeholder="seunome"
                                />
                             </div>
                             <Button 
                               variant="outline" 
                               className="h-10 sm:h-12 border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/5 px-3 sm:px-4"
                               onClick={() => copyToClipboard(`https://iaylle.bio/${slug}`)}
                             >
                               <Copy className="w-4 h-4" />
                             </Button>
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-gray-500">
                            Este é o link que você compartilhará nas suas redes sociais.
                          </p>
                       </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="custom" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                    <div className="space-y-4">
                       <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                          <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2 text-sm sm:text-base">
                            <ExternalLink className="w-4 h-4" />
                            Domínio Personalizado (Pro)
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                            Conecte seu próprio domínio (ex: www.suamarca.com.br) para maior profissionalismo.
                          </p>
                       </div>

                       <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Seu Domínio</Label>
                          <Input 
                             value={customDomain}
                             onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                             className={`bg-muted/50 dark:bg-black/20 border-border dark:border-white/10 h-10 sm:h-12 text-xs sm:text-sm ${customDomain && !isValidDomain(customDomain) ? 'border-red-500 focus:border-red-500' : ''}`}
                             placeholder="Ex: www.suamarca.com.br"
                          />
                          {customDomain && !isValidDomain(customDomain) && (
                            <p className="text-[10px] sm:text-xs text-red-500">Formato de domínio inválido</p>
                          )}
                       </div>

                       {customDomain && isValidDomain(customDomain) ? (
                         <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                           <div className="p-4 rounded-lg bg-muted/50 dark:bg-muted/20 border border-border space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2 sm:gap-0">
                                <h4 className="font-semibold text-sm text-muted-foreground dark:text-gray-300">Configuração de DNS (CNAME)</h4>
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 px-2 py-1 rounded border border-yellow-500/20 flex items-center gap-1 w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                  Aguardando Configuração
                                </span>
                              </div>
                              
                              <div className="text-xs text-muted-foreground dark:text-gray-400 leading-relaxed">
                                Para que seu domínio funcione, você precisa acessar o painel onde comprou seu domínio (Registro.br, GoDaddy, Hostgator, etc) e criar um novo registro DNS com as informações abaixo:
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-background dark:bg-black/20 p-3 rounded-lg border border-border dark:border-white/5">
                                 <div className="flex flex-col">
                                   <span className="block text-[10px] text-muted-foreground dark:text-gray-500 uppercase tracking-wider mb-1">Tipo</span>
                                   <span className="font-mono text-neon-blue font-bold bg-muted dark:bg-black/40 p-1.5 rounded border border-border dark:border-white/5 text-center sm:text-left">CNAME</span>
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="block text-[10px] text-muted-foreground dark:text-gray-500 uppercase tracking-wider mb-1">Nome / Host</span>
                                   <span className="font-mono text-foreground dark:text-white font-bold bg-muted dark:bg-muted/20 p-1.5 rounded border border-border text-center sm:text-left">www</span>
                                 </div>
                                 <div className="sm:col-span-2 pt-2 border-t border-border mt-2">
                                   <span className="block text-[10px] text-muted-foreground dark:text-gray-500 uppercase tracking-wider mb-1">Valor / Destino</span>
                                   <div className="flex items-center justify-between bg-muted dark:bg-muted/20 p-2 rounded border border-border group hover:border-neon-blue/50 transition-colors cursor-pointer" onClick={() => copyToClipboard("domains.iaylle.com")}>
                                      <span className="font-mono text-foreground dark:text-white text-xs sm:text-sm break-all">domains.iaylle.com</span>
                                      <Copy className="w-3 h-3 text-muted-foreground dark:text-gray-500 group-hover:text-neon-blue shrink-0 ml-2" />
                                   </div>
                                 </div>
                              </div>

                              <div className="flex gap-2 text-xs text-yellow-600 dark:text-yellow-500/80 bg-yellow-500/10 dark:bg-yellow-500/5 p-3 rounded border border-yellow-500/20 dark:border-yellow-500/10">
                                <div className="shrink-0 mt-0.5">⚠️</div>
                                <div>
                                  Após configurar, pode levar de 1 a 24 horas para que o domínio comece a funcionar devido à propagação de DNS.
                                </div>
                              </div>
                           </div>
                           
                           <Button className="w-full h-10 sm:h-11 bg-muted hover:bg-muted/80 dark:bg-white/5 dark:hover:bg-white/10 text-foreground dark:text-white border border-border dark:border-white/10 text-xs sm:text-sm" onClick={() => toast.info("Verificando propagação de DNS...", { description: "Isso pode levar alguns minutos." })}>
                             Verificar Status da Conexão
                           </Button>
                         </div>
                       ) : (
                         <div className="space-y-4 mt-4">
                            <div className="p-4 rounded-lg bg-muted/50 dark:bg-muted/20 border border-border text-center py-8">
                              <div className="w-12 h-12 rounded-full bg-background dark:bg-muted/10 flex items-center justify-center mx-auto mb-3 border border-border dark:border-transparent">
                                  <Globe className="w-6 h-6 text-muted-foreground dark:text-gray-500" />
                               </div>
                               <h4 className="text-sm font-semibold text-foreground dark:text-gray-300 mb-1">Digite seu domínio acima</h4>
                               <p className="text-xs text-muted-foreground dark:text-gray-500 max-w-[250px] mx-auto">
                                 Insira o domínio que você deseja conectar para ver as instruções de configuração DNS.
                               </p>
                            </div>
                         </div>
                       )}
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                  <Button variant="ghost" onClick={() => setIsPublishOpen(false)} className="hover:bg-muted dark:hover:bg-white/10 h-10 sm:h-11 w-full sm:w-auto text-xs sm:text-sm order-2 sm:order-1">Cancelar</Button>
                  <Button onClick={handlePublish} className="bg-neon-blue text-black hover:bg-neon-blue/80 font-bold h-10 sm:h-11 w-full sm:w-auto text-xs sm:text-sm order-1 sm:order-2">
                    Salvar e Publicar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <GlassCard className="flex-1 lg:overflow-hidden flex flex-col min-h-[500px]">
              <Tabs defaultValue="design" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
                <div className="p-3 lg:p-6 border-b border-border">
                  <TabsList className="grid w-full grid-cols-2 h-9 lg:h-10">
                    <TabsTrigger value="design" className="flex gap-2 text-xs lg:text-sm">
                      <Palette className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      Aparência
                    </TabsTrigger>
                    <TabsTrigger value="links" className="flex gap-2 text-xs lg:text-sm">
                      <LinkIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      Links/Produtos
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                  <TabsContent value="links" className="mt-0 space-y-6">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={openAddLinkModal}
                      className="w-full py-4 rounded-xl border border-dashed border-border hover:border-neon-blue/50 hover:bg-neon-blue/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-neon-blue group mb-6"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted/50 dark:bg-muted/10 flex items-center justify-center group-hover:bg-neon-blue/20 transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="font-medium">Adicionar Link/Produto</span>
                    </motion.button>

                    <Dialog open={isAddLinkOpen} onOpenChange={setIsAddLinkOpen}>
                      <DialogContent className="bg-background dark:bg-[#161616] border-border text-foreground dark:text-white w-[90%] sm:w-full max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-2xl p-3 sm:p-6 gap-0">
                        <DialogHeader className="space-y-2 mb-2 sm:mb-4">
                          <DialogTitle className="text-lg sm:text-xl font-semibold">{themeConfig.layout === 'shop' ? 'Novo Produto' : 'Novo Link'}</DialogTitle>
                          <DialogDescription className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                            {themeConfig.layout === 'shop' 
                              ? 'Adicione um novo produto à sua vitrine.' 
                              : 'Adicione um novo link à sua lista.'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 sm:gap-4 py-2">
                            <div className="grid gap-1.5 sm:gap-2">
                              <Label htmlFor="title" className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Título</Label>
                              <Input id="title" value={newLinkData.title} onChange={(e) => setNewLinkData({...newLinkData, title: e.target.value})} className="bg-muted/50 dark:bg-black/20 border-border h-10 sm:h-11 text-sm focus:border-neon-blue/50 transition-colors" placeholder={themeConfig.layout === 'shop' ? "Nome do Produto" : "Título do Link"} />
                            </div>

                            <div className="grid gap-1.5 sm:gap-2">
                                <Label htmlFor="animation" className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Animação / Destaque</Label>
                                <Select 
                                    value={newLinkData.animation}
                                    onValueChange={(value) => setNewLinkData({...newLinkData, animation: value as any})}
                                >
                                    <SelectTrigger className="w-full h-10 sm:h-11 bg-muted/50 dark:bg-black/20 border border-border rounded-md text-sm px-3 outline-none focus:border-neon-blue/50 transition-colors text-foreground dark:text-white">
                                        <SelectValue placeholder="Selecione uma animação" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background dark:bg-[#161616] border-border">
                                        <SelectItem value="none">Nenhuma</SelectItem>
                                        <SelectItem value="pulse">Pulsar (Pulse)</SelectItem>
                                        <SelectItem value="bounce">Pular (Bounce)</SelectItem>
                                        <SelectItem value="glow">Brilhar (Glow)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {themeConfig.layout === 'shop' && (
                              <>
                                <div className="grid gap-1.5 sm:gap-2">
                                  <Label className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Imagem do Produto</Label>
                                  <div className="h-24 sm:h-40 bg-muted/50 dark:bg-black/20 border-2 border-dashed border-border rounded-xl flex items-center justify-center relative group hover:border-neon-blue/50 hover:bg-neon-blue/5 transition-all cursor-pointer">
                                    {newLinkData.image ? (
                                      <div className="relative w-full h-full p-2">
                                        <img src={newLinkData.image} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                            <Pencil className="w-6 h-6 text-white" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center p-4">
                                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-muted dark:bg-muted/10 flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-muted-foreground group-hover:text-neon-blue transition-colors" />
                                        </div>
                                        <span className="text-[10px] sm:text-sm text-muted-foreground font-medium">Clique para enviar imagem</span>
                                      </div>
                                    )}
                                    <input 
                                      type="file" 
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            const result = reader.result as string;
                                            setNewLinkData({...newLinkData, image: result});
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                      accept="image/*"
                                    />
                                  </div>
                                </div>

                                <div className="grid gap-1.5 sm:gap-2">
                                   <Label htmlFor="description" className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Descrição</Label>
                                   <Input id="description" value={newLinkData.description} onChange={(e) => setNewLinkData({...newLinkData, description: e.target.value})} className="bg-muted/50 dark:bg-black/20 border-border dark:border-white/10 h-10 sm:h-11 text-sm focus:border-neon-blue/50 transition-colors" placeholder="Breve descrição do produto" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                  <div className="grid gap-1.5 sm:gap-2">
                                    <Label htmlFor="currency" className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Moeda</Label>
                                    <Select
                                      value={newLinkData.currency}
                                      onValueChange={(value) => setNewLinkData({ ...newLinkData, currency: value })}
                                    >
                                      <SelectTrigger className="w-full h-10 sm:h-11 bg-muted/50 dark:bg-black/20 border border-border dark:border-white/10 rounded-md text-sm px-3 outline-none focus:border-neon-blue/50 transition-colors">
                                        <SelectValue placeholder="Selecione a moeda" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background dark:bg-popover border-border">
                                        <SelectItem value="R$">R$ Real</SelectItem>
                                        <SelectItem value="$">$ Dólar</SelectItem>
                                        <SelectItem value="€">€ Euro</SelectItem>
                                        <SelectItem value="£">£ Libra</SelectItem>
                                        <SelectItem value="¥">¥ Iene</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5 sm:gap-2">
                                    <Label htmlFor="price" className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Preço</Label>
                                    <Input id="price" value={newLinkData.price} onChange={(e) => setNewLinkData({ ...newLinkData, price: e.target.value })} className="bg-muted/50 dark:bg-black/20 border-border dark:border-white/10 h-10 sm:h-11 text-sm focus:border-neon-blue/50 transition-colors" placeholder="0,00" />
                                  </div>
                                  <div className="grid gap-1.5 sm:gap-2">
                                    <Label htmlFor="category" className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Categoria</Label>
                                    <Select
                                      value={newLinkData.category}
                                      onValueChange={(value) => setNewLinkData({ ...newLinkData, category: value })}
                                    >
                                      <SelectTrigger className="w-full h-10 sm:h-11 bg-muted/50 dark:bg-black/20 border border-border dark:border-white/10 rounded-md text-sm px-3 outline-none focus:border-neon-blue/50 transition-colors">
                                        <SelectValue placeholder="Selecione uma categoria" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background dark:bg-popover border-border">
                                        {themeConfig.shopCategories?.map(cat => (
                                          <SelectItem key={cat.id} value={cat.name}>
                                            {cat.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="grid gap-1.5 sm:gap-2">
                                  <Label htmlFor="buttonLabel" className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Texto do botão de compra</Label>
                                  <Input id="buttonLabel" value={newLinkData.buttonLabel} onChange={(e) => setNewLinkData({ ...newLinkData, buttonLabel: e.target.value })} className="bg-muted/50 dark:bg-black/20 border-border dark:border-white/10 h-10 sm:h-11 text-sm focus:border-neon-blue/50 transition-colors" placeholder="Comprar" />
                                </div>

                                <div className="grid gap-1.5 sm:gap-2">
                                  <Label htmlFor="badgeLabel" className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Tag do produto</Label>
                                  <Input id="badgeLabel" value={newLinkData.badgeLabel} onChange={(e) => setNewLinkData({ ...newLinkData, badgeLabel: e.target.value })} className="bg-muted/50 dark:bg-black/20 border-border dark:border-white/10 h-10 sm:h-11 text-sm focus:border-neon-blue/50 transition-colors" placeholder="Promoção" />
                                </div>

                                <div className="grid gap-2 sm:gap-3">
                                  <Label className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-300">Cor da tag</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      "#000000", "#FFFFFF", "#EF4444", "#F97316", "#EAB308", 
                                      "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899"
                                    ].map((color) => (
                                      <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewLinkData({ ...newLinkData, badgeColor: color })}
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${
                                          newLinkData.badgeColor === color 
                                            ? 'border-neon-blue scale-110 ring-2 ring-neon-blue/20' 
                                            : 'border-border hover:scale-105 hover:border-neon-blue/50'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                      >
                                        {newLinkData.badgeColor === color && (
                                          <Check className={`w-4 h-4 ${['#FFFFFF', '#EAB308', '#22C55E'].includes(color) ? 'text-black' : 'text-white'}`} />
                                        )}
                                      </button>
                                    ))}
                                    
                                    <div className="relative group" title="Cor personalizada">
                                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all shadow-sm ${
                                        ![
                                          "#000000", "#FFFFFF", "#EF4444", "#F97316", "#EAB308", 
                                          "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899"
                                        ].includes(newLinkData.badgeColor)
                                          ? 'border-neon-blue scale-110 ring-2 ring-neon-blue/20'
                                          : 'border-border group-hover:scale-105 group-hover:border-neon-blue/50 bg-muted/50 dark:bg-muted/10'
                                      }`}>
                                        {![
                                          "#000000", "#FFFFFF", "#EF4444", "#F97316", "#EAB308", 
                                          "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899"
                                        ].includes(newLinkData.badgeColor) ? (
                                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: newLinkData.badgeColor }}>
                                             <Check className={`w-4 h-4 text-white drop-shadow-md`} />
                                          </div>
                                        ) : (
                                          <Palette className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <input
                                        type="color"
                                        value={newLinkData.badgeColor}
                                        onChange={(e) => setNewLinkData({ ...newLinkData, badgeColor: e.target.value })}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="grid gap-1.5 sm:gap-2">
                              <Label htmlFor="url" className="text-xs sm:text-sm font-medium text-muted-foreground dark:text-muted-foreground">{themeConfig.layout === 'shop' ? 'Link de Pagamento/Checkout' : 'URL de Destino'}</Label>
                              <Input id="url" value={newLinkData.url} onChange={(e) => setNewLinkData({...newLinkData, url: e.target.value})} className="bg-muted/50 dark:bg-muted/20 border-border h-10 sm:h-11 text-sm focus:border-neon-blue/50 transition-colors" placeholder="https://..." />
                            </div>
                        </div>
                        <DialogFooter className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
                          <Button variant="ghost" onClick={() => setIsAddLinkOpen(false)} className="hover:bg-muted dark:hover:bg-muted hover:text-foreground dark:hover:text-foreground w-full sm:w-auto h-10 text-sm">Cancelar</Button>
                          <Button onClick={confirmAddLink} className="bg-neon-blue text-black hover:bg-neon-blue/80 w-full sm:w-auto h-10 text-sm font-bold">
                            {editingLinkId ? 'Salvar Alterações' : 'Adicionar Item'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Reorder.Group axis="y" values={links} onReorder={setLinks} className="space-y-4">
                      {links.map((link) => (
                        <Reorder.Item key={link.id} value={link}>
                          <div className="bg-card dark:bg-white/5 border border-border dark:border-white/10 rounded-xl p-3 sm:p-4 flex items-center gap-3 group hover:border-neon-blue/50 transition-colors relative overflow-hidden">
                            {/* Drag Handle */}
                            <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 flex items-center self-stretch">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            
                            {/* Image Section - Integrated */}
                            {(themeConfig.layout === 'shop' || link.type === 'product') && (
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted dark:bg-black/40 rounded-lg shrink-0 border border-border dark:border-white/10 flex items-center justify-center overflow-hidden">
                                    {link.image ? (
                                    <img src={link.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                            )}

                            {/* Main Content */}
                            <div className="flex-1 min-w-0 py-1">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <h3 className="text-sm sm:text-base font-semibold text-foreground dark:text-white truncate">{link.title}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mb-1.5">{link.url}</p>
                                
                                {(themeConfig.layout === 'shop' || link.type === 'product') && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {link.price && (
                                          <span className="bg-neon-blue/10 text-neon-blue px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium">
                                            {(link.currency || 'R$') + ' ' + link.price}
                                          </span>
                                        )}
                                        {link.category && <span className="bg-muted dark:bg-muted/20 text-muted-foreground px-1.5 py-0.5 rounded text-[10px] sm:text-xs">{link.category}</span>}
                                        {link.badgeLabel && (
                                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase hidden sm:inline-block">{link.badgeLabel}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2 border-l border-border pl-2 sm:pl-4 ml-1">
                              <Switch 
                                checked={link.enabled}
                                onCheckedChange={(checked) => updateLink(link.id, 'enabled', checked)}
                                className="scale-75 sm:scale-100"
                              />
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-1">
                                  <button 
                                    onClick={() => openEditLinkModal(link)}
                                    className="p-1.5 hover:bg-neon-blue/20 rounded-lg text-muted-foreground hover:text-neon-blue transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                  <button 
                                    onClick={() => removeLink(link.id)}
                                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                              </div>
                            </div>
                          </div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </TabsContent>

                  <TabsContent value="design" className="mt-0 space-y-8">
                    {/* Layout Options */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Tema da Página</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { 
                            id: 'classic', 
                            label: 'Clássico', 
                            desc: 'Lista simples e elegante',
                            icon: <div className="flex flex-col gap-1 w-6"><div className="h-1 w-full bg-current rounded-full opacity-40"/><div className="h-1 w-3/4 bg-current rounded-full mx-auto"/><div className="h-1 w-full bg-current rounded-full opacity-40"/></div> 
                          },
                          { 
                            id: 'grid', 
                            label: 'Grade', 
                            desc: 'Visual moderno em cards',
                            icon: <div className="grid grid-cols-2 gap-1 w-6"><div className="h-2 w-full bg-current rounded-sm"/><div className="h-2 w-full bg-current rounded-sm"/><div className="h-2 w-full bg-current rounded-sm"/><div className="h-2 w-full bg-current rounded-sm"/></div>
                          },
                          { 
                            id: 'shop', 
                            label: 'Loja', 
                            desc: 'Vitrine de produtos',
                            icon: <div className="relative w-6 h-6"><ShoppingBag className="w-full h-full" /><div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-blue rounded-full border-2 border-black"/></div>
                          },
                        ].map((layout) => (
                          <button
                            key={layout.id}
                            onClick={() => setThemeConfig({ ...themeConfig, layout: layout.id as any })}
                            className={`group relative p-6 rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col items-center gap-3 text-center ${
                              themeConfig.layout === layout.id 
                                ? 'border-neon-blue bg-neon-blue/10 shadow-[0_0_20px_rgba(0,242,255,0.1)]' 
                                : 'border-border bg-muted/30 dark:bg-muted/10 hover:bg-muted/50 dark:hover:bg-muted/20 hover:border-border hover:-translate-y-1'
                            }`}
                          >
                            <div className={`p-3 rounded-full transition-colors duration-300 ${
                              themeConfig.layout === layout.id 
                                ? 'bg-neon-blue text-black' 
                                : 'bg-muted dark:bg-muted/20 text-foreground dark:text-white group-hover:bg-muted/80 dark:group-hover:bg-muted/30'
                            }`}>
                              {layout.icon}
                            </div>
                            <div>
                              <span className={`block font-bold text-lg mb-1 transition-colors ${
                                themeConfig.layout === layout.id ? 'text-neon-blue' : 'text-foreground dark:text-white'
                              }`}>
                                {layout.label}
                              </span>
                              <span className="text-xs text-muted-foreground group-hover:text-foreground/70 dark:group-hover:text-white/70 transition-colors">
                                {layout.desc}
                              </span>
                            </div>
                            
                            {/* Active Indicator */}
                            {themeConfig.layout === layout.id && (
                              <motion.div 
                                layoutId="activeTheme"
                                className="absolute inset-0 border-2 border-neon-blue rounded-2xl pointer-events-none"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Profile Settings (Classic/Grid only) */}
                    {(themeConfig.layout === 'classic' || themeConfig.layout === 'grid') && (
                      <div className="space-y-6 border-b border-border dark:border-white/10 pb-6">
                        <div className="flex flex-col items-center mb-8">
                          <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border group-hover:border-neon-blue transition-colors">
                              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ImageIcon className="w-6 h-6 text-white" />
                            </div>
                            <input 
                              type="file" 
                              onChange={(e) => handleImageUpload(e, 'profile')}
                              className="absolute inset-0 opacity-0 cursor-pointer rounded-full"
                              accept="image/*"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Nome de Usuário / Marca</Label>
                            <Input 
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="glass-card border-border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Biografia Curta</Label>
                            <Input 
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              className="glass-card border-border"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shop Configuration */}
                    {themeConfig.layout === 'shop' && (
                      <div className="space-y-6 border-t border-border pt-6 animate-in fade-in slide-in-from-top-4">
                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border border-border">
                          <Label className="text-lg font-semibold flex items-center gap-2">
                             {themeConfig.shopThemeMode === 'light' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-neon-blue" />}
                             Modo {themeConfig.shopThemeMode === 'light' ? 'Claro' : 'Escuro'}
                          </Label>
                          <Switch 
                            checked={themeConfig.shopThemeMode === 'dark'}
                            onCheckedChange={(checked) => setThemeConfig({...themeConfig, shopThemeMode: checked ? 'dark' : 'light'})}
                          />
                        </div>

                        {/* Shop Logo Upload Removed */}

                        <div className="space-y-4">
                           <Label className="text-lg font-semibold flex items-center gap-2">
                             <Type className="w-5 h-5 text-neon-blue" />
                             Nome da Loja (Cabeçalho)
                           </Label>
                           
                           <div className="flex gap-2 bg-muted/30 dark:bg-muted/20 p-1 rounded-lg border border-border/50 mb-4">
                              <button 
                                onClick={() => setThemeConfig({...themeConfig, shopHeaderType: 'text'})}
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${themeConfig.shopHeaderType === 'text' ? 'bg-neon-blue text-black shadow-lg' : 'text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5'}`}
                              >
                                Texto
                              </button>
                              <button 
                                onClick={() => setThemeConfig({...themeConfig, shopHeaderType: 'image'})}
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${themeConfig.shopHeaderType === 'image' ? 'bg-neon-blue text-black shadow-lg' : 'text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/5'}`}
                              >
                                Imagem
                              </button>
                           </div>

                           {themeConfig.shopHeaderType === 'text' ? (
                             <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                               <Input 
                                  value={themeConfig.shopHeaderText || ''}
                                  onChange={(e) => setThemeConfig({...themeConfig, shopHeaderText: e.target.value})}
                                  className="bg-muted/50 dark:bg-muted/20 border-border font-bold text-lg"
                                  placeholder="Nome da Loja"
                               />
                               
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Fonte</Label>
                                    <Select 
                                      value={themeConfig.shopHeaderFontFamily}
                                      onValueChange={(value) => setThemeConfig({...themeConfig, shopHeaderFontFamily: value as any})}
                                    >
                                      <SelectTrigger className="w-full bg-muted/50 dark:bg-muted/20 border border-border rounded-md p-2 text-xs outline-none focus:border-neon-blue">
                                        <SelectValue placeholder="Selecione a fonte" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background dark:bg-popover border-border">
                                        <SelectItem value="sans">Sans Serif</SelectItem>
                                        <SelectItem value="serif">Serif</SelectItem>
                                        <SelectItem value="mono">Monospace</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Peso</Label>
                                    <Select 
                                      value={themeConfig.shopHeaderFontWeight}
                                      onValueChange={(value) => setThemeConfig({...themeConfig, shopHeaderFontWeight: value as any})}
                                    >
                                      <SelectTrigger className="w-full bg-muted/50 dark:bg-muted/20 border border-border rounded-md p-2 text-xs outline-none focus:border-neon-blue">
                                        <SelectValue placeholder="Selecione o peso" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background dark:bg-popover border-border">
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="medium">Médio</SelectItem>
                                        <SelectItem value="bold">Negrito</SelectItem>
                                        <SelectItem value="extrabold">Extra Negrito</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                               </div>

                               <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Tamanho</Label>
                                  <div className="grid grid-cols-5 gap-2">
                                    {['sm', 'base', 'lg', 'xl', '2xl'].map((size) => (
                                      <button
                                        key={size}
                                        onClick={() => setThemeConfig({...themeConfig, shopHeaderFontSize: size as any})}
                                        className={`py-1 rounded border text-xs ${themeConfig.shopHeaderFontSize === size ? 'bg-neon-blue border-neon-blue text-black font-bold' : 'bg-muted/50 dark:bg-muted/20 border-border hover:bg-muted dark:hover:bg-muted/20'}`}
                                      >
                                        {size === 'sm' ? 'P' : size === 'base' ? 'M' : size === 'lg' ? 'G' : size === 'xl' ? 'GG' : 'EG'}
                                      </button>
                                    ))}
                                  </div>
                               </div>
                             </div>
                           ) : (
                             <div className="animate-in fade-in zoom-in-95 duration-200">
                                <div className="h-20 bg-muted/50 dark:bg-muted/40 rounded-lg border-2 border-dashed border-border flex items-center justify-center relative group overflow-hidden">
                                  {themeConfig.shopHeaderImage ? (
                                    <img src={themeConfig.shopHeaderImage} alt="Header Logo" className="h-full object-contain p-2" />
                                  ) : (
                                    <div className="text-center">
                                      <ImageIcon className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                                      <span className="text-[10px] text-muted-foreground">Enviar Imagem</span>
                                    </div>
                                  )}
                                  <input 
                                    type="file" 
                                    onChange={(e) => handleImageUpload(e, 'shop-header')}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                  />
                                </div>
                             </div>
                           )}
                        </div>

                        <div className="space-y-4">
                           <Label className="text-lg font-semibold flex items-center gap-2">
                             <ImageIcon className="w-5 h-5 text-neon-blue" />
                             Banner da Loja
                           </Label>
                           
                           {/* Banner Image Upload */}
                           <div className="aspect-[2/1] bg-muted/50 dark:bg-muted/20 rounded-lg border-2 border-dashed border-border flex items-center justify-center relative group overflow-hidden">
                             {themeConfig.shopBannerImage ? (
                               <img src={themeConfig.shopBannerImage} alt="Banner" className="w-full h-full object-cover" />
                             ) : (
                               <div className="text-center p-4">
                                 <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                 <p className="text-xs text-muted-foreground">Banner Principal (1200x600)</p>
                               </div>
                             )}
                             <input 
                               type="file" 
                               onChange={(e) => handleImageUpload(e, 'shop-banner')}
                               className="absolute inset-0 opacity-0 cursor-pointer"
                               accept="image/*"
                             />
                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                               <span className="text-xs font-bold text-white">Alterar Banner</span>
                             </div>
                           </div>

                           <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2">
                               <div className="space-y-2 bg-muted/30 dark:bg-muted/10 p-3 rounded-lg border border-border">
                                 <div className="flex items-center justify-between mb-2">
                                   <Label>Título Principal</Label>
                                   <Switch 
                                     checked={themeConfig.shopBannerShowTitle !== false}
                                     onCheckedChange={(checked) => setThemeConfig({...themeConfig, shopBannerShowTitle: checked})}
                                   />
                                 </div>
                                 {themeConfig.shopBannerShowTitle !== false && (
                                   <Input 
                                     value={themeConfig.shopBannerTitle || ''}
                                     onChange={(e) => setThemeConfig({...themeConfig, shopBannerTitle: e.target.value})}
                                     className="bg-muted/50 dark:bg-muted/20 border-border"
                                     placeholder="Ex: Nova Coleção"
                                   />
                                 )}
                               </div>
                               
                               <div className="space-y-2 bg-muted/30 dark:bg-muted/10 p-3 rounded-lg border border-border">
                                 <div className="flex items-center justify-between mb-2">
                                   <Label>Subtítulo (Etiqueta)</Label>
                                   <Switch 
                                     checked={themeConfig.shopBannerShowSubtitle !== false}
                                     onCheckedChange={(checked) => setThemeConfig({...themeConfig, shopBannerShowSubtitle: checked})}
                                   />
                                 </div>
                                 {themeConfig.shopBannerShowSubtitle !== false && (
                                   <Input 
                                     value={themeConfig.shopBannerSubtitle || ''}
                                     onChange={(e) => setThemeConfig({...themeConfig, shopBannerSubtitle: e.target.value})}
                                     className="bg-muted/50 dark:bg-muted/20 border-border"
                                     placeholder="Ex: Confira as novidades"
                                   />
                                 )}
                               </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-lg font-semibold flex items-center gap-2">
                             <Menu className="w-5 h-5 text-neon-blue" />
                             Categorias
                           </Label>
                           <div className="flex gap-2">
                             <Input 
                               value={newCategory}
                               onChange={(e) => setNewCategory(e.target.value)}
                               className="bg-muted/50 dark:bg-muted/20 border-border"
                               placeholder="Nova Categoria..."
                               onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                             />
                             <NeonButton onClick={addCategory} className="w-12 flex items-center justify-center p-0">
                               <Plus className="w-5 h-5" />
                             </NeonButton>
                           </div>
                           <div className="flex flex-wrap gap-2">
                             {themeConfig.shopCategories?.map((cat) => (
                               <div key={cat.id} className="group flex items-center gap-2 bg-muted dark:bg-muted/20 border border-border px-3 py-2 rounded-lg hover:border-neon-blue/50 transition-all">
                                 <span className="text-sm font-medium text-foreground/80 dark:text-foreground/80">{cat.name}</span>
                                 <button 
                                   onClick={() => removeCategory(cat.id)} 
                                   className="text-muted-foreground/50 hover:text-red-500 dark:text-muted-foreground/50 transition-colors"
                                 >
                                   <X className="w-4 h-4" />
                                 </button>
                               </div>
                             ))}
                           </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-lg font-semibold flex items-center gap-2">
                             <Share2 className="w-5 h-5 text-neon-blue" />
                             Redes Sociais & Rodapé
                           </Label>
                           <div className="flex gap-2">
                             <Select 
                               value={newSocial.icon}
                               onValueChange={(value) => setNewSocial({...newSocial, icon: value})}
                             >
                               <SelectTrigger className="w-[140px] bg-muted/50 dark:bg-muted/20 border-border">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent className="bg-background dark:bg-popover border-border">
                                 <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                 <SelectItem value="instagram">Instagram</SelectItem>
                                 <SelectItem value="twitter">X / Twitter</SelectItem>
                                 <SelectItem value="facebook">Facebook</SelectItem>
                                 <SelectItem value="youtube">YouTube</SelectItem>
                                 <SelectItem value="tiktok">TikTok</SelectItem>
                                 <SelectItem value="linkedin">LinkedIn</SelectItem>
                                 <SelectItem value="email">Email</SelectItem>
                                 <SelectItem value="phone">Telefone</SelectItem>
                                 <SelectItem value="map">Endereço</SelectItem>
                               </SelectContent>
                             </Select>
                             <Input 
                               value={newSocial.url}
                               onChange={(e) => setNewSocial({...newSocial, url: e.target.value})}
                               className="flex-1 bg-muted/50 dark:bg-muted/20 border-border"
                               placeholder="URL ou Info..."
                               onKeyDown={(e) => e.key === 'Enter' && addSocial()}
                             />
                             <NeonButton onClick={addSocial} className="w-12 flex items-center justify-center p-0">
                               <Plus className="w-5 h-5" />
                             </NeonButton>
                           </div>
                           
                           <div className="flex flex-wrap gap-2">
                             {themeConfig.shopSocials?.map((social) => (
                               <div key={social.id} className="group flex items-center gap-2 bg-muted dark:bg-muted/20 border border-border px-3 py-2 rounded-lg hover:border-neon-blue/50 transition-all">
                                 {/* Render Icon based on social.icon string */}
                                 {social.icon === 'whatsapp' && <FaWhatsapp className="w-4 h-4 text-green-500" />}
                                 {social.icon === 'instagram' && <FaInstagram className="w-4 h-4 text-pink-500" />}
                                 {social.icon === 'twitter' && <FaTwitter className="w-4 h-4 text-blue-400" />}
                                 {social.icon === 'facebook' && <FaFacebook className="w-4 h-4 text-blue-600" />}
                                 {social.icon === 'youtube' && <FaYoutube className="w-4 h-4 text-red-500" />}
                                 {social.icon === 'tiktok' && <FaTiktok className="w-4 h-4 text-pink-400" />}
                                 {social.icon === 'linkedin' && <FaLinkedin className="w-4 h-4 text-blue-700" />}
                                 {social.icon === 'email' && <FaEnvelope className="w-4 h-4 text-yellow-500" />}
                                 {social.icon === 'phone' && <FaPhone className="w-4 h-4 text-green-400" />}
                                 {social.icon === 'map' && <FaMapMarkerAlt className="w-4 h-4 text-red-400" />}
                                 
                                 <span className="text-sm font-medium text-foreground/80 dark:text-white/80 truncate max-w-[150px]">{social.url}</span>
                                 <button 
                                   onClick={() => removeSocial(social.id)} 
                                   className="text-muted-foreground/50 hover:text-red-500 dark:text-white/20 transition-colors"
                                 >
                                   <X className="w-4 h-4" />
                                 </button>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>
                    )}

                    {/* Background Options */}
                    {themeConfig.layout !== 'shop' && (
                      <div className="space-y-4">
                        <Label className="text-lg font-semibold">Fundo</Label>
                        <div className="grid grid-cols-3 gap-4">
                          <button 
                            onClick={() => setThemeConfig({ ...themeConfig, backgroundType: 'solid' })}
                            className={`p-4 rounded-xl border ${themeConfig.backgroundType === 'solid' ? 'border-neon-blue bg-neon-blue/10' : 'border-border bg-muted/30 dark:bg-muted/20'}`}
                          >
                            Cor Sólida
                          </button>
                          <button 
                            onClick={() => setThemeConfig({ ...themeConfig, backgroundType: 'gradient' })}
                            className={`p-4 rounded-xl border ${themeConfig.backgroundType === 'gradient' ? 'border-neon-blue bg-neon-blue/10' : 'border-border bg-muted/30 dark:bg-muted/10'}`}
                          >
                            Gradiente
                          </button>
                          <button 
                            onClick={() => setThemeConfig({ ...themeConfig, backgroundType: 'image' })}
                            className={`p-4 rounded-xl border ${themeConfig.backgroundType === 'image' ? 'border-neon-blue bg-neon-blue/10' : 'border-border bg-muted/30 dark:bg-muted/20'}`}
                          >
                            Imagem
                          </button>
                        </div>

                        {themeConfig.backgroundType === 'solid' && (
                          <div className="flex items-center gap-4">
                            <Input 
                              type="color" 
                              value={themeConfig.backgroundColor}
                              onChange={(e) => setThemeConfig({ ...themeConfig, backgroundColor: e.target.value })}
                              className="w-12 h-12 p-1 rounded-lg bg-transparent border-border cursor-pointer"
                            />
                            <Label>Cor de Fundo</Label>
                          </div>
                        )}

                        {themeConfig.backgroundType === 'gradient' && (
                          <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                              <Label>Cor Inicial</Label>
                              <Input 
                                type="color" 
                                value={themeConfig.backgroundGradientFrom}
                                onChange={(e) => setThemeConfig({ ...themeConfig, backgroundGradientFrom: e.target.value })}
                                className="w-full h-10 p-1 rounded-lg bg-transparent border-border dark:border-white/10 cursor-pointer"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>Cor Final</Label>
                              <Input 
                                type="color" 
                                value={themeConfig.backgroundGradientTo}
                                onChange={(e) => setThemeConfig({ ...themeConfig, backgroundGradientTo: e.target.value })}
                                className="w-full h-10 p-1 rounded-lg bg-transparent border-border dark:border-white/10 cursor-pointer"
                              />
                            </div>
                          </div>
                        )}

                        {themeConfig.backgroundType === 'image' && (
                          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-neon-blue/50 transition-colors relative">
                            <input 
                              type="file" 
                              onChange={(e) => handleImageUpload(e, 'bg')}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              accept="image/*"
                            />
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Clique para enviar imagem</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Button Style */}
                    {themeConfig.layout !== 'shop' && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label className="text-lg font-semibold">Estilo dos Botões</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {[
                              { id: 'rounded', label: 'Redondo' },
                              { id: 'square', label: 'Quadrado' },
                              { id: 'pill', label: 'Pílula' },
                              { id: 'glass', label: 'Glass' },
                              { id: 'neon', label: 'Neon' },
                              { id: 'glitch', label: 'Glitch' },
                              { id: 'brutalist', label: 'Brutal' },
                              { id: 'minimal', label: 'Minimal' },
                              { id: 'liquid', label: 'Líquido' },
                              { id: 'cyberpunk', label: 'Cyber' },
                            ].map((style) => (
                              <button
                                key={style.id}
                                onClick={() => setThemeConfig({ ...themeConfig, buttonStyle: style.id as any })}
                                className={`p-2 text-xs rounded-lg border transition-all ${
                                  themeConfig.buttonStyle === style.id 
                                    ? 'border-neon-blue bg-neon-blue text-black font-bold' 
                                    : 'border-border bg-muted/30 dark:bg-muted/10 hover:bg-muted/50 dark:hover:bg-muted/20'
                                }`}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Button Colors & Transparency */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Cor do Fundo do Botão</Label>
                                <div className="flex items-center gap-3">
                                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border shadow-inner">
                                      <input 
                                          type="color" 
                                          value={themeConfig.buttonColor}
                                          onChange={(e) => setThemeConfig({ ...themeConfig, buttonColor: e.target.value })}
                                          className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 border-0 cursor-pointer"
                                      />
                                  </div>
                                  <Input 
                                      value={themeConfig.buttonColor}
                                      onChange={(e) => setThemeConfig({ ...themeConfig, buttonColor: e.target.value })}
                                      className="flex-1 h-10 bg-muted/50 dark:bg-muted/10 border-border font-mono text-xs uppercase"
                                  />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-muted-foreground dark:text-gray-300">Cor do Texto do Botão</Label>
                                <div className="flex items-center gap-3">
                                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border dark:border-white/20 shadow-inner">
                                      <input 
                                          type="color" 
                                          value={themeConfig.buttonTextColor}
                                          onChange={(e) => setThemeConfig({ ...themeConfig, buttonTextColor: e.target.value })}
                                          className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 border-0 cursor-pointer"
                                      />
                                  </div>
                                  <Input 
                                      value={themeConfig.buttonTextColor}
                                      onChange={(e) => setThemeConfig({ ...themeConfig, buttonTextColor: e.target.value })}
                                      className="flex-1 h-10 bg-muted/50 dark:bg-muted/10 border-border font-mono text-xs uppercase"
                                  />
                                </div>
                            </div>

                            <div className="space-y-3 sm:col-span-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">Transparência do Fundo</Label>
                                    <span className="text-xs text-muted-foreground">{themeConfig.buttonTransparency}%</span>
                                </div>
                                <Slider 
                                    defaultValue={[themeConfig.buttonTransparency]} 
                                    max={100} 
                                    step={1} 
                                    onValueChange={(val) => setThemeConfig({ ...themeConfig, buttonTransparency: val[0] })}
                                    className="py-2"
                                />
                            </div>
                        </div>
                      </div>
                    )}

                    {themeConfig.layout !== 'shop' && (
                      <div className="space-y-4">
                        <Label className="text-lg font-semibold">Cores do Texto</Label>
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-muted-foreground dark:text-gray-300">Cor do Texto Principal</Label>
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border shadow-inner">
                                  <input 
                                      type="color" 
                                      value={themeConfig.textColor}
                                      onChange={(e) => setThemeConfig({ ...themeConfig, textColor: e.target.value })}
                                      className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 border-0 cursor-pointer"
                                  />
                              </div>
                              <Input 
                                  value={themeConfig.textColor}
                                  onChange={(e) => setThemeConfig({ ...themeConfig, textColor: e.target.value })}
                                  className="flex-1 h-10 bg-muted/50 dark:bg-muted/10 border-border font-mono text-xs uppercase"
                              />
                            </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </GlassCard>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-5 flex items-center justify-center bg-muted/30 dark:bg-muted/20 rounded-3xl p-4 lg:p-8 border border-border min-h-[600px] lg:min-h-0">
            <div className="relative w-full max-w-[320px] aspect-[9/19] max-h-[680px] bg-black rounded-[2.5rem] lg:rounded-[3rem] border-[6px] lg:border-8 border-gray-300 dark:border-gray-800 shadow-2xl overflow-hidden transform scale-90 sm:scale-100 transition-transform">
              {/* Phone Frame Content */}
              <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] lg:rounded-[3rem] bg-black">
                {/* Global Styles for Preview */}
                <style>{`
                  .no-scrollbar::-webkit-scrollbar { display: none; }
                  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>

                {themeConfig.layout === 'shop' ? (
                  // =====================================================================================
                  // SHOP LAYOUT (E-COMMERCE REDESIGN)
                  // =====================================================================================
                  <div className={`h-full flex flex-col font-sans selection:bg-neon-blue selection:text-black relative transition-colors duration-300 ${
                    themeConfig.shopThemeMode === 'light' 
                      ? 'bg-gray-50 text-gray-900' 
                      : 'bg-[#161616] text-gray-100'
                  }`}>
                    
                    {/* Header Fixed */}
                    <div className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${
                      themeConfig.shopThemeMode === 'light'
                        ? 'bg-white/90 border-black/5'
                        : 'bg-[#161616]/90 border-white/5'
                    }`}>
                      
                      {/* Navbar */}
                      <div className="px-4 py-3 flex items-center justify-between">
                        {/* Logo Button (Menu Replacement) */}
                        {themeConfig.shopLogo && (
                          <button className={`w-8 h-8 rounded-full overflow-hidden border transition-colors relative group ${
                            themeConfig.shopThemeMode === 'light'
                              ? 'border-black/10 hover:border-neon-blue'
                              : 'border-white/10 hover:border-neon-blue'
                          }`}>
                             <img src={themeConfig.shopLogo} alt="Logo" className="w-full h-full object-cover" />
                          </button>
                        )}
                        
                        {themeConfig.shopHeaderType === 'image' && themeConfig.shopHeaderImage ? (
                          <img src={themeConfig.shopHeaderImage} alt="Logo" className="h-8 object-contain" />
                        ) : (
                          <span className={`tracking-tight ${
                            themeConfig.shopHeaderFontFamily === 'serif' ? 'font-serif' : 
                            themeConfig.shopHeaderFontFamily === 'mono' ? 'font-mono' : 'font-sans'
                          } ${
                            themeConfig.shopHeaderFontSize === 'sm' ? 'text-sm' :
                            themeConfig.shopHeaderFontSize === 'base' ? 'text-base' :
                            themeConfig.shopHeaderFontSize === 'xl' ? 'text-xl' :
                            themeConfig.shopHeaderFontSize === '2xl' ? 'text-2xl' : 'text-lg'
                          } ${
                            themeConfig.shopHeaderFontWeight === 'normal' ? 'font-normal' :
                            themeConfig.shopHeaderFontWeight === 'medium' ? 'font-medium' :
                            themeConfig.shopHeaderFontWeight === 'extrabold' ? 'font-extrabold' : 'font-bold'
                          } ${
                            themeConfig.shopThemeMode === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>
                            {themeConfig.shopHeaderText || username.replace('@', '')}
                          </span>
                        )}
                        
                        <div className="flex items-center gap-2">
                           <div className="relative">
                             <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                               themeConfig.shopThemeMode === 'light' ? 'text-black/50' : 'text-white/50'
                             }`} />
                             <input 
                               type="text" 
                               placeholder="Buscar..." 
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                               className={`rounded-full pl-8 pr-3 py-1.5 text-xs placeholder:text-opacity-50 focus:outline-none focus:border-neon-blue w-28 focus:w-40 transition-all border ${
                                  themeConfig.shopThemeMode === 'light'
                                    ? 'bg-black/5 border-black/10 text-black placeholder:text-black/50'
                                    : 'bg-white/10 border-white/10 text-white placeholder:text-white/50'
                                }`}
                             />
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                      
                      {/* Hero Banner */}
                      <div className="relative aspect-[4/5] sm:aspect-[16/10] bg-gray-900 w-full overflow-hidden">
                         {themeConfig.shopBannerImage ? (
                           <img 
                             src={themeConfig.shopBannerImage} 
                             alt="Banner" 
                             className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000" 
                           />
                         ) : (
                           <div className="w-full h-full bg-gradient-to-br from-violet-900 via-gray-900 to-black relative">
                              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                           </div>
                         )}
                         
                         {/* Gradient Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-[#161616]/40 to-transparent flex flex-col justify-end p-6">
                             {(themeConfig.shopBannerShowTitle !== false || themeConfig.shopBannerShowSubtitle !== false) && (
                               <motion.div 
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="space-y-3 max-w-[80%]"
                               >
                                 {themeConfig.shopBannerShowTitle !== false && (
                                   <h2 className="text-3xl font-bold text-white leading-none drop-shadow-xl">
                                     {themeConfig.shopBannerTitle || 'Verão 2024'}
                                   </h2>
                                 )}

                                 {themeConfig.shopBannerShowSubtitle !== false && (
                                   <span className="inline-flex items-center px-2 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded text-[9px] font-bold uppercase tracking-widest text-white">
                                     {themeConfig.shopBannerSubtitle || 'Nova Coleção'}
                                   </span>
                                 )}
                               </motion.div>
                             )}
                         </div>
                      </div>

                      {/* Categories Rail */}
                      <div className={`py-6 pl-4 border-b ${themeConfig.shopThemeMode === 'light' ? 'border-black/5' : 'border-white/5'}`}>
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categorias</h3>
                          <div className="flex gap-2 overflow-x-auto py-4 px-4 no-scrollbar">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveCategory(null)}
                                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                                  activeCategory === null 
                                    ? (themeConfig.shopThemeMode === 'light' ? 'bg-black text-white border-black font-bold shadow-lg' : 'bg-white text-black border-white font-bold shadow-lg')
                                    : (themeConfig.shopThemeMode === 'light' ? 'bg-black/5 text-black/70 border-black/10 hover:bg-black/10 hover:text-black hover:border-black/30' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30')
                                }`}
                              >
                                Tudo
                              </motion.button>

                              {themeConfig.shopCategories?.map((cat) => (
                                  <motion.button
                                    key={cat.id} 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveCategory(cat.name)}
                                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                                      activeCategory === cat.name 
                                        ? (themeConfig.shopThemeMode === 'light' ? 'bg-black text-white border-black font-bold shadow-lg' : 'bg-white text-black border-white font-bold shadow-lg')
                                        : (themeConfig.shopThemeMode === 'light' ? 'bg-black/5 text-black/70 border-black/10 hover:bg-black/10 hover:text-black hover:border-black/30' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30')
                                    }`}
                                  >
                                    {cat.name}
                                  </motion.button>
                              ))}
                          </div>
                      </div>

                      {/* Featured Products Grid */}
                      <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                          <h3 className={`font-bold text-lg ${themeConfig.shopThemeMode === 'light' ? 'text-gray-900' : 'text-white'}`}>Destaques</h3>
                          <button
                            className="text-xs text-neon-blue hover:text-white transition-colors"
                            onClick={() => {
                              setActiveCategory(null);
                              setSearchQuery("");
                            }}
                          >
                            Ver todos
                          </button>
                      </div>

                          <div className="grid grid-cols-2 gap-4">
                               {links.filter(l => 
                                 l.enabled && 
                                 l.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                                 (!activeCategory || l.category === activeCategory)
                               ).map((link) => (
                                   <div key={link.id} className="group cursor-pointer">
                                      <div className={`aspect-[4/5] w-full rounded-xl overflow-hidden relative mb-3 border transition-colors ${
                                        themeConfig.shopThemeMode === 'light' 
                                          ? 'bg-black/5 border-black/5 group-hover:border-black/20' 
                                          : 'bg-white/5 border-white/5 group-hover:border-white/20'
                                      }`}>
                                          {link.image ? (
                                              <img src={link.image} alt={link.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                          ) : (
                                              <div className={`w-full h-full flex items-center justify-center ${
                                                themeConfig.shopThemeMode === 'light' ? 'bg-black/5' : 'bg-white/5'
                                              }`}>
                                                  <ImageIcon className={`w-8 h-8 ${themeConfig.shopThemeMode === 'light' ? 'text-black/20' : 'text-white/20'}`} />
                                              </div>
                                          )}
                                          
                                          {link.badgeLabel && (
                                            <div
                                              className="absolute bottom-2 left-2 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10"
                                              style={{ backgroundColor: link.badgeColor ? hexToRgba(link.badgeColor, 0.7) : "rgba(0,0,0,0.6)" }}
                                            >
                                              {link.badgeLabel}
                                            </div>
                                          )}
                                          
                                          {/* Wishlist Action */}
                                          <button className={`absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 ${
                                            themeConfig.shopThemeMode === 'light'
                                              ? 'bg-white/50 text-black hover:bg-black hover:text-white'
                                              : 'bg-black/20 text-white hover:bg-white hover:text-black'
                                          }`}>
                                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                          </button>
                                      </div>
                                      
                                      <div className="space-y-1">
                                          <h4 className={`text-sm font-medium leading-tight line-clamp-2 transition-colors ${
                                            themeConfig.shopThemeMode === 'light'
                                              ? 'text-gray-900 group-hover:text-neon-blue'
                                              : 'text-white group-hover:text-neon-blue'
                                          }`}>
                                            {link.title}
                                          </h4>
                                          <p className="text-[10px] text-gray-500 line-clamp-1">
                                            {link.description || 'Sem descrição'}
                                          </p>
                                          <div className="pt-2 flex items-center justify-between gap-2">
                                             <span className={`text-xs font-bold ${themeConfig.shopThemeMode === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                               {link.price ? ((link.currency || 'R$') + ' ' + link.price) : 'R$ --'}
                                             </span>
                                             <button className={`flex-1 h-6 rounded-full flex items-center justify-center gap-1 hover:bg-neon-blue transition-colors px-2 ${
                                               themeConfig.shopThemeMode === 'light' 
                                                 ? 'bg-black text-white' 
                                                 : 'bg-white text-black'
                                             }`}>
                                               <span className="text-[9px] font-bold uppercase">{link.buttonLabel || 'Comprar'}</span>
                                             </button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Footer Info */}
                       <div className={`mt-8 py-8 border-t px-6 text-center transition-colors ${
                         themeConfig.shopThemeMode === 'light' 
                           ? 'border-black/5 bg-gray-100' 
                           : 'border-white/5 bg-[#1a1a1a]'
                       }`}>
                          <h4 className={`font-bold mb-4 ${themeConfig.shopThemeMode === 'light' ? 'text-gray-900' : 'text-white'}`}>Siga-nos</h4>
                          <div className="flex flex-wrap justify-center gap-4 mb-6">
                               {themeConfig.shopSocials?.map((social) => (
                                   <a 
                                     key={social.id}
                                     href={social.url}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                                     themeConfig.shopThemeMode === 'light'
                                       ? 'bg-black/5 border-black/5 hover:bg-black hover:text-white text-gray-600'
                                       : 'bg-white/5 border-white/5 hover:bg-white hover:text-black text-white'
                                   }`}>
                                       {social.icon === 'whatsapp' && <FaWhatsapp className="w-5 h-5" />}
                                       {social.icon === 'instagram' && <FaInstagram className="w-5 h-5" />}
                                       {social.icon === 'twitter' && <FaTwitter className="w-5 h-5" />}
                                       {social.icon === 'facebook' && <FaFacebook className="w-5 h-5" />}
                                       {social.icon === 'youtube' && <FaYoutube className="w-5 h-5" />}
                                       {social.icon === 'tiktok' && <FaTiktok className="w-5 h-5" />}
                                       {social.icon === 'linkedin' && <FaLinkedin className="w-5 h-5" />}
                                       {social.icon === 'email' && <FaEnvelope className="w-5 h-5" />}
                                       {social.icon === 'phone' && <FaPhone className="w-4 h-4" />}
                                       {social.icon === 'map' && <FaMapMarkerAlt className="w-4 h-4" />}
                                   </a>
                               ))}
                           </div>
                          <p className="text-[10px] text-gray-600 max-w-[200px] mx-auto">
                              Copyright © {new Date().getFullYear()} {themeConfig.shopHeaderText || 'Sua Loja'}
                          </p>
                      </div>
                    </div>


                  </div>
                ) : (
                  // =====================================================================================
                  // STANDARD LAYOUTS (CLASSIC / GRID)
                  // =====================================================================================
                  <div 
                    className="min-h-full w-full overflow-y-auto no-scrollbar p-6 pt-12 flex flex-col items-center"
                    style={{
                      background: themeConfig.backgroundType === 'image' 
                        ? `url(${themeConfig.backgroundImage}) center/cover no-repeat`
                        : themeConfig.backgroundType === 'gradient'
                        ? `linear-gradient(to bottom, ${themeConfig.backgroundGradientFrom}, ${themeConfig.backgroundGradientTo})`
                        : themeConfig.backgroundColor
                    }}
                  >
                    {/* Profile Header */}
                    <div className="text-center mb-8 w-full">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 mx-auto mb-4 shadow-lg">
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <h2 className="text-lg font-bold mb-1" style={{ color: themeConfig.textColor }}>{username}</h2>
                      <p className="text-sm opacity-80" style={{ color: themeConfig.textColor }}>{bio}</p>
                    </div>

                    {/* Links List */}
                    <div className={`w-full ${
                      themeConfig.layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'
                    }`}>
                      {links.filter(l => l.enabled).map((link) => (
                        <motion.a
                          key={link.id}
                          href={link.url || "#"}
                          target={link.url ? "_blank" : undefined}
                          rel={link.url ? "noopener noreferrer" : undefined}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`block w-full relative overflow-hidden group transition-all p-4 text-center ${
                            themeConfig.buttonStyle === 'rounded' ? 'rounded-lg' :
                            themeConfig.buttonStyle === 'pill' ? 'rounded-full' :
                            themeConfig.buttonStyle === 'square' ? 'rounded-none' :
                            themeConfig.buttonStyle === 'glass' ? 'rounded-xl backdrop-blur-md bg-white/10 border border-white/20' :
                            themeConfig.buttonStyle === 'neon' ? 'rounded-xl border border-current shadow-[0_0_10px_currentColor]' : 
                            themeConfig.buttonStyle === 'brutalist' ? 'rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000] bg-white text-black font-bold uppercase tracking-wider' :
                            themeConfig.buttonStyle === 'minimal' ? 'rounded-none border-b border-current bg-transparent hover:tracking-widest' :
                            themeConfig.buttonStyle === 'liquid' ? 'rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-[length:200%_auto] animate-gradient text-white font-bold shadow-lg' :
                            themeConfig.buttonStyle === 'cyberpunk' ? 'clip-path-polygon bg-black border-l-4 border-neon-blue text-neon-blue font-mono tracking-widest hover:bg-neon-blue/10' :
                            themeConfig.buttonStyle === 'glitch' ? 'rounded-sm border border-white/50 bg-black/50 font-mono tracking-wider hover:bg-white/10' : ''
                          } ${
                            link.animation === 'pulse' ? 'animate-pulse' :
                            link.animation === 'bounce' ? 'animate-bounce' : ''
                          }`}
                          style={{
                            backgroundColor: ['liquid'].includes(themeConfig.buttonStyle) ? undefined : hexToRgba(themeConfig.buttonColor, themeConfig.buttonTransparency / 100),
                            color: themeConfig.buttonTextColor,
                            borderColor: themeConfig.buttonStyle === 'neon' ? themeConfig.buttonTextColor : undefined,
                            clipPath: themeConfig.buttonStyle === 'cyberpunk' ? 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' : undefined
                          }}
                        >
                          {/* Link Content */}
                          {themeConfig.buttonStyle === 'glitch' && (
                            <>
                              <div className="absolute top-0 left-0 w-full h-[1px] bg-white/50 animate-scanline" />
                              <div className="absolute inset-0 border border-white/20 translate-x-[1px] translate-y-[1px] opacity-50 mix-blend-overlay" />
                            </>
                          )}
                          
                          {themeConfig.buttonStyle === 'liquid' && (
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}

                          {link.animation === 'glow' && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          )}
                          
                          {themeConfig.layout === 'grid' && link.image && (
                             <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
                               <img src={link.image} alt="" className="w-full h-full object-cover" />
                             </div>
                          )}
                          
                          <span className="relative z-10 font-medium">{link.title}</span>
                        </motion.a>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-8 pb-4 text-center">
                      <p className="text-[10px] opacity-50" style={{ color: themeConfig.textColor }}>
                        Criado com IAylle
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20" />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
