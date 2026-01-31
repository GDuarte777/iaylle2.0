import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice5, MessageCircle, Rocket, Sparkles, Send, Copy, Trophy, Zap, Play, CheckCircle2, Workflow } from "lucide-react";

// --- Workflow Visual ---
export const FeatureMockupWorkflow = () => {
  return (
    <div className="relative w-full h-full min-h-[200px] flex items-center justify-center bg-black/20 rounded-lg border border-white/5 p-4 overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* SVG Container - Scaling exactly to match HTML overlay */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-0" 
        viewBox="0 0 400 200" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
          </linearGradient>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#8b5cf6" fillOpacity="0.6" />
          </marker>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Connection 1: Trigger (50,100) -> Action (200,50) */}
        {/* Adjusted for node sizes: Start w=64(r=32), Action w=80(r=40) */}
        {/* Path starts at x=82, ends at x=160 */}
        <motion.path
          d="M 82 100 C 121 100, 121 50, 160 50"
          fill="none"
          stroke="url(#line-gradient)"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
        />

        {/* Connection 2: Trigger (50,100) -> Delay (200,150) */}
        {/* Delay w=80(r=40). Path ends at x=160 */}
        <motion.path
          d="M 82 100 C 121 100, 121 150, 160 150"
          fill="none"
          stroke="url(#line-gradient)"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.7, ease: "easeInOut" }}
        />

        {/* Connection 3: Action (200,50) -> End (350,100) */}
        {/* Action w=80(r=40) -> starts x=240. End w=56(r=28) -> ends x=322 */}
        <motion.path
          d="M 240 50 C 281 50, 281 100, 322 100"
          fill="none"
          stroke="url(#line-gradient)"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.8, ease: "easeInOut" }}
        />

        {/* Connection 4: Delay (200,150) -> End (350,100) */}
        <motion.path
          d="M 240 150 C 281 150, 281 100, 322 100"
          fill="none"
          stroke="url(#line-gradient)"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 2.0, ease: "easeInOut" }}
        />

        {/* Data Packets */}
        <motion.circle r="3" fill="#fff" filter="url(#glow)">
          <animateMotion dur="2.5s" repeatCount="indefinite" path="M 82 100 C 121 100, 121 50, 160 50" begin="1s" />
        </motion.circle>
        <motion.circle r="3" fill="#fff" filter="url(#glow)">
          <animateMotion dur="2.8s" repeatCount="indefinite" path="M 82 100 C 121 100, 121 150, 160 150" begin="1.2s" />
        </motion.circle>
        <motion.circle r="3" fill="#fff" filter="url(#glow)">
          <animateMotion dur="2.5s" repeatCount="indefinite" path="M 240 50 C 281 50, 281 100, 322 100" begin="2.2s" />
        </motion.circle>
        <motion.circle r="3" fill="#fff" filter="url(#glow)">
          <animateMotion dur="2.5s" repeatCount="indefinite" path="M 240 150 C 281 150, 281 100, 322 100" begin="2.4s" />
        </motion.circle>
      </svg>

      {/* Node: Trigger (Start) - 12.5% Left, 50% Top */}
      <motion.div
        className="absolute left-[12.5%] top-[50%] w-16 h-16 bg-black/80 backdrop-blur-md border border-neon-blue/50 rounded-xl flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)] z-10"
        style={{ x: "-50%", y: "-50%" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <Zap className="w-6 h-6 text-neon-blue" />
        <span className="text-[8px] text-neon-blue font-bold">START</span>
      </motion.div>

      {/* Node: Action (Top) - 50% Left, 25% Top */}
      <motion.div
        className="absolute left-[50%] top-[25%] w-20 h-14 bg-black/80 backdrop-blur-md border border-neon-violet/50 rounded-lg flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_-5px_rgba(139,92,246,0.5)] z-10"
        style={{ x: "-50%", y: "-50%" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
      >
        <MessageCircle className="w-5 h-5 text-neon-violet" />
        <span className="text-[8px] text-neon-violet font-bold">MSG</span>
      </motion.div>

      {/* Node: Delay (Bottom) - 50% Left, 75% Top */}
      <motion.div
        className="absolute left-[50%] top-[75%] w-20 h-14 bg-black/80 backdrop-blur-md border border-neon-orange/50 rounded-lg flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_-5px_rgba(249,115,22,0.5)] z-10"
        style={{ x: "-50%", y: "-50%" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.0, type: "spring" }}
      >
        <div className="w-5 h-5 rounded-full border-2 border-neon-orange border-t-transparent animate-spin" />
        <span className="text-[8px] text-neon-orange font-bold">WAIT</span>
      </motion.div>

      {/* Node: End - 87.5% Left, 50% Top */}
      <motion.div
        className="absolute left-[87.5%] top-[50%] w-14 h-14 bg-black/80 backdrop-blur-md border border-neon-green/50 rounded-full flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_-5px_rgba(34,197,94,0.5)] z-10"
        style={{ x: "-50%", y: "-50%" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 2.2, type: "spring" }}
      >
        <CheckCircle2 className="w-6 h-6 text-neon-green" />
        <span className="text-[8px] text-neon-green font-bold">DONE</span>
      </motion.div>

      {/* Execution Indicator */}
      <motion.div
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full border border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[9px] text-muted-foreground font-mono">RUNNING</span>
      </motion.div>
    </div>
  );
};

// --- Roleta Criativa ---
export const FeatureMockupRoulette = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const items = ["Post", "Reels", "Story", "Live", "Quiz", "Enquete"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelected(null);
    
    // Rotação aleatória: min 5 voltas (1800deg) + aleatório
    const newRotation = rotation + 1800 + Math.random() * 360;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      // Calcular item selecionado (simplificado para demo)
      setSelected(Math.floor(Math.random() * items.length));
    }, 3000);
  };

  return (
    <div className="relative w-full h-full min-h-[160px] flex flex-col items-center justify-center p-4 overflow-hidden group cursor-pointer" onClick={spin}>
      <div className="relative w-24 h-24 mb-3">
        {/* Ponteiro */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-4 h-4 text-white drop-shadow-md">
          ▼
        </div>
        
        {/* Roda */}
        <motion.div
          className="w-full h-full rounded-full border-4 border-white/10 shadow-xl overflow-hidden relative bg-black"
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: "circOut" }}
        >
          {items.map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-full top-0 left-0 origin-center"
              style={{
                transform: `rotate(${i * (360 / items.length)}deg)`,
                clipPath: "polygon(50% 50%, 100% 0, 100% 100%)" // Simplificado
              }}
            >
               <div 
                 className="w-full h-full opacity-80"
                 style={{ 
                   backgroundColor: colors[i],
                   transform: `skewY(-30deg) rotate(15deg)` // Ajuste visual
                 }} 
               />
            </div>
          ))}
          {/* Centro */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-inner flex items-center justify-center z-10">
             <div className="w-4 h-4 bg-gray-200 rounded-full" />
          </div>
        </motion.div>
      </div>

      <div className="text-center z-10">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Dice5 className={`w-4 h-4 ${isSpinning ? 'animate-spin' : 'text-neon-green'}`} />
          <span className="font-semibold text-sm">Roleta Criativa</span>
        </div>
        <AnimatePresence mode="wait">
          {selected !== null ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-neon-green font-bold bg-neon-green/10 px-2 py-0.5 rounded-full"
            >
              {items[selected]}!
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-muted-foreground"
            >
              Clique para girar
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Gerador WhatsApp ---
export const FeatureMockupWhatsApp = () => {
  const [text, setText] = useState("");
  const [showLink, setShowLink] = useState(false);
  const fullText = "Olá! Gostaria de mais info...";

  useEffect(() => {
    let i = 0;
    let timeout: NodeJS.Timeout;
    
    const type = () => {
      if (i <= fullText.length) {
        setText(fullText.slice(0, i));
        i++;
        timeout = setTimeout(type, 100);
      } else {
        setTimeout(() => setShowLink(true), 500);
        setTimeout(() => {
          // Reset
          setShowLink(false);
          setText("");
          i = 0;
          type();
        }, 4000);
      }
    };

    type();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[160px] flex flex-col justify-between p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-neon-orange/20 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-neon-orange" />
        </div>
        <span className="font-semibold text-sm">Gerador Link</span>
      </div>

      <div className="space-y-2 flex-1">
        {/* Input Simulado */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-2 h-16 relative overflow-hidden">
          <p className="text-[10px] text-muted-foreground mb-1">Mensagem:</p>
          <p className="text-xs text-white font-mono leading-tight">
            {text}<span className="animate-pulse">|</span>
          </p>
        </div>

        {/* Resultado */}
        <AnimatePresence>
          {showLink && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-2 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded bg-neon-green flex items-center justify-center shrink-0">
                  <Send className="w-3 h-3 text-black ml-0.5" />
                </div>
                <div className="text-[10px] text-neon-green truncate">wa.me/5511...?text=Ola...</div>
              </div>
              <Copy className="w-3 h-3 text-neon-green shrink-0 opacity-70" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Sorteios ---
export const FeatureMockupRaffle = () => {
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const participants = ["Ana", "Bruno", "Carla", "Daniel", "Elena", "Fábio"];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRolling(true);
      setWinner(null);
      
      setTimeout(() => {
        setIsRolling(false);
        setWinner(participants[Math.floor(Math.random() * participants.length)]);
      }, 2000);

    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[160px] flex flex-col p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-neon-blue" />
          <span className="font-semibold text-sm">Sorteios</span>
        </div>
        <div className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground">
          x inscritos
        </div>
      </div>

      <div className="flex-1 relative bg-black/40 rounded-lg border border-white/10 overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isRolling ? (
            <motion.div
              key="rolling"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            >
              <motion.div 
                className="flex flex-col gap-2"
                animate={{ y: [0, -100] }}
                transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
              >
                {[...participants, ...participants].map((p, i) => (
                  <div key={i} className="text-sm text-muted-foreground opacity-50">{p}</div>
                ))}
              </motion.div>
            </motion.div>
          ) : winner ? (
            <motion.div
              key="winner"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center z-10"
            >
              <div className="w-10 h-10 mx-auto bg-gradient-to-br from-neon-blue to-neon-violet rounded-full flex items-center justify-center mb-2 shadow-lg shadow-neon-blue/20">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-muted-foreground">Vencedor:</p>
              <p className="text-lg font-bold text-white">{winner}</p>
              <Sparkles className="absolute top-0 right-0 w-4 h-4 text-yellow-400 animate-pulse" />
              <Sparkles className="absolute bottom-0 left-0 w-4 h-4 text-yellow-400 animate-pulse delay-75" />
            </motion.div>
          ) : (
            <div className="text-xs text-muted-foreground">Preparando...</div>
          )}
        </AnimatePresence>
        
        {/* Scanlines effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_2px,3px_100%]" />
      </div>
    </div>
  );
};
