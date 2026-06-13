import { cn } from "@/lib/utils";
import { RARITY_CONFIG, type Rarity } from "../../../shared/gameData";

export interface CardData {
  id?: number;
  tokenId?: number;
  name: string;
  teamId: string;
  teamName: string;
  position: string;
  rarity: Rarity;
  worldCup?: string;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  ovr: number;
}

const TEAM_COLORS: Record<string, { bg: string; text: string }> = {
  BRA: { bg: "#009C3B", text: "#FFDF00" },
  ARG: { bg: "#75AADB", text: "#FFFFFF" },
  FRA: { bg: "#002654", text: "#FFFFFF" },
  ALE: { bg: "#1A1A1A", text: "#FFCE00" },
  ENG: { bg: "#CF081F", text: "#FFFFFF" },
  ESP: { bg: "#AA151B", text: "#F1BF00" },
  POR: { bg: "#006847", text: "#FFFFFF" },
  ITA: { bg: "#0066B3", text: "#FFFFFF" },
  HOL: { bg: "#FF6600", text: "#FFFFFF" },
  URU: { bg: "#0038A8", text: "#FFFFFF" },
  CRO: { bg: "#FF0000", text: "#FFFFFF" },
  COL: { bg: "#FCD116", text: "#003893" },
  MAR: { bg: "#C1272D", text: "#FFFFFF" },
  CMR: { bg: "#007A5E", text: "#FFFFFF" },
  NGA: { bg: "#008751", text: "#FFFFFF" },
  KOR: { bg: "#CD2E3A", text: "#FFFFFF" },
  JPN: { bg: "#000080", text: "#FFFFFF" },
  MEX: { bg: "#006847", text: "#FFFFFF" },
  USA: { bg: "#002868", text: "#FFFFFF" },
  CHI: { bg: "#D52B1E", text: "#FFFFFF" },
};

interface StickerCardProps {
  card: CardData;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  locked?: boolean;
  onClick?: () => void;
  className?: string;
  showAttrs?: boolean;
}

export default function StickerCard({
  card,
  size = "md",
  selected = false,
  locked = false,
  onClick,
  className,
  showAttrs = true,
}: StickerCardProps) {
  const config = RARITY_CONFIG[card.rarity];
  const isHolo = config.holographic;
  const teamColor = TEAM_COLORS[card.teamId] ?? { bg: "#333", text: "#fff" };

  const sizeClasses = {
    sm: "w-[130px] h-[190px]",
    md: "w-[180px] h-[260px]",
    lg: "w-[240px] h-[340px]",
  };

  const fontConfig = {
    sm: { ovr: "text-2xl", name: "text-[9px]", stat: "text-[7px]", label: "text-[6px]", pos: "text-[7px]" },
    md: { ovr: "text-3xl", name: "text-[11px]", stat: "text-[9px]", label: "text-[7px]", pos: "text-[8px]" },
    lg: { ovr: "text-4xl", name: "text-sm", stat: "text-xs", label: "text-[9px]", pos: "text-[10px]" },
  };

  const fonts = fontConfig[size];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-200",
        sizeClasses[size],
        selected && "ring-2 ring-white/80 scale-105",
        locked && "opacity-40 grayscale",
        onClick && "hover:scale-[1.05] hover:brightness-110",
        className
      )}
      style={{
        boxShadow: isHolo
          ? `0 0 24px ${config.color}50, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 4px 20px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Card Background - Gradient based on rarity */}
      <div
        className="absolute inset-0"
        style={{ background: config.gradient }}
      />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)`,
      }} />

      {/* Holographic shimmer for Ouro and Platina */}
      {isHolo && (
        <div className="absolute inset-0 holo-shimmer pointer-events-none" />
      )}

      {/* Card Content */}
      <div className="relative z-10 h-full flex flex-col p-2.5">
        {/* Top: OVR + Position + Team */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-center leading-none">
            <span className={cn(fonts.ovr, "font-black text-white drop-shadow-lg")}>{card.ovr}</span>
            <span className={cn(fonts.pos, "font-bold text-white/80 uppercase tracking-wider mt-0.5")}>{card.position}</span>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center mt-1 shadow-md"
              style={{ backgroundColor: teamColor.bg, border: `1px solid ${teamColor.text}40` }}
            >
              <span style={{ color: teamColor.text, fontSize: "7px", fontWeight: 700 }}>
                {card.teamId.slice(0, 2)}
              </span>
            </div>
          </div>

          {/* Rarity Badge */}
          <div className="flex flex-col items-end gap-0.5">
            <span
              className={cn(fonts.label, "font-black uppercase tracking-widest px-1.5 py-0.5 rounded")}
              style={{
                color: config.color,
                background: `${config.color}15`,
                border: `1px solid ${config.color}40`,
                textShadow: isHolo ? `0 0 8px ${config.color}80` : "none",
              }}
            >
              {config.label}
            </span>
            {card.worldCup && (
              <span className={cn(fonts.label, "text-white/50")}>Copa {card.worldCup}</span>
            )}
          </div>
        </div>

        {/* Player Avatar Area */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center shadow-inner"
            style={{
              width: size === "lg" ? 72 : size === "md" ? 52 : 38,
              height: size === "lg" ? 72 : size === "md" ? 52 : 38,
              background: `radial-gradient(circle at 30% 30%, ${teamColor.bg}90, ${teamColor.bg}30)`,
              border: `2px solid ${config.color}40`,
            }}
          >
            <span className="text-white/90 font-black" style={{ fontSize: size === "lg" ? 28 : size === "md" ? 20 : 14 }}>
              {card.name.split(" ").pop()?.charAt(0) ?? card.name.charAt(0)}
            </span>
          </div>
        </div>

        {/* Player Name */}
        <div className="text-center mb-1.5">
          <p className={cn(fonts.name, "font-bold text-white uppercase tracking-wide truncate")}
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
            {card.name}
          </p>
          <p className={cn(fonts.label, "text-white/50 truncate")}>{card.teamName}</p>
          <div className="w-3/4 mx-auto h-px mt-1" style={{ background: `${config.color}40` }} />
        </div>

        {/* Stats Grid - FIFA Style (2 columns, 3 rows) */}
        {showAttrs && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 px-1">
            {[
              { label: "PAC", value: card.pac },
              { label: "DRI", value: card.dri },
              { label: "SHO", value: card.sho },
              { label: "DEF", value: card.def },
              { label: "PAS", value: card.pas },
              { label: "PHY", value: card.phy },
            ].map((stat) => {
              const statColor = stat.value >= 85 ? "#4ade80" : stat.value >= 70 ? "#fbbf24" : "#f87171";
              return (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className={cn(fonts.label, "font-bold text-white/50")}>{stat.label}</span>
                  <span className={cn(fonts.stat, "font-black")} style={{ color: statColor }}>{stat.value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom rarity line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: config.color }} />

      {/* Locked overlay */}
      {locked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
          <span className="text-2xl">🔒</span>
        </div>
      )}

      {/* Selected check */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 z-30 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}
