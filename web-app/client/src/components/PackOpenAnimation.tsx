import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StickerCard, { type CardData } from "./StickerCard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, X, Eye } from "lucide-react";
import { RARITY_CONFIG, type Rarity } from "../../../shared/gameData";

interface PackOpenAnimationProps {
  cards: CardData[];
  vrfData?: {
    commitHash: string;
    blockHash: string;
    randomValue: string;
    proof: string;
    verificationSteps?: string[];
    isValid: boolean;
  };
  packType: "basico" | "premium" | "lendario";
  onClose: () => void;
}

// Particle component for rare card reveals
function RarityParticles({ rarity, active }: { rarity: Rarity; active: boolean }) {
  const config = RARITY_CONFIG[rarity];
  if (!config.holographic || !active) return null;

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 2,
    duration: Math.random() * 2 + 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: config.color,
            boxShadow: `0 0 ${p.size * 2}px ${config.color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0.5, 0],
            scale: [0, 1.5, 1, 0],
            y: [0, -30, -60],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// Holographic overlay that responds to reveal
function HoloRevealOverlay({ rarity, revealed }: { rarity: Rarity; revealed: boolean }) {
  const config = RARITY_CONFIG[rarity];
  if (!config.holographic || !revealed) return null;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none rounded-xl z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      style={{
        background: `linear-gradient(135deg, transparent 0%, ${config.color}20 25%, transparent 50%, ${config.color}15 75%, transparent 100%)`,
        backgroundSize: "200% 200%",
        animation: "holo-move 2s ease-in-out infinite",
      }}
    />
  );
}

// Individual card slot with 3D flip
function CardSlot({
  card,
  index,
  revealed,
  onReveal,
  autoRevealDelay,
}: {
  card: CardData;
  index: number;
  revealed: boolean;
  onReveal: () => void;
  autoRevealDelay?: number;
}) {
  const config = RARITY_CONFIG[card.rarity];
  const isHolo = config.holographic;

  return (
    <motion.div
      className="relative cursor-pointer"
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.12,
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
      }}
      onClick={onReveal}
      style={{ perspective: "1200px" }}
    >
      <motion.div
        className="relative w-[150px] h-[220px] sm:w-[170px] sm:h-[250px]"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateY: revealed ? 180 : 0,
        }}
        transition={{
          duration: 0.8,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        {/* Front face (unrevealed) */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
            {/* Card back pattern */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 0% 50%)`,
              backgroundSize: "20px 20px",
            }} />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />

            {/* FIFA World Cup logo placeholder */}
            <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="text-2xl">⚽</span>
            </div>
            <div className="relative z-10 text-center">
              <p className="text-[10px] font-bold text-primary/70 uppercase tracking-[0.2em]">FIFA</p>
              <p className="text-[8px] text-white/40 uppercase tracking-wider">World Cup</p>
            </div>

            {/* Tap to reveal hint */}
            <motion.p
              className="relative z-10 text-[10px] text-white/30 mt-2"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Toque para revelar
            </motion.p>
          </div>
        </div>

        {/* Back face (revealed card) */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Glow effect for rare cards */}
          {isHolo && revealed && (
            <motion.div
              className="absolute -inset-2 rounded-2xl z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: `radial-gradient(ellipse at center, ${config.color}40 0%, transparent 70%)`,
                filter: "blur(8px)",
              }}
            />
          )}

          <div className="relative z-10">
            <StickerCard card={card} size="md" showAttrs={true} />
          </div>

          {/* Particles for holographic cards */}
          <RarityParticles rarity={card.rarity} active={revealed} />
          <HoloRevealOverlay rarity={card.rarity} revealed={revealed} />
        </div>
      </motion.div>

      {/* Card number badge */}
      <motion.div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <span
          className="px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{
            background: `${config.color}20`,
            color: config.color,
            border: `1px solid ${config.color}40`,
          }}
        >
          {config.label}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function PackOpenAnimation({ cards, vrfData, packType, onClose }: PackOpenAnimationProps) {
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"intro" | "cards" | "summary">("intro");
  const [showVrf, setShowVrf] = useState(false);

  const allRevealed = revealedIndices.size === cards.length;

  // Intro animation then show cards
  useEffect(() => {
    const timer = setTimeout(() => setPhase("cards"), 1800);
    return () => clearTimeout(timer);
  }, []);

  const revealCard = useCallback((index: number) => {
    setRevealedIndices((prev) => {
      const next = new Set(Array.from(prev));
      next.add(index);
      return next;
    });
  }, []);

  const revealAll = useCallback(() => {
    const allIndices = cards.map((_, i) => i);
    // Stagger reveal
    allIndices.forEach((idx, i) => {
      setTimeout(() => {
        setRevealedIndices((prev) => {
          const next = new Set(Array.from(prev));
          next.add(idx);
          return next;
        });
      }, i * 200);
    });
  }, [cards]);

  // Pack type config
  const packConfig = {
    basico: { color: "#94a3b8", name: "Básico", glow: "rgba(148,163,184,0.3)" },
    premium: { color: "#3b82f6", name: "Premium", glow: "rgba(59,130,246,0.4)" },
    lendario: { color: "#f59e0b", name: "Lendário", glow: "rgba(245,158,11,0.5)" },
  };

  const pConfig = packConfig[packType];

  // Count rarities
  const rarityCounts: Record<string, number> = {};
  cards.forEach((c) => {
    rarityCounts[c.rarity] = (rarityCounts[c.rarity] || 0) + 1;
  });

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={allRevealed ? onClose : undefined}
        />

        {/* Close button */}
        <motion.button
          className="absolute top-4 right-4 z-60 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <X className="w-5 h-5 text-white" />
        </motion.button>

        {/* Intro Phase - Pack Opening Animation */}
        {phase === "intro" && (
          <motion.div
            className="relative z-10 flex flex-col items-center"
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {/* Glowing pack */}
            <motion.div
              className="relative"
              initial={{ scale: 0.5, rotateZ: -5 }}
              animate={{
                scale: [0.5, 1.2, 1.0],
                rotateZ: [-5, 5, 0],
              }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Glow ring */}
              <motion.div
                className="absolute -inset-8 rounded-3xl"
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0.8, 1.5, 2],
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                  background: `radial-gradient(ellipse at center, ${pConfig.glow} 0%, transparent 70%)`,
                }}
              />

              {/* Pack container */}
              <motion.div
                className="w-40 h-56 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
                style={{
                  borderColor: pConfig.color,
                  background: `linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.95))`,
                  boxShadow: `0 0 60px ${pConfig.glow}`,
                }}
                animate={{
                  boxShadow: [
                    `0 0 30px ${pConfig.glow}`,
                    `0 0 80px ${pConfig.glow}`,
                    `0 0 30px ${pConfig.glow}`,
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {/* Burst lines */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  style={{
                    background: `conic-gradient(from 0deg, transparent, ${pConfig.color}30, transparent, ${pConfig.color}30, transparent)`,
                  }}
                />

                <motion.span
                  className="text-5xl relative z-10"
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                >
                  ⚽
                </motion.span>
                <p className="text-sm font-bold relative z-10" style={{ color: pConfig.color }}>
                  Pacote {pConfig.name}
                </p>
                <p className="text-xs text-white/50 relative z-10">{cards.length} figurinhas</p>
              </motion.div>
            </motion.div>

            {/* Opening text */}
            <motion.p
              className="mt-6 text-lg font-bold text-white/80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Abrindo pacote...
            </motion.p>
          </motion.div>
        )}

        {/* Cards Phase - Reveal */}
        {phase === "cards" && (
          <motion.div
            className="relative z-10 flex flex-col items-center max-w-4xl w-full px-4 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-display text-2xl sm:text-3xl text-white flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6" style={{ color: pConfig.color }} />
                Pacote {pConfig.name}
                <Sparkles className="w-6 h-6" style={{ color: pConfig.color }} />
              </h2>
              <p className="text-sm text-white/50 mt-1">
                {allRevealed
                  ? `${cards.length} figurinhas reveladas!`
                  : `Toque nas cartas para revelar (${revealedIndices.size}/${cards.length})`}
              </p>
            </motion.div>

            {/* Cards grid */}
            <div className="flex flex-wrap gap-4 sm:gap-5 justify-center mb-8">
              {cards.map((card, i) => (
                <CardSlot
                  key={i}
                  card={card}
                  index={i}
                  revealed={revealedIndices.has(i)}
                  onReveal={() => revealCard(i)}
                />
              ))}
            </div>

            {/* Action buttons */}
            <motion.div
              className="flex flex-wrap gap-3 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {!allRevealed && (
                <Button
                  onClick={revealAll}
                  className="font-bold gap-2 px-6"
                  style={{ backgroundColor: pConfig.color, color: packType === "lendario" ? "#000" : "#fff" }}
                >
                  <Eye className="w-4 h-4" />
                  Revelar Todas
                </Button>
              )}

              {allRevealed && (
                <>
                  {/* Rarity summary */}
                  <div className="flex gap-2 items-center mr-4">
                    {Object.entries(rarityCounts).map(([rarity, count]) => {
                      const rc = RARITY_CONFIG[rarity as Rarity];
                      return (
                        <span
                          key={rarity}
                          className="px-2 py-1 rounded-lg text-xs font-bold"
                          style={{
                            background: `${rc.color}15`,
                            color: rc.color,
                            border: `1px solid ${rc.color}30`,
                          }}
                        >
                          {count}x {rc.label}
                        </span>
                      );
                    })}
                  </div>

                  <Button onClick={onClose} className="font-bold gap-2 bg-white/10 hover:bg-white/20 text-white">
                    Fechar
                  </Button>
                </>
              )}

              {vrfData && (
                <Button
                  onClick={() => setShowVrf(!showVrf)}
                  variant="outline"
                  className="font-semibold gap-2 text-green-400 border-green-400/30 hover:bg-green-400/10"
                >
                  <Shield className="w-4 h-4" />
                  {showVrf ? "Ocultar" : "Verificar VRF"}
                </Button>
              )}
            </motion.div>

            {/* VRF Panel */}
            <AnimatePresence>
              {showVrf && vrfData && (
                <motion.div
                  className="mt-6 p-4 rounded-xl bg-green-950/40 border border-green-500/20 w-full max-w-lg"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Prova de Aleatoriedade Verificável (VRF)
                  </h3>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/50">Commit Hash:</span>
                      <span className="text-green-300 break-all text-[10px]">{vrfData.commitHash}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/50">Block Hash:</span>
                      <span className="text-green-300 break-all text-[10px]">{vrfData.blockHash}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/50">Random Value:</span>
                      <span className="text-green-300 break-all text-[10px]">{vrfData.randomValue}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/50">Proof:</span>
                      <span className="text-green-300 break-all text-[10px]">{vrfData.proof}</span>
                    </div>
                    {vrfData.verificationSteps && (
                      <div className="mt-3 pt-3 border-t border-green-500/20">
                        <p className="text-green-400 font-bold mb-1">Verificação:</p>
                        {vrfData.verificationSteps.map((step: string, i: number) => (
                          <p key={i} className="text-white/60 text-[10px] leading-relaxed">{step}</p>
                        ))}
                      </div>
                    )}
                    <div className="mt-2">
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold",
                        vrfData.isValid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {vrfData.isValid ? "✅ ALEATORIEDADE VÁLIDA" : "❌ FALHA"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
