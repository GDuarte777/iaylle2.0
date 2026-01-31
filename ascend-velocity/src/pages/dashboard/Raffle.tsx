import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dices, Users, RotateCcw, Sparkles, Gift, FileSpreadsheet, Upload, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useTheme } from "next-themes";
import { incrementMonthlyUsageSafe } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTutorial } from "@/hooks/useTutorial";

export default function Raffle() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { startRaffleTutorial } = useTutorial();
  const [activeTab, setActiveTab] = useState("numbers");
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState<string[] | number[] | null>(null);
  const [displayValue, setDisplayValue] = useState<string | number>("?");

  // Numbers State
  const [min, setMin] = useState<number | string>(1);
  const [max, setMax] = useState<number | string>(100);
  const [quantity, setQuantity] = useState<number | string>(1);
  
  // Names State
  const [namesInput, setNamesInput] = useState("");

  // CSV State
  const [csvNames, setCsvNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      const minVal = Number(min) || 0;
      const maxVal = Number(max) || 0;
      if (minVal >= maxVal) {
        setIsDrawing(false);
        return;
      }
      // Create array for animation - Math.random is fine for animation visual effect
      possibleValues = Array.from({ length: 100 }, () => Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal);
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
      const minVal = Number(min) || 0;
      const maxVal = Number(max) || 0;
      const qtyVal = Number(quantity) || 1;

      config = { type: 'numbers', min: minVal, max: maxVal, quantity: qtyVal };
      const range = maxVal - minVal + 1;
      if (qtyVal >= range) {
        // If quantity requested is larger than range, just return all shuffled using secure random
        const allNumbers = Array.from({ length: range }, (_, i) => minVal + i);
        // Fisher-Yates shuffle with secure random
        for (let i = allNumbers.length - 1; i > 0; i--) {
          const j = Math.floor(getSecureRandom() * (i + 1));
          [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
        }
        finalResult = allNumbers.slice(0, qtyVal);
      } else {
        // Unique random numbers using secure random
        const set = new Set<number>();
        while (set.size < qtyVal) {
          // Generate secure random integer between min and max
          const randomInt = Math.floor(getSecureRandom() * (maxVal - minVal + 1)) + minVal;
          set.add(randomInt);
        }
        finalResult = Array.from(set);
      }
    } else {
      const names = activeTab === "names" 
        ? namesInput.split("\n").filter(n => n.trim() !== "")
        : csvNames;

      const qtyVal = Number(quantity) || 1;
      config = { type: activeTab, count: names.length, quantity: qtyVal };

      // Fisher-Yates shuffle with secure random
      const shuffled = [...names];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(getSecureRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      finalResult = shuffled.slice(0, qtyVal);
    }

    setResult(finalResult as string[] | number[]);
    setIsDrawing(false);
    triggerConfetti();

    if (user) {
      const { blocked } = await incrementMonthlyUsageSafe({ delta: 1, pagePath: window.location.pathname });
      if (blocked) {
        navigate("/dashboard/settings?blocked=1", { replace: true });
        return;
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
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center md:justify-start gap-3">
              <Gift className="w-8 h-8 md:w-10 md:h-10 text-neon-blue animate-bounce-slow" />
              Sorteios
            </h1>
            <p className="text-muted-foreground">
              Realize sorteios de números ou nomes de forma rápida e justa
            </p>
          </div>
          <Button
            onClick={startRaffleTutorial}
            variant="outline"
            className="flex gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-foreground px-6"
          >
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            Como usar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Section */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard className="p-6">
              <Tabs defaultValue="numbers" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="numbers" className="flex gap-2" id="raffle-numbers-tab">
                    <Dices className="w-4 h-4" />
                    Números
                  </TabsTrigger>
                  <TabsTrigger value="names" className="flex gap-2" id="raffle-names-tab">
                    <Users className="w-4 h-4" />
                    Nomes
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="flex gap-2" id="raffle-import-tab">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="numbers" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mínimo</Label>
                      <Input 
                        type="number" 
                        value={min} 
                        onChange={(e) => setMin(e.target.value === "" ? "" : Number(e.target.value))}
                        className="glass-card border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Máximo</Label>
                      <Input 
                        type="number" 
                        value={max} 
                        onChange={(e) => setMax(e.target.value === "" ? "" : Number(e.target.value))}
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
                      onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
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
                      onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
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
                  </div>
                </TabsContent>

                {activeTab !== 'csv' && (
                  <div className="mt-8">
                    <NeonButton 
                      variant="neon" 
                      className="w-full h-12 text-lg"
                      onClick={handleDraw}
                      disabled={isDrawing}
                    >
                      {isDrawing ? "Sorteando..." : "Sortear Agora"}
                    </NeonButton>
                  </div>
                )}
              </Tabs>
            </GlassCard>
          </div>

          {/* Result Section */}
          <div className="lg:col-span-7 space-y-8">
            <GlassCard className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 relative overflow-hidden" id="raffle-result-area">
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
