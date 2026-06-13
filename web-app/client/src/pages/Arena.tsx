import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import StickerCard from "@/components/StickerCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Swords, Shield, Trophy, ChevronRight, X, Zap } from "lucide-react";
import { toast } from "sonner";

interface BattleResult {
  rounds: Array<{
    round: number;
    challengerCard: number;
    opponentCard: number;
    challengerScore: number;
    opponentScore: number;
    winner: "challenger" | "opponent";
  }>;
  challengerWins: number;
  opponentWins: number;
  winner: "challenger" | "opponent";
  eloChange?: number;
  botCards?: any[];
}

function BattleResultModal({ result, myCards, botCards, onClose }: {
  result: BattleResult;
  myCards: any[];
  botCards: any[];
  onClose: () => void;
}) {
  const won = result.winner === "challenger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Result header */}
        <div className={cn(
          "text-center mb-6 p-6 rounded-2xl",
          won ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"
        )}>
          <div className="text-5xl mb-2">{won ? "🏆" : "💀"}</div>
          <h2 className="font-display text-3xl" style={{ color: won ? "#22c55e" : "#ef4444" }}>
            {won ? "Vitória!" : "Derrota"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {result.challengerWins} × {result.opponentWins} rounds
          </p>
          {result.eloChange !== undefined && (
            <p className={cn("text-sm font-bold mt-2", won ? "text-green-400" : "text-red-400")}>
              {won ? "+" : "-"}{Math.abs(result.eloChange)} ELO
            </p>
          )}
        </div>

        {/* Rounds */}
        <h3 className="font-semibold text-white mb-3">Resultado por round</h3>
        <div className="space-y-2 mb-6">
          {result.rounds.map((round) => {
            const myCard = myCards.find((c) => c.id === round.challengerCard);
            const botCard = botCards.find((c) => c.id === round.opponentCard);
            const iWon = round.winner === "challenger";
            return (
              <div key={round.round} className={cn(
                "flex items-center gap-3 p-3 rounded-xl border text-sm",
                iWon ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
              )}>
                <span className="text-muted-foreground w-16 shrink-0">Round {round.round}</span>
                <span className="flex-1 font-medium text-white truncate">{myCard?.name ?? "?"}</span>
                <span className={cn("font-bold text-lg w-8 text-center", iWon ? "text-green-400" : "text-red-400")}>
                  {round.challengerScore}
                </span>
                <span className="text-muted-foreground">vs</span>
                <span className={cn("font-bold text-lg w-8 text-center", !iWon ? "text-green-400" : "text-red-400")}>
                  {round.opponentScore}
                </span>
                <span className="flex-1 font-medium text-muted-foreground truncate text-right">{botCard?.name ?? "Bot"}</span>
                <span className="w-6 text-center">{iWon ? "✅" : "❌"}</span>
              </div>
            );
          })}
        </div>

        <Button onClick={onClose} className="w-full bg-primary text-primary-foreground font-bold">
          Continuar
        </Button>
      </div>
    </div>
  );
}

export default function Arena() {
  const { isAuthenticated } = useAuth();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [battleResult, setBattleResult] = useState<(BattleResult & { botCards: any[] }) | null>(null);

  const { data: inventory } = trpc.player.inventory.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();

  const quickBattle = trpc.pvp.quickBattle.useMutation({
    onSuccess: (data) => {
      setBattleResult({ ...data.result, botCards: data.botCards, eloChange: 15 });
      utils.player.stats.invalidate();
      setSelectedCards([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleCard = (cardId: number) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : prev.length < 5
        ? [...prev, cardId]
        : prev
    );
  };

  const myCards = inventory?.map((i) => ({ ...i.card, invId: i.inv.id })) ?? [];

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center glass rounded-2xl p-10">
          <Swords className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="font-display text-2xl text-white mb-2">Arena PvP</h3>
          <p className="text-muted-foreground mb-6">Faça login para batalhar e subir no ranking ELO</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-primary text-primary-foreground font-bold px-8">
            Entrar e Batalhar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-white flex items-center gap-3">
            <Swords className="w-8 h-8 text-primary" />
            Arena PvP
          </h1>
          <p className="text-muted-foreground mt-1">
            Selecione até 5 cartas para batalhar e ganhar ELO
          </p>
        </div>

        <Button
          onClick={() => quickBattle.mutate({ myCardIds: selectedCards })}
          disabled={selectedCards.length === 0 || quickBattle.isPending}
          className="bg-primary text-primary-foreground font-bold gap-2 px-6"
          size="lg"
        >
          <Zap className="w-5 h-5" />
          {quickBattle.isPending ? "Batalha em curso…" : `Batalhar (${selectedCards.length}/5)`}
        </Button>
      </div>

      {/* Selected team preview */}
      {selectedCards.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Seu time ({selectedCards.length}/5)
            </h3>
            <button onClick={() => setSelectedCards([])} className="text-xs text-muted-foreground hover:text-white flex items-center gap-1">
              <X className="w-3 h-3" /> Limpar
            </button>
          </div>
          <div className="flex gap-3 flex-wrap">
            {selectedCards.map((cardId) => {
              const card = myCards.find((c) => c.id === cardId);
              return card ? (
                <StickerCard
                  key={cardId}
                  card={card}
                  size="sm"
                  selected
                  onClick={() => toggleCard(cardId)}
                />
              ) : null;
            })}
            {Array.from({ length: 5 - selectedCards.length }).map((_, i) => (
              <div key={i} className="w-28 h-40 rounded-xl border-2 border-dashed border-white/8 flex items-center justify-center">
                <span className="text-muted-foreground text-2xl">+</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card selection */}
      <div>
        <h3 className="font-semibold text-white mb-4">
          Seu inventário ({myCards.length} cartas)
        </h3>
        {myCards.length === 0 ? (
          <div className="text-center glass rounded-2xl p-10">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Você não tem cartas ainda. Abra pacotes na loja!</p>
            <Button onClick={() => window.location.href = "/shop"} className="bg-primary text-primary-foreground font-bold">
              Ir para a Loja
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {myCards.map((card) => (
              <StickerCard
                key={card.id}
                card={card}
                size="md"
                selected={selectedCards.includes(card.id)}
                onClick={() => toggleCard(card.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Battle result modal */}
      {battleResult && (
        <BattleResultModal
          result={battleResult}
          myCards={myCards}
          botCards={battleResult.botCards}
          onClose={() => setBattleResult(null)}
        />
      )}
    </div>
  );
}

// Missing import
function Package(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>;
}
