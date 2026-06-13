import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import PackOpenAnimation from "@/components/PackOpenAnimation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PACK_TYPES } from "../../../shared/gameData";
import { ShoppingBag, Package, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";

function PackCard({ pack, onBuy, loading }: { pack: typeof PACK_TYPES[0]; onBuy: () => void; loading: boolean }) {
  const gradients: Record<string, string> = {
    basico: "from-slate-800 to-slate-950",
    premium: "from-blue-900 to-slate-950",
    lendario: "from-amber-900 to-slate-950",
  };

  const borders: Record<string, string> = {
    basico: "border-slate-600/40",
    premium: "border-blue-500/40",
    lendario: "border-amber-500/40",
  };

  const glows: Record<string, string> = {
    basico: "",
    premium: "0 0 30px rgba(59,130,246,0.2)",
    lendario: "0 0 40px rgba(212,169,56,0.3)",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02]",
        borders[pack.id],
        pack.popular && "ring-2 ring-blue-500/50"
      )}
      style={{ boxShadow: glows[pack.id] }}
    >
      {pack.popular && (
        <div className="absolute top-0 left-0 right-0 text-center py-1.5 bg-blue-600 text-white text-xs font-bold tracking-wider uppercase">
          Mais Popular
        </div>
      )}

      <div className={cn("bg-gradient-to-b p-6 h-full flex flex-col", gradients[pack.id], pack.popular && "pt-10")}>
        {/* Pack icon */}
        <div className="flex items-center justify-center mb-5">
          <div className="relative">
            <div className="w-20 h-28 rounded-xl border-2 flex items-center justify-center text-4xl"
              style={{ borderColor: pack.color, background: `${pack.color}15` }}>
              <Package className="w-10 h-10" style={{ color: pack.color }} />
            </div>
            {pack.id === "lendario" && (
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400" />
            )}
          </div>
        </div>

        {/* Info */}
        <h3 className="font-display text-2xl text-white text-center mb-1">Pacote {pack.nome}</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">{pack.desc}</p>

        {/* Details */}
        <div className="space-y-2 mb-6 flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Figurinhas</span>
            <span className="font-bold text-white">{pack.qtd} cartas</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Garantia</span>
            <span className="font-bold" style={{ color: pack.color }}>{pack.garantiaLabel}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Preço</span>
            <span className="font-display text-xl text-white">{pack.preco} {pack.precoSymbol}</span>
          </div>
        </div>

        <Button
          onClick={onBuy}
          disabled={loading}
          className="w-full font-bold text-base py-3 gap-2"
          style={{ backgroundColor: pack.color, color: pack.id === "lendario" ? "#000" : "#fff" }}
        >
          {loading ? (
            <>
              <span className="animate-spin">⚽</span>
              Abrindo…
            </>
          ) : (
            <>
              Abrir Pacote {pack.nome}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function Shop() {
  const { isAuthenticated } = useAuth();
  const [openedCards, setOpenedCards] = useState<any[] | null>(null);
  const [vrfData, setVrfData] = useState<any | null>(null);
  const [openedPackType, setOpenedPackType] = useState<"basico" | "premium" | "lendario">("basico");
  const [buyingPack, setBuyingPack] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const buyAndOpen = trpc.packs.buyAndOpen.useMutation({
    onSuccess: (data) => {
      setOpenedCards(data.cards);
      setVrfData(data.vrf);
      utils.player.inventory.invalidate();
      utils.player.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleBuy = async (type: "basico" | "premium" | "lendario") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setBuyingPack(type);
    setOpenedPackType(type);
    try {
      await buyAndOpen.mutateAsync({ type });
    } finally {
      setBuyingPack(null);
    }
  };

  const handleClose = () => {
    setOpenedCards(null);
    setVrfData(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-primary" />
          Loja de Pacotes
        </h1>
        <p className="text-muted-foreground mt-1">
          Abra pacotes e expanda sua coleção com figurinhas NFT exclusivas
        </p>
      </div>

      {/* Pack cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {PACK_TYPES.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            onBuy={() => handleBuy(pack.id as any)}
            loading={buyingPack === pack.id}
          />
        ))}
      </div>

      {/* Probability table */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg text-white mb-4">Probabilidades de Raridade</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Pacote</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Bronze</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Prata</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Ouro</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium">Platina</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { nome: "Básico", bronze: "80%", prata: "18%", ouro: "2%", platina: "0%" },
                { nome: "Premium", bronze: "60%", prata: "30% + 1 garantida", ouro: "9%", platina: "1%" },
                { nome: "Lendário", bronze: "40%", prata: "35%", ouro: "20% + 1 garantida", platina: "5%" },
              ].map((row) => (
                <tr key={row.nome} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 font-semibold text-white">{row.nome}</td>
                  <td className="py-3 px-3 text-center" style={{color: '#CD7F32'}}>{row.bronze}</td>
                  <td className="py-3 px-3 text-center" style={{color: '#C0C0C0'}}>{row.prata}</td>
                  <td className="py-3 px-3 text-center" style={{color: '#FFD700'}}>{row.ouro}</td>
                  <td className="py-3 px-3 text-center" style={{color: '#E5E4E2'}}>{row.platina}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pack open animation (full-screen overlay) */}
      {openedCards && (
        <PackOpenAnimation
          cards={openedCards}
          vrfData={vrfData}
          packType={openedPackType}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
