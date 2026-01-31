import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Calendar, Zap, TrendingUp, CheckCircle2, Target, Crown } from "lucide-react";

export const GamificationHeroAnimation = () => {
  const [activeDay, setActiveDay] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Simulação do fluxo de dias
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDay((prev) => {
        if (prev >= 14) {
          // Reset cycle
          setXp(0);
          setLevel(1);
          setShowLevelUp(false);
          return 0;
        }
        return prev + 1;
      });
    }, 800); // Velocidade da simulação

    return () => clearInterval(interval);
  }, []);

  // Efeitos baseados no dia atual
  useEffect(() => {
    if (activeDay === 0) return;

    // Ganhar XP a cada dia "ativo"
    const xpGain = Math.floor(Math.random() * 50) + 50;
    setXp((prev) => Math.min(prev + xpGain, 1000));

    // Level up no dia 10
    if (activeDay === 10) {
      setLevel(2);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  }, [activeDay]);

  const days = Array.from({ length: 15 }, (_, i) => i);

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center perspective-1000">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-neon-blue/20 blur-[100px] rounded-full opacity-30 animate-pulse-slow pointer-events-none" />

      {/* Main Dashboard Card - 3D Tilted */}
      <motion.div
        initial={{ rotateX: 10, rotateY: -10, y: 20, opacity: 0 }}
        animate={{ rotateX: 5, rotateY: -5, y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative w-[90%] max-w-[400px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl transform-gpu"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Floating Badges (Achievements) */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ scale: 0, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: -20, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold shadow-[0_0_30px_rgba(250,204,21,0.6)] flex items-center gap-2 whitespace-nowrap"
            >
              <Crown className="w-5 h-5 fill-black" />
              LEVEL UP!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header: Profile & Level */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-violet flex items-center justify-center text-white font-bold text-lg shadow-lg">
              <span className="relative z-10">JD</span>
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -bottom-1 -right-1 bg-neon-green w-5 h-5 rounded-full border-2 border-black flex items-center justify-center"
            >
              <Zap className="w-3 h-3 text-black fill-current" />
            </motion.div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">João Dev</span>
              <span className="text-neon-blue font-mono font-bold">Lvl {level}</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-neon-blue to-neon-cyan"
                initial={{ width: 0 }}
                animate={{ width: `${(xp / 1000) * 100}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{xp} XP</span>
              <span>1000 XP</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Atividade Recente</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {days.map((day) => {
              const isActive = day <= activeDay;
              const isToday = day === activeDay;
              
              return (
                <motion.div
                  key={day}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ 
                    scale: isActive ? 1 : 0.9, 
                    opacity: isActive ? 1 : 0.3,
                    backgroundColor: isActive ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    borderColor: isActive ? "rgba(34, 197, 94, 0.5)" : "transparent"
                  }}
                  className={`aspect-square rounded-lg border flex items-center justify-center relative overflow-hidden transition-colors duration-300`}
                >
                  {isActive && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-neon-green"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </motion.div>
                  )}
                  {isToday && (
                     <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="w-3 h-3" />
              <span>Missões</span>
            </div>
            <motion.div 
              key={activeDay}
              initial={{ y: 5, opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-bold text-white"
            >
              {Math.floor(activeDay / 2)}
            </motion.div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Trophy className="w-3 h-3" />
              <span>Rank</span>
            </div>
            <div className="text-2xl font-bold text-neon-orange flex items-center gap-1">
              #<motion.span>{Math.max(1, 10 - Math.floor(activeDay / 3))}</motion.span>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Decorative Floating Elements */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute -right-8 top-20 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl z-20"
        >
           <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          className="absolute -left-6 bottom-20 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl z-20"
        >
           <Zap className="w-6 h-6 text-neon-blue fill-neon-blue" />
        </motion.div>

      </motion.div>
    </div>
  );
};
