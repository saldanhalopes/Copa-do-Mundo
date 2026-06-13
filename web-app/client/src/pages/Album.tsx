import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import StickerCard from "@/components/StickerCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TEAMS } from "../../../shared/gameData";
import { BookOpen, Lock, Trophy, Star } from "lucide-react";

// Team color schemes inspired by Panini Copa 2026
const TEAM_COLORS: Record<string, { bg: string; accent: string; pattern: string }> = {
  BRA: { bg: "from-green-900/80 to-yellow-900/40", accent: "#FFDE00", pattern: "radial-gradient(circle at 20% 80%, rgba(255,222,0,0.08) 0%, transparent 50%)" },
  ARG: { bg: "from-sky-900/80 to-blue-900/40", accent: "#75AADB", pattern: "radial-gradient(circle at 80% 20%, rgba(117,170,219,0.08) 0%, transparent 50%)" },
  FRA: { bg: "from-blue-900/80 to-red-900/40", accent: "#002395", pattern: "radial-gradient(circle at 50% 50%, rgba(0,35,149,0.08) 0%, transparent 50%)" },
  GER: { bg: "from-gray-900/80 to-red-900/40", accent: "#FFFFFF", pattern: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.05) 0%, transparent 50%)" },
  ENG: { bg: "from-red-900/80 to-blue-900/40", accent: "#CF081F", pattern: "radial-gradient(circle at 70% 30%, rgba(207,8,31,0.08) 0%, transparent 50%)" },
  ESP: { bg: "from-red-900/80 to-yellow-900/40", accent: "#AA151B", pattern: "radial-gradient(circle at 40% 60%, rgba(170,21,27,0.08) 0%, transparent 50%)" },
  ITA: { bg: "from-blue-900/80 to-green-900/40", accent: "#009246", pattern: "radial-gradient(circle at 60% 40%, rgba(0,146,70,0.08) 0%, transparent 50%)" },
  POR: { bg: "from-red-900/80 to-green-900/40", accent: "#006600", pattern: "radial-gradient(circle at 50% 80%, rgba(0,102,0,0.08) 0%, transparent 50%)" },
  URU: { bg: "from-sky-900/80 to-blue-900/40", accent: "#5CBFEB", pattern: "radial-gradient(circle at 20% 20%, rgba(92,191,235,0.08) 0%, transparent 50%)" },
  NED: { bg: "from-orange-900/80 to-red-900/40", accent: "#FF6600", pattern: "radial-gradient(circle at 80% 80%, rgba(255,102,0,0.08) 0%, transparent 50%)" },
  CMR: { bg: "from-green-900/80 to-red-900/40", accent: "#007A33", pattern: "radial-gradient(circle at 50% 50%, rgba(0,122,51,0.08) 0%, transparent 50%)" },
  NGA: { bg: "from-green-900/80 to-white/10", accent: "#008751", pattern: "radial-gradient(circle at 30% 30%, rgba(0,135,81,0.08) 0%, transparent 50%)" },
  MAR: { bg: "from-red-900/80 to-green-900/40", accent: "#C1272D", pattern: "radial-gradient(circle at 70% 70%, rgba(193,39,45,0.08) 0%, transparent 50%)" },
  KOR: { bg: "from-red-900/80 to-blue-900/40", accent: "#CD2E3A", pattern: "radial-gradient(circle at 50% 50%, rgba(205,46,58,0.08) 0%, transparent 50%)" },
  JPN: { bg: "from-blue-900/80 to-red-900/40", accent: "#BC002D", pattern: "radial-gradient(circle at 40% 40%, rgba(188,0,45,0.08) 0%, transparent 50%)" },
  USA: { bg: "from-blue-900/80 to-red-900/40", accent: "#B31942", pattern: "radial-gradient(circle at 60% 60%, rgba(179,25,66,0.08) 0%, transparent 50%)" },
};

const DEFAULT_COLORS = { bg: "from-slate-900/80 to-slate-800/40", accent: "#6366F1", pattern: "none" };

