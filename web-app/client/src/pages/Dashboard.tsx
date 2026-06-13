import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import StickerCard from "@/components/StickerCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Trophy, Swords, BookOpen, TrendingUp, Package, Star } from "lucide-react";

const RARITY_COLORS: Record<string, string> = {
  comum: "#CD7F32",
  rara: "#C0C0C0",
  lendaria: "#FFD700",
  mitica: "#E5E4E2",
};

function StatCard({ icon: Icon, label, value, sub, color = "#D4A938" }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 border border-transparent hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="font-display text-2xl text-white">{value}</p>
      <p className="text-sm font-medium text-white/80 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const [rarityFilter, setRarityFilter] = useState<string>("all");

  const { data: inventory, isLoading: invLoading } = trpc.player.inventory.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stats } = trpc.player.stats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: battles } = trpc.pvp.history.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const giveStarter = trpc.player.giveStarterPack.useMutation({
    onSuccess: () => utils.player.inventory.invalidate(),
  });

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center glass rounded-2xl p-10">
          <LayoutDashboard className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="font-display text-2xl text-white mb-2">Dashboard do Jogador</h3>
          <p className="text-muted-foreground mb-6">Faça login para ver seu inventário e estatísticas</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-primary text-primary-foreground font-bold px-8">
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  const myCards = inventory?.map((i) => i.card) ?? [];
  const filteredCards = myCards.filter((c) => rarityFilter === "all" || c.rarity === rarityFilter);

  const winRate = stats && (stats.wins + stats.losses) > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-white flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo, <span className="text-white font-semibold">{user?.name ?? "Jogador"}</span>
          </p>
        </div>

        {/* Wallet badge */}
        {user?.walletAddress && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold",
            user.selectedChain === "polygon" ? "border-purple-500/40 text-purple-300 bg-purple-500/8" : "border-yellow-500/40 text-yellow-300 bg-yellow-500/8"
          )}>
            <span>{user.selectedChain === "polygon" ? "⬟" : "◈"}</span>
            {user.walletAddress.slice(0, 8)}…{user.walletAddress.slice(-6)}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Figurinhas" value={stats?.totalOwned ?? 0} sub={`de ${stats?.totalCards ?? 0} total`} color="#D4A938" />
        <StatCard icon={TrendingUp} label="Progresso" value={`${stats?.completionPct ?? 0}%`} sub="do álbum completo" color="#22c55e" />
        <StatCard icon={Trophy} label="ELO" value={stats?.elo ?? 1000} sub="ranking global" color="#B36CF0" />
        <StatCard icon={Swords} label="Vitórias" value={stats?.wins ?? 0} sub={`${winRate}% win rate`} color="#22c55e" />
        <StatCard icon={Swords} label="Derrotas" value={stats?.losses ?? 0} sub="partidas perdidas" color="#ef4444" />
        <StatCard icon={Star} label="Míticas" value={stats?.byRarity?.mitica ?? 0} sub="cartas míticas" color="#E5E4E2" />
      </div>

      {/* Rarity breakdown */}
      <div className="glass rounded-2xl p-5 mb-8">
        <h3 className="font-semibold text-white mb-4">Distribuição por Raridade</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["comum", "rara", "lendaria", "mitica"] as const).map((r) => {
            const count = stats?.byRarity?.[r] ?? 0;
            const color = RARITY_COLORS[r];
            const label = r === "comum" ? "Bronze" : r === "rara" ? "Prata" : r === "lendaria" ? "Ouro" : "Platina";
            return (
              <div key={r} className="text-center p-3 rounded-xl border" style={{ borderColor: `${color}30`, background: `${color}08` }}>
                <p className="font-display text-2xl" style={{ color }}>{count}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Album progress */}
      <div className="glass rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Progresso do Álbum</h3>
          <span className="font-display text-primary">{stats?.completionPct ?? 0}%</span>
        </div>
        <div className="h-3 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${stats?.completionPct ?? 0}%`,
              background: "linear-gradient(90deg, #D4A938, #B36CF0)",
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {stats?.totalOwned ?? 0} de {stats?.totalCards ?? 0} figurinhas coletadas
        </p>
      </div>

      {/* Inventory */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Meu Inventário ({myCards.length} cartas)
          </h3>
          <div className="flex gap-2 flex-wrap">
            {(["all", "comum", "rara", "lendaria", "mitica"] as const).map((r) => {
              const label = r === "all" ? "Todas" : r === "comum" ? "Bronze" : r === "rara" ? "Prata" : r === "lendaria" ? "Ouro" : "Platina";
              return (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                    rarityFilter === r
                      ? r === "all" ? "bg-primary/15 border-primary/40 text-primary" : "border-current bg-current/10"
                      : "border-white/10 text-muted-foreground hover:text-white"
                  )}
                  style={{ color: rarityFilter === r && r !== "all" ? RARITY_COLORS[r] : undefined }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {invLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {Array.from({ length: 14 }).map((_, i) => <div key={i} className="w-36 h-52 shimmer rounded-xl" />)}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center glass rounded-2xl p-10">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {myCards.length === 0
                ? "Você ainda não tem figurinhas. Abra seu pacote inicial!"
                : "Nenhuma carta desta raridade no inventário."}
            </p>
            {myCards.length === 0 && (
              <Button
                onClick={() => giveStarter.mutate()}
                disabled={giveStarter.isPending}
                className="bg-primary text-primary-foreground font-bold gap-2"
              >
                <Package className="w-4 h-4" />
                {giveStarter.isPending ? "Abrindo…" : "Receber Pacote Inicial Grátis"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {filteredCards.map((card) => (
              <StickerCard key={card.id} card={card as any} size="md" />
            ))}
          </div>
        )}
      </div>

      {/* Battle history */}
      {battles && battles.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            Histórico de Batalhas
          </h3>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="divide-y divide-border/50">
              {battles.slice(0, 10).map((battle) => {
                const won = battle.winnerId === user?.id;
                return (
                  <div key={battle.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <span className={cn("w-16 font-bold text-xs", won ? "text-green-400" : "text-red-400")}>
                      {battle.status === "completed" ? (won ? "Vitória" : "Derrota") : "Pendente"}
                    </span>
                    <span className="text-muted-foreground flex-1">
                      {new Date(battle.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <span className={cn("font-bold text-xs", won ? "text-green-400" : "text-red-400")}>
                      {battle.status === "completed" ? (won ? `+${battle.eloChange}` : `-${battle.eloChange}`) : "—"} ELO
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
