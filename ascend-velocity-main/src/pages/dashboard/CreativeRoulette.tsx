import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation, useMotionValue, useSpring } from "framer-motion";
import { 
  Dice5, 
  Plus, 
  Trash2, 
  Pencil, 
  RotateCw, 
  Sparkles, 
  X, 
  Save,
  Lightbulb,
  ChevronDown
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface Challenge {
  id: string;
  text: string;
}

const DEFAULT_CHALLENGES: Challenge[] = [
  { id: "1", text: "Mostre os bastidores do seu trabalho" },
  { id: "2", text: "Responda uma caixinha de perguntas polêmica" },
  { id: "3", text: "Conte um erro que você cometeu e o que aprendeu" },
  { id: "4", text: "Compartilhe uma ferramenta que você usa todos os dias" },
  { id: "5", text: "Faça um tutorial rápido de algo que você domina" },
  { id: "6", text: "Mostre sua rotina matinal" },
  { id: "7", text: "Reaja a uma notícia ou tendência do seu nicho" },
  { id: "8", text: "Agradeça seus seguidores por uma conquista recente" },
  { id: "9", text: "Poste uma foto antiga e conte sua história (TBT)" },
  { id: "10", text: "Dê uma dica rápida que economiza tempo" },
  { id: "11", text: "Pergunte a opinião da audiência sobre um projeto novo" },
  { id: "12", text: "Mostre seu espaço de trabalho" }
];

const WHEEL_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
  "#FFEEAD", "#D4A5A5", "#9B59B6", "#3498DB",
  "#E67E22", "#2ECC71", "#F1C40F", "#E74C3C"
];

