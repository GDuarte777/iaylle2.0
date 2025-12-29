import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dices, Users, Trophy, RotateCcw, Sparkles, Gift, FileSpreadsheet, Upload, History, Trash2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RaffleHistory {
  id: string;
  title: string;
  type: string;
  config: any;
  result: any;
  created_at: string;
}

export default function Raffle() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("numbers");
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState<string[] | number[] | null>(null);
  const [displayValue, setDisplayValue] = useState<string | number>("?");
  
  // History State
  const [history, setHistory] = useState<RaffleHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Numbers State
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [quantity, setQuantity] = useState(1);
  
  // Names State
  const [namesInput, setNamesInput] = useState("");

  // CSV State
  const [csvNames, setCsvNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const { data, error } = await supabase
        .from('raffles')
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

  const deleteFromHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('raffles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setHistory(history.filter(h => h.id !== id));
      toast.success('Sorteio removido do histórico');
    } catch (error) {
      console.error('Error deleting raffle:', error);
      toast.error('Erro ao remover sorteio');
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = theme === 'light' 
      ? ['#0ea5e9', '#8b5cf6', '#000000'] 
      : ['#00f2ff', '#bd00ff', '#ffffff'];

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // Split by newline and filter empty lines
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== "");
      
      // Simple CSV parsing: assume first column if comma separated, otherwise whole line
      const parsedNames = lines.map(line => {
        // Remove quotes if present
        const cleanLine = line.replace(/^"|"$/g, '');
        // If has comma, take first part
        if (cleanLine.includes(',')) {
          return cleanLine.split(',')[0].trim();
        }
        return cleanLine.trim();
      }).filter(name => name !== "");

      setCsvNames(parsedNames);
    };
    reader.readAsText(file);
  };

  const getSecureRandom = () => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xFFFFFFFF + 1);
  };

  const handleDraw = () => {
    setIsDrawing(true);
    setResult(null);
    
    let possibleValues: (string | number)[] = [];
    
    if (activeTab === "numbers") {
      if (min >= max) {
        setIsDrawing(false);
        return;
      }
      // Create array for animation - Math.random is fine for animation visual effect
      possibleValues = Array.from({ length: 100 }, () => Math.floor(Math.random() * (max - min + 1)) + min);
    } else if (activeTab === "names") {
      const names = namesInput.split("\n").filter(n => n.trim() !== "");
      if (names.length === 0) {
        setIsDrawing(false);
        return;
      }
      possibleValues = names;
    } else {
      // CSV Tab
      if (csvNames.length === 0) {
        setIsDrawing(false);
        return;
      }
      possibleValues = csvNames;
    }

    // Animation phase
    let counter = 0;
    const speed = 50; // ms
    
    intervalRef.current = setInterval(() => {
      const randomValue = possibleValues[Math.floor(Math.random() * possibleValues.length)];
      setDisplayValue(randomValue);
      counter++;
      
      if (counter > 20) { // Run for about 1 second
        finishDraw();
      }
    }, speed);
  };

  const finishDraw = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    let finalResult: (string | number)[] = [];
    let config: any = {};
    
    if (activeTab === "numbers") {
      config = { type: 'numbers', min, max, quantity };
      const range = max - min + 1;
      if (quantity >= range) {
        // If quantity requested is larger than range, just return all shuffled using secure random
        const allNumbers = Array.from({ length: range }, (_, i) => min + i);
        // Fisher-Yates shuffle with secure random
        for (let i = allNumbers.length - 1; i > 0; i--) {
          const j = Math.floor(getSecureRandom() * (i + 1));
          [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
        }
        finalResult = allNumbers.slice(0, quantity);
      } else {
        // Unique random numbers using secure random
        const set = new Set<number>();
        while (set.size < quantity) {
          // Generate secure random integer between min and max
          const randomInt = Math.floor(getSecureRandom() * (max - min + 1)) + min;
          set.add(randomInt);
        }
        finalResult = Array.from(set);
      }
    } else {
      const names = activeTab === "names" 
        ? namesInput.split("\n").filter(n => n.trim() !== "")
        : csvNames;

      config = { type: activeTab, count: names.length, quantity };

      // Fisher-Yates shuffle with secure random
      const shuffled = [...names];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(getSecureRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      finalResult = shuffled.slice(0, quantity);
    }

    setResult(finalResult as string[] | number[]);
    setIsDrawing(false);
    triggerConfetti();

    // Save to Supabase
    if (user) {
      try {
        const { data, error } = await supabase
          .from('raffles')
          .insert({
            user_id: user.id,
            title: `Sorteio de ${activeTab === 'numbers' ? 'Números' : 'Nomes'}`,
            type: activeTab,
            config,
            result: finalResult
          })
          .select()
          .single();

        if (error) throw error;
        setHistory([data, ...history]);
        toast.success('Sorteio salvo no histórico!');
      } catch (error) {
        console.error('Error saving raffle:', error);
        toast.error('Erro ao salvar sorteio');
      }
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Gift className="w-10 h-10 text-neon-blue animate-bounce-slow" />
            Sorteios
          </h1>
          <p className="text-muted-foreground">
            Realize sorteios de números ou nomes de forma rápida e justa
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Section */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard className="p-6">
              <Tabs defaultValue="numbers" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="numbers" className="flex gap-2">
                    <Dices className="w-4 h-4" />
                    Números
                  </TabsTrigger>
                  <TabsTrigger value="names" className="flex gap-2">
                    <Users className="w-4 h-4" />
                    Nomes
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="flex gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex gap-2">
                    <History className="w-4 h-4" />
                    Histórico
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="numbers" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mínimo</Label>
                      <Input 
                        type="number" 
                        value={min} 
                        onChange={(e) => setMin(Number(e.target.value))}
                        className="glass-card border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Máximo</Label>
                      <Input 
                        type="number" 
                        value={max} 
                        onChange={(e) => setMax(Number(e.target.value))}
                        className="glass-card border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade de Sorteados</Label>
                    <Input 
                      type="number" 
                      min={1}
                      max={100}
                      value={quantity} 
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="glass-card border-border"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="names" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Lista de Nomes (um por linha)</Label>
                    <Textarea 
                      placeholder="Ana Silva&#10;João Santos&#10;Maria Costa..."
                      value={namesInput}
                      onChange={(e) => setNamesInput(e.target.value)}
                      className="glass-card border-border min-h-[200px]"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {namesInput.split("\n").filter(n => n.trim() !== "").length} nomes inseridos
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade de Sorteados</Label>
                    <Input 
                      type="number" 
                      min={1}
                      value={quantity} 
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="glass-card border-border"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="csv" className="space-y-4">
                  <div className="space-y-4">
                    <Label>Arquivo CSV ou Texto (um nome por linha ou separado por vírgula)</Label>
                    <div 
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-neon-blue/50 transition-colors cursor-pointer bg-muted/5"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                      />
                      <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">
                        Clique para selecionar ou arraste o arquivo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Suporta .csv e .txt
                      </p>
                    </div>

                    {csvNames.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400 text-sm text-center"
                      >
                        {csvNames.length} nomes carregados com sucesso!
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <Label>Quantidade de Sorteados</Label>
                      <Input 
                        type="number" 
                        min={1}
                        value={quantity} 
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="glass-card border-border"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  {isLoadingHistory ? (
                     <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Nenhum sorteio realizado ainda.</div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {history.map((item) => (
                        <div key={item.id} className="p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors relative group">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{item.title}</h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.created_at).toLocaleDateString()} às {new Date(item.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFromHistory(item.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Resultado: </span>
                              <span className="font-mono font-medium text-neon-blue">
                                {Array.isArray(item.result) ? item.result.join(', ') : item.result}
                              </span>
                            </div>
                            
                            {item.config && (
                              <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
                                {item.type === 'numbers' ? (
                                  <>Intervalo: {item.config.min} - {item.config.max} | Qtd: {item.config.quantity}</>
                                ) : (
                                  <>Participantes: {item.config.count} | Sorteados: {item.config.quantity}</>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <div className="mt-8">
                  {activeTab !== 'history' && (
                    <NeonButton 
                      variant="neon" 
                      className="w-full h-12 text-lg"
                      onClick={handleDraw}
                      disabled={isDrawing}
                    >
                      {isDrawing ? "Sorteando..." : "Sortear Agora"}
                    </NeonButton>
                  )}
                </div>
              </Tabs>
            </GlassCard>
          </div>

          {/* Result Section */}
          <div className="lg:col-span-7 space-y-8">
            <GlassCard className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 relative overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-neon-violet/5" />
              
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div 
                    key="result"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="z-10 w-full text-center"
                  >
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6"
                    >
                      <img 
                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Trophy.png" 
                        alt="Trophy" 
                        className="w-32 h-32 mx-auto mb-4 animate-bounce-slow drop-shadow-2xl"
                      />
                      <h2 className="text-2xl font-bold text-muted-foreground uppercase tracking-widest">
                        {result.length > 1 ? "Ganhadores" : "Ganhador"}
                      </h2>
                    </motion.div>

                    <div className="flex flex-wrap justify-center gap-4">
                      {result.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.3 + (index * 0.1) 
                          }}
                          className="px-8 py-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-neon-blue dark:to-neon-violet border border-white/20 shadow-lg dark:shadow-[0_0_30px_rgba(124,58,237,0.3)]"
                        >
                          <span className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                            {item}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-12 text-center">
                      <button 
                        onClick={() => setResult(null)}
                        className="inline-flex items-center justify-center px-8 py-3 rounded-full font-medium text-sm md:text-base transition-all duration-300 
                        bg-background dark:bg-muted/10 
                        text-foreground 
                        border border-border 
                        hover:bg-muted/50 
                        hover:border-primary/50 
                        shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Novo Sorteio
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="waiting"
                    className="z-10 text-center"
                    animate={isDrawing ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    {isDrawing ? (
                      <div className="space-y-4">
                        <Sparkles className="w-16 h-16 text-neon-blue mx-auto animate-spin" />
                        <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-violet font-mono">
                          {displayValue}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 opacity-50">
                        <Gift className="w-24 h-24 mx-auto mb-4" />
                        <p className="text-2xl font-medium">
                          Configure e clique em sortear
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* History List */}
            {history.length > 0 && (
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-neon-blue" />
                  Histórico Recente
                </h3>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                          {item.type === 'numbers' ? <Dices className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.title || "Sorteio"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString()}
                            <span className="mx-1">•</span>
                            {item.result?.length || 0} ganhadores
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <p className="text-sm font-bold text-neon-violet">
                            {Array.isArray(item.result) ? item.result.join(', ') : ''}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteFromHistory(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
