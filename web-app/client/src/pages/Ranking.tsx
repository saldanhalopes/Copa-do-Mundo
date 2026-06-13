import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Trophy, Medal, TrendingUp, Swords } from "lucide-react";

const TIER_CONFIG = [
  { min: 1800, label: "Lendário", color: "#B36CF0", icon: "👑" },
  { min: 1600, label: "Mestre",   color: "#D4A938", icon: "🏆" },
  { min: 1400, label: "Diamante", color: "#9FB6CC", icon: "💎" },
  { min: 1200, label: "Ouro",     color: "#F59E0B", icon: "🥇" },
  { min: 1000, label: "Prata",    color: "#94A3B8", icon: "🥈" },
  { min: 0,    label: "Bronze",   color: "#CD7F32", icon: "🥉" },
];

function getTier(elo: number) {
  return TIER_CONFIG.find((t) => elo >= t.min) ?? TIER_CONFIG[TIER_CONFIG.length - 1];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="font-display text-muted-foreground text-lg w-8 text-center">#{rank}</span>;
}

export default function Ranking() {
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = trpc.ranking.leaderboard.useQuery({ season: 1, limit: 50 });

  const myRank = leaderboard?.findIndex((p) => p.id === user?.id);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            Ranking ELO
          </h1>
          <p className="text-muted-foreground mt-1">Temporada 1 · Sistema ELO Global</p>
        </div>

        {/* My rank card */}
        {user && myRank !== undefined && myRank >= 0 && (
          <div className="glass rounded-2xl px-5 py-3 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Sua posição</p>
            <div className="flex items-center gap-3">
              <span className="font-display text-primary text-2xl">#{myRank + 1}</span>
              <div>
                <p className="font-bold text-white text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.elo ?? 1000} ELO</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tier legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TIER_CONFIG.map((tier) => (
          <div key={tier.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-semibold border border-transparent"
            style={{ color: tier.color, borderColor: `${tier.color}30` }}>
            <span>{tier.icon}</span>
            {tier.label}
            <span className="text-muted-foreground font-normal">≥{tier.min}</span>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/10 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <span>Pos.</span>
          <span>Jogador</span>
          <span className="text-center">ELO</span>
          <span className="text-center">V/D</span>
          <span className="text-center">Tier</span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border/50">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-4 items-center">
                <div className="w-8 h-6 shimmer rounded" />
                <div className="h-4 shimmer rounded w-32" />
                <div className="w-12 h-4 shimmer rounded" />
                <div className="w-16 h-4 shimmer rounded" />
                <div className="w-16 h-4 shimmer rounded" />
              </div>
            ))}
          </div>
        ) : leaderboard?.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum jogador no ranking ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a batalhar na Arena!</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {leaderboard?.map((player, i) => {
              const tier = getTier(player.elo ?? 1000);
              const isMe = player.id === user?.id;
              const winRate = player.wins + player.losses > 0
                ? Math.round((player.wins / (player.wins + player.losses)) * 100)
                : 0;

              return (
                <div
                  key={player.id}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-4 items-center transition-colors",
                    isMe ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-white/2"
                  )}
                >
                  <div className="w-8 flex justify-center">
                    <RankBadge rank={i + 1} />
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: `${tier.color}22`, color: tier.color }}>
                      {player.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("font-semibold truncate text-sm", isMe ? "text-primary" : "text-white")}>
                        {player.name ?? "Jogador"}
                        {isMe && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {player.walletAddress ? `${player.walletAddress.slice(0, 8)}…` : "Sem carteira"}
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="font-display text-white text-base">{player.elo}</p>
                    <p className="text-[10px] text-muted-foreground">ELO</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{player.wins}W / {player.losses}L</p>
                    <p className="text-[10px]" style={{ color: winRate >= 50 ? "#22c55e" : "#ef4444" }}>{winRate}% WR</p>
                  </div>

                  <div className="text-center">
                    <span className="text-lg">{tier.icon}</span>
                    <p className="text-[10px] font-semibold" style={{ color: tier.color }}>{tier.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Season info */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, label: "Sistema ELO", desc: "Pontuação baseada em força do oponente" },
          { icon: Swords, label: "Temporada 1", desc: "Ranking reiniciado a cada temporada" },
          { icon: Medal, label: "Recompensas", desc: "Top 10 recebem pacotes exclusivos" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="glass rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