export default function Album() {
  const { isAuthenticated } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");

  const { data: allCards, isLoading: cardsLoading } = trpc.game.allCards.useQuery();
  const { data: inventory } = trpc.player.inventory.useQuery(undefined, { enabled: isAuthenticated });

  const ownedTokenIds = new Set(inventory?.map((i) => i.card.tokenId) ?? []);

  const filteredCards = (allCards ?? []).filter(
    (c) => selectedTeam === "ALL" || c.teamId === selectedTeam
  );

  const totalOwned = (allCards ?? []).filter((c) => ownedTokenIds.has(c.tokenId)).length;
  const totalCards = allCards?.length ?? 0;
  const pct = totalCards > 0 ? Math.round((totalOwned / totalCards) * 100) : 0;

  const teamColors = TEAM_COLORS[selectedTeam] ?? DEFAULT_COLORS;

  return (
    <div className="min-h-screen">
      {/* Panini-style album cover header */}
      <div className={cn(
        "relative overflow-hidden bg-gradient-to-br p-8 pb-12 border-b border-white/10",
        teamColors.bg
      )} style={{ backgroundImage: teamColors.pattern }}>
        {/* Decorative geometric pattern (Panini style) */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.03) 35px, rgba(255,255,255,0.03) 70px)`,
          }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                  <BookOpen className="w-5 h-5" style={{ color: teamColors.accent }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                  FIFA World Cup Collection
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl text-white tracking-tight">
                {selectedTeam === "ALL" ? "Álbum Completo" : (
                  <span className="flex items-center gap-3">
                    <span className="text-3xl">{TEAMS.find(t => t.id === selectedTeam)?.flag}</span>
                    {TEAMS.find(t => t.id === selectedTeam)?.nome}
                  </span>
                )}
              </h1>
              <p className="text-white/60 mt-2 text-lg">
                {isAuthenticated
                  ? `${totalOwned} de ${totalCards} figurinhas coletadas`
                  : "Todas as Copas do Mundo • 1930 — 2022"}
              </p>
            </div>

            {/* Progress card */}
            {isAuthenticated && (
              <div className="glass rounded-2xl px-6 py-4 min-w-[220px] border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Progresso</span>
                  </div>
                  <span className="font-display text-2xl" style={{ color: teamColors.accent }}>{pct}%</span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${teamColors.accent}, ${teamColors.accent}88)` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-white/40">
                  <span>{totalOwned} coletadas</span>
                  <span>{totalCards - totalOwned} faltam</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Team selector — Panini style tabs */}
        <div className="flex flex-wrap gap-2 mb-8 -mt-6 relative z-20">
          <button
            onClick={() => setSelectedTeam("ALL")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold border backdrop-blur transition-all",
              selectedTeam === "ALL"
                ? "bg-white/15 border-white/30 text-white shadow-lg"
                : "bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-white/20"
            )}
          >
            <Star className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Todas ({totalCards})
          </button>
          {TEAMS.map((team) => {
            const teamCards = (allCards ?? []).filter((c) => c.teamId === team.id);
            const teamOwned = teamCards.filter((c) => ownedTokenIds.has(c.tokenId)).length;
            const isSelected = selectedTeam === team.id;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border backdrop-blur transition-all",
                  isSelected
                    ? "bg-white/15 border-white/30 text-white shadow-lg"
                    : "bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-white/20"
                )}
              >
                <span className="text-base">{team.flag}</span>
                <span className="hidden sm:inline">{team.nome}</span>
                {isAuthenticated && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md",
                    teamOwned === teamCards.length && teamCards.length > 0
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/10 text-white/50"
                  )}>
                    {teamOwned}/{teamCards.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cards grid — Panini album page style */}
        {cardsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <>
            {/* Section header for selected team */}
            {selectedTeam !== "ALL" && (
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">
                  {TEAMS.find(t => t.id === selectedTeam)?.nome} • {filteredCards.length} figurinhas
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {filteredCards.map((card) => {
                const owned = ownedTokenIds.has(card.tokenId);
                return (
                  <div key={card.tokenId} className="group relative">
                    {/* Card slot — Panini style with number */}
                    <div className={cn(
                      "relative rounded-xl overflow-hidden transition-all duration-300",
                      owned
                        ? "ring-1 ring-white/20 hover:ring-white/40 hover:scale-[1.02]"
                        : "opacity-50 grayscale hover:opacity-70 hover:grayscale-[50%]"
                    )}>
                      <StickerCard
                        card={card as any}
                        size="md"
                        locked={!owned && isAuthenticated}
                        showAttrs={owned}
                      />

                      {/* Sticker number badge (Panini style) */}
                      <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                        <span className="text-[9px] font-bold text-white/80">#{card.tokenId}</span>
                      </div>

                      {/* Collected indicator */}
                      {owned && isAuthenticated && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-green-500/90 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      {/* Not collected overlay */}
                      {!owned && isAuthenticated && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Lock className="w-6 h-6 text-white/40" />
                        </div>
                      )}
                    </div>

                    {/* Card name below */}
                    <p className={cn(
                      "text-center text-[11px] font-semibold mt-1.5 truncate",
                      owned ? "text-white/80" : "text-white/40"
                    )}>
                      {card.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Login CTA */}
        {!isAuthenticated && (
          <div className="mt-16 text-center glass rounded-2xl p-12 border border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-3xl text-white mb-3">Comece sua coleção</h3>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Faça login para ver suas figurinhas, acompanhar o progresso do álbum e completar sua coleção de lendas do futebol mundial.
            </p>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-primary text-primary-foreground font-bold px-10 py-3 text-base rounded-xl"
            >
              Entrar e Colecionar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