const CreativeRoulette = () => {
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const saved = localStorage.getItem("creative-challenges");
    return saved ? JSON.parse(saved) : DEFAULT_CHALLENGES;
  });
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const wheelControls = useAnimation();
  const rotation = useMotionValue(0);
  
  // Sound Effect Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSegmentIndex = useRef<number>(-1);

  // Edit Mode States
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [newChallengeText, setNewChallengeText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("creative-challenges", JSON.stringify(challenges));
  }, [challenges]);

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playTickSound = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(800, ctx.currentTime); // High pitch click
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.05);
  };

  // Monitor rotation for sound
  useEffect(() => {
    const unsubscribe = rotation.on("change", (latest) => {
      const segmentAngle = 360 / challenges.length;
      const normalizedRotation = latest % 360;
      // Calculate which segment is currently passing the top pointer (0 degrees visual)
      // Similar logic to winning calculation but checking for boundary crossing
      
      // Current index under pointer
      const angleUnderPointer = (360 - normalizedRotation) % 360;
      const currentIndex = Math.floor(angleUnderPointer / segmentAngle);

      if (currentIndex !== lastSegmentIndex.current && isSpinning) {
        playTickSound();
        lastSegmentIndex.current = currentIndex;
      }
    });

    return () => unsubscribe();
  }, [challenges.length, isSpinning, rotation]);

  const spin = async () => {
    if (isSpinning || challenges.length === 0) return;

    // Resume audio context if suspended (browser policy)
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    setIsSpinning(true);
    setSelectedChallenge(null);
    
    // Spin logic
    const segmentAngle = 360 / challenges.length;
    const spins = 5; // Number of full rotations
    const randomOffset = Math.random() * 360;
    const currentRotation = rotation.get();
    const targetRotation = currentRotation + (360 * spins) + randomOffset;
    
    await wheelControls.start({
      rotate: targetRotation,
      transition: { 
        duration: 4, 
        ease: [0.2, 0.8, 0.3, 1], // Custom bezier for realistic deceleration
        type: "tween"
      }
    });

    rotation.set(targetRotation);
    
    // Calculate winner
    // The wheel rotates CLOCKWISE.
    // The pointer is at the TOP (270 degrees in standard SVG coordinates).
    // Segment 0 starts at 0 degrees (3 o'clock).
    // We want to find which segment 'i' satisfies: 
    // (StartAngle(i) + Rotation) <= 270 < (EndAngle(i) + Rotation)
    // i * segmentAngle + Rotation <= 270
    // i * segmentAngle <= 270 - Rotation
    // i = floor((270 - Rotation) / segmentAngle)
    
    const normalizedRotation = targetRotation % 360;
    // The pointer is at the visual TOP.
    // Due to SVG -90deg rotation, Index 0 starts at visual TOP (0 deg) and goes Clockwise.
    // We calculate the angle on the wheel that is currently under the pointer (at 0 deg visual).
    // angleUnderPointer = (0 - Rotation) normalized to [0, 360]
    const angleUnderPointer = (360 - normalizedRotation) % 360;
    const winningIndex = Math.floor(angleUnderPointer / segmentAngle);
    
    // Ensure index is within bounds
    const safeIndex = winningIndex >= challenges.length ? 0 : winningIndex;
    
    const winner = challenges[safeIndex];
    
    setSelectedChallenge(winner);
    setIsSpinning(false);

    // Trigger confetti
    const end = Date.now() + 3 * 1000; // 3 seconds
    const colors = ['#00F2FF', '#8B5CF6', '#FF00FF'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const addChallenge = () => {
    if (!newChallengeText.trim()) return;
    
    const newChallenge: Challenge = {
      id: Math.random().toString(36).substr(2, 9),
      text: newChallengeText
    };
    
    setChallenges([...challenges, newChallenge]);
    setNewChallengeText("");
    toast.success("Desafio adicionado!");
  };

  const updateChallenge = () => {
    if (!editingId || !newChallengeText.trim()) return;
    
    setChallenges(challenges.map(c => 
      c.id === editingId ? { ...c, text: newChallengeText } : c
    ));
    setEditingId(null);
    setNewChallengeText("");
    toast.success("Desafio atualizado!");
  };

  const removeChallenge = (id: string) => {
    if (challenges.length <= 1) {
      toast.error("Você precisa ter pelo menos 1 desafio!");
      return;
    }
    setChallenges(challenges.filter(c => c.id !== id));
    toast.success("Desafio removido!");
  };

  const startEdit = (challenge: Challenge) => {
    setEditingId(challenge.id);
    setNewChallengeText(challenge.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewChallengeText("");
  };

  // Wheel Rendering Helpers
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 md:p-8 max-w-6xl">
        <header className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-purple-600 flex items-center gap-3 justify-center md:justify-start">
              <Dice5 className="w-8 h-8 text-neon-blue" />
              Roleta Criativa
            </h1>
            <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto md:mx-0 font-light tracking-wide border-l-4 border-neon-blue pl-4 bg-gradient-to-r from-neon-blue/5 to-transparent py-2 rounded-r-lg">
              Gire a roleta e receba um <span className="font-medium text-neon-blue">desafio criativo</span> para o seu conteúdo de hoje.
            </p>
          </div>
          
          <Button 
            variant="outline" 
            className="border-neon-blue/20 hover:bg-neon-blue/10"
            onClick={() => setIsManageOpen(true)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Gerenciar Opções
          </Button>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Roulette Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
              {/* Pointer */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-white filter drop-shadow-lg">
                <ChevronDown className="w-10 h-10 fill-current text-neon-blue" />
              </div>

              {/* Wheel Container */}
              <div className="w-full h-full rounded-full border-4 border-border/20 dark:bg-background/40 bg-background/40 shadow-[0_0_50px_rgba(0,242,255,0.1)] dark:shadow-[0_0_50px_rgba(0,242,255,0.1)] shadow-2xl relative overflow-hidden">
                <motion.div 
                  className="w-full h-full"
                  animate={wheelControls}
                  style={{ rotate: rotation }}
                >
                  <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
                    {challenges.map((challenge, index) => {
                      const startPercent = index / challenges.length;
                      const endPercent = (index + 1) / challenges.length;
                      const [startX, startY] = getCoordinatesForPercent(startPercent);
                      const [endX, endY] = getCoordinatesForPercent(endPercent);
                      const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
                      const pathData = [
                        `M ${startX} ${startY}`,
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `L 0 0`,
                      ].join(" ");

                      return (
                        <g key={challenge.id}>
                          <path 
                            d={pathData} 
                            fill={WHEEL_COLORS[index % WHEEL_COLORS.length]} 
                            stroke="rgba(0,0,0,0.2)"
                            strokeWidth="0.01"
                          />
                          {/* Text/Number */}
                          <text
                            x={(startX + endX) / 3}
                            y={(startY + endY) / 3}
                            fill="white"
                            fontSize="0.15"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${(index * 360 / challenges.length) + (180 / challenges.length)}, ${(startX + endX) / 3}, ${(startY + endY) / 3})`} // Simple rotation attempt, may need refinement
                            style={{ textShadow: "1px 1px 2px black" }}
                          >
                            {index + 1}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </motion.div>
              </div>
              
              {/* Center Hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-4 border-gray-200 shadow-lg flex items-center justify-center z-10">
                <div className="w-12 h-12 bg-neon-blue rounded-full flex items-center justify-center animate-pulse">
                   <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="mt-8 w-full max-w-xs">
              <motion.button
                onClick={spin}
                disabled={isSpinning || challenges.length === 0}
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 242, 255, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative w-full py-4 px-8 rounded-2xl font-bold text-lg tracking-wide
                  transition-all duration-300 overflow-hidden group
                  ${isSpinning 
                    ? 'bg-gray-200 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700' 
                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-neon-blue dark:via-purple-500 dark:to-pink-500 text-white shadow-lg dark:shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(0,242,255,0.5)] hover:scale-[1.02] active:scale-[0.98]'}
                `}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                
                <span className="relative flex items-center justify-center gap-3 z-10">
                  {isSpinning ? (
                    <>
                      <RotateCw className="w-5 h-5 animate-spin" />
                      <span className="text-base">Sorteando...</span>
                    </>
                  ) : (
                    <>
                      <Dice5 className="w-6 h-6 transition-transform group-hover:rotate-180 duration-500" />
                      GIRAR
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </div>

          {/* Result Section */}
          <div className="flex flex-col gap-6">
             <GlassCard className="p-6 min-h-[200px] flex flex-col justify-center relative overflow-hidden border-neon-blue/20 dark:border-neon-blue/20 border-neon-blue/10 bg-white/50 dark:bg-black/50">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-purple-500/5 to-transparent pointer-events-none" />
                
                <AnimatePresence mode="wait">
                  {selectedChallenge ? (
                    <motion.div
                      key="result"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-center"
                    >
                      <div className="inline-block p-3 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 mb-4 border border-green-500/30">
                        <Lightbulb className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        Desafio #{challenges.indexOf(selectedChallenge) + 1}
                      </h2>
                      <p className="text-xl md:text-2xl text-foreground/90 font-medium leading-relaxed">
                        "{selectedChallenge.text}"
                      </p>
                      <div className="mt-6 pt-6 border-t border-border flex justify-center gap-4">
                         <Button variant="outline" onClick={() => {
                           navigator.clipboard.writeText(selectedChallenge.text);
                           toast.success("Copiado!");
                         }}>
                           Copiar Texto
                         </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-muted-foreground"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                        <RotateCw className={`w-8 h-8 ${isSpinning ? 'animate-spin text-neon-blue' : 'text-gray-400 dark:text-gray-500'}`} />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                        {isSpinning ? "A sorte está sendo lançada..." : "Pronto para girar?"}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">Clique no botão para descobrir seu próximo conteúdo.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
             </GlassCard>


          </div>
        </div>

        {/* Management Dialog */}
        <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
          <DialogContent className="bg-white dark:bg-[#0f172a]/95 backdrop-blur-xl border-gray-200 dark:border-white/10 text-gray-900 dark:text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Pencil className="w-5 h-5 text-neon-blue" />
                Gerenciar Banco de Ideias
              </DialogTitle>
            </DialogHeader>
            
            <div className="p-1 space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newChallengeText}
                  onChange={(e) => setNewChallengeText(e.target.value)}
                  placeholder="Digite uma nova ideia de desafio..."
                  className="bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-white/10 focus:border-neon-blue text-gray-900 dark:text-white placeholder:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editingId) {
                        updateChallenge();
                      } else {
                        addChallenge();
                      }
                    }
                  }}
                />
                {editingId ? (
                  <div className="flex gap-1">
                    <Button onClick={updateChallenge} className="bg-green-600 hover:bg-green-700 text-white">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button onClick={cancelEdit} variant="ghost" className="hover:bg-muted">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={addChallenge} className="bg-neon-blue text-black hover:bg-neon-blue/80">
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 mt-2">
              {challenges.map((challenge, idx) => (
                <div 
                  key={challenge.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${editingId === challenge.id ? 'bg-neon-blue/10 border-neon-blue/30' : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-3 flex-1 mr-4">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: WHEEL_COLORS[idx % WHEEL_COLORS.length], color: 'black' }}>
                      {idx + 1}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200">{challenge.text}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => startEdit(challenge)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md text-gray-500 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeChallenge(challenge.id)}
                      className="p-2 hover:bg-red-500/20 rounded-md text-gray-500 dark:text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CreativeRoulette;
