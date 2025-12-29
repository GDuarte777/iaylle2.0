import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  Instagram, 
  Twitter, 
  Facebook, 
  Search,
  Image as ImageIcon,
  ShoppingBag,
  Phone
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
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

// Helper function for color
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

export default function BioPage() {
  const { username } = useParams();
  const [data, setData] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;

      try {
        setLoading(true);
        // 1. Get Page by Slug
        const { data: page, error } = await supabase
          .from('bio_pages')
          .select('*')
          .eq('slug', username)
          .single();

        if (error || !page) {
          setLoading(false);
          return;
        }

        // Check if page is published
        if (!page.is_published) {
          setData(null); // Will trigger the "Not Found" UI
          setLoading(false);
          return;
        }

        // 2. Get Links
        const { data: pageLinks } = await supabase
          .from('bio_links')
          .select('*')
          .eq('page_id', page.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        setData({
          username: page.title,
          bio: page.description,
          profileImage: page.profile_image,
          themeConfig: page.theme_config,
          links: pageLinks?.map(l => ({
            ...l,
            enabled: l.is_active,
            currency: l.currency,
            buttonLabel: l.button_label,
            badgeLabel: l.badge_label,
            badgeColor: l.badge_color
          })) || []
        });

      } catch (err) {
        console.error("Error loading bio page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  if (loading) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Carregando...</div>;
  
  if (!data) return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground">O endereço @{username} não existe ou não foi publicado.</p>
    </div>
  );

  const { themeConfig, links, bio, profileImage } = data;
  const displayName = data.username; // or data.shopHeaderText

  // Global Styles
  const globalStyles = `
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
  `;

  if (themeConfig.layout === 'shop') {
    // =====================================================================================
    // SHOP LAYOUT (E-COMMERCE REDESIGN)
    // =====================================================================================
    return (
      <div className={`min-h-screen w-full flex flex-col font-sans selection:bg-neon-blue selection:text-black relative transition-colors duration-300 ${
        themeConfig.shopThemeMode === 'light' 
          ? 'bg-gray-50 text-gray-900' 
          : 'bg-[#161616] text-gray-100'
      }`}>
        <style>{globalStyles}</style>
        
        {/* Header Fixed */}
        <div className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${
          themeConfig.shopThemeMode === 'light'
            ? 'bg-white/90 border-black/5'
            : 'bg-[#161616]/90 border-white/5'
        }`}>
          
          {/* Navbar */}
          <div className="w-full max-w-md md:max-w-4xl lg:max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo Button */}
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
                {themeConfig.shopHeaderText || displayName.replace('@', '')}
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
        <div className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-7xl mx-auto pb-24">
          
          {/* Hero Banner */}
          <div className="relative aspect-[16/10] md:aspect-[21/9] lg:aspect-[3/1] bg-gray-900 w-full overflow-hidden rounded-none md:rounded-b-2xl shadow-lg">
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
                      className="space-y-3 max-w-[80%] md:max-w-[60%]"
                    >
                      {themeConfig.shopBannerShowTitle !== false && (
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-none drop-shadow-xl">
                          {themeConfig.shopBannerTitle || 'Verão 2024'}
                        </h2>
                      )}

                      {themeConfig.shopBannerShowSubtitle !== false && (
                        <span className="inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded text-[9px] md:text-xs font-bold uppercase tracking-widest text-white">
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

                  {themeConfig.shopCategories?.map((cat: any) => (
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

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {links.filter((l: any) => 
                      l.enabled && 
                      l.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                      (!activeCategory || l.category === activeCategory)
                    ).map((link: any) => (
                        <div key={link.id} className="group cursor-pointer" onClick={() => window.open(link.url, '_blank')}>
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
                                  <button className={`flex-1 h-6 rounded-full flex items-center justify-center gap-1 hover:bg-neon-blue hover:text-black transition-colors px-2 ${
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
              <div className="flex justify-center gap-4 mb-6">
                  {[Instagram, Facebook, Twitter].map((Icon, i) => (
                      <div key={i} className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                        themeConfig.shopThemeMode === 'light'
                          ? 'bg-black/5 border-black/5 hover:bg-black hover:text-white text-gray-600'
                          : 'bg-white/5 border-white/5 hover:bg-white hover:text-black text-white'
                      }`}>
                          <Icon className="w-4 h-4" />
                      </div>
                  ))}
              </div>
              <p className="text-[10px] text-gray-600 max-w-[200px] mx-auto">
                  {themeConfig.shopAddress || "Rua Exemplo, 123 - São Paulo, SP"}
                  <br/>
                  {themeConfig.shopContactEmail || "contato@loja.com"}
              </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================================
  // STANDARD LAYOUTS (CLASSIC / GRID)
  // =====================================================================================
  return (
    <div 
      className="min-h-screen w-full overflow-y-auto no-scrollbar p-6 pt-12 flex flex-col items-center"
      style={{
        background: themeConfig.backgroundType === 'image' 
          ? `url(${themeConfig.backgroundImage}) center/cover no-repeat`
          : themeConfig.backgroundType === 'gradient'
          ? `linear-gradient(to bottom, ${themeConfig.backgroundGradientFrom}, ${themeConfig.backgroundGradientTo})`
          : themeConfig.backgroundColor
      }}
    >
      <style>{globalStyles}</style>

      {/* Profile Header */}
      <div className="text-center mb-8 w-full max-w-md md:max-w-2xl">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white/20 mx-auto mb-4 shadow-lg">
          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-lg md:text-2xl font-bold mb-1" style={{ color: themeConfig.textColor }}>{displayName}</h2>
        <p className="text-sm md:text-base opacity-80" style={{ color: themeConfig.textColor }}>{bio}</p>
      </div>

      {/* Links List */}
      <div className={`w-full max-w-md md:max-w-2xl lg:max-w-3xl ${
        themeConfig.layout === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6' : 'space-y-4 md:space-y-6'
      }`}>
        {links.filter((l: any) => l.enabled).map((link: any) => (
          <motion.a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`block w-full relative overflow-hidden group transition-all p-4 md:p-6 text-center ${
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
            
            <span className="relative z-10 font-medium md:text-lg">{link.title}</span>
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
  );
}
