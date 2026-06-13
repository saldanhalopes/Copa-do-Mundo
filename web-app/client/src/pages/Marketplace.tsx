import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import StickerCard from "@/components/StickerCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Store, Tag, ShoppingCart, X, Plus, Filter } from "lucide-react";
import { toast } from "sonner";

const RARITY_COLORS: Record<string, string> = {
  comum: "#CD7F32",
  rara: "#C0C0C0",
  lendaria: "#FFD700",
  mitica: "#E5E4E2",
};

function ListCardModal({ onClose, onList }: { onClose: () => void; onList: (cardId: number, price: number, chain: "polygon" | "bnb") => void }) {
  const { data: inventory } = trpc.player.inventory.useQuery();
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [chain, setChain] = useState<"polygon" | "bnb">("polygon");

  const myCards = inventory?.map((i) => i.card) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-white">Listar Figurinha</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">Selecione a carta que deseja vender:</p>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-5 max-h-48 overflow-y-auto">
          {myCards.map((card) => (
            <StickerCard
              key={card.id}
              card={card as any}
              size="sm"
              selected={selectedCard === card.id}
              onClick={() => setSelectedCard(card.id)}
              showAttrs={false}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Preço</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[oklch(0.12_0.015_260)] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Rede</label>
            <div className="flex gap-2">
              {(["polygon", "bnb"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setChain(c)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                    chain === c ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"
                  )}
                >
                  {c === "polygon" ? "⬟ POL" : "◈ BNB"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            if (!selectedCard || !price) return toast.error("Selecione uma carta e defina o preço");
            onList(selectedCard, parseFloat(price), chain);
            onClose();
          }}
          className="w-full bg-primary text-primary-foreground font-bold"
        >
          Listar no Marketplace
        </Button>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { isAuthenticated, user } = useAuth();
  const [showListModal, setShowListModal] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<string>("all");

  const { data: listings, isLoading } = trpc.marketplace.listings.useQuery();
  const utils = trpc.useUtils();

  const createListing = trpc.marketplace.list.useMutation({
    onSuccess: () => { toast.success("Carta listada com sucesso!"); utils.marketplace.listings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const buyListing = trpc.marketplace.buy.useMutation({
    onSuccess: () => { toast.success("Carta adquirida! Verifique seu inventário."); utils.marketplace.listings.invalidate(); utils.player.inventory.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const cancelListing = trpc.marketplace.cancel.useMutation({
    onSuccess: () => { toast.success("Listagem cancelada."); utils.marketplace.listings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filteredListings = (listings ?? []).filter(
    (l) => rarityFilter === "all" || l.card.rarity === rarityFilter
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-white flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">
            Compre e venda figurinhas com swap atômico P2P
          </p>
        </div>

        {isAuthenticated && (
          <Button
            onClick={() => setShowListModal(true)}
            className="bg-primary text-primary-foreground font-bold gap-2"
          >
            <Plus className="w-4 h-4" />
            Listar Figurinha
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setRarityFilter("all")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
            rarityFilter === "all" ? "bg-primary/15 border-primary/40 text-primary" : "border-white/10 text-muted-foreground hover:text-white"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          Todas
        </button>
        {(["comum", "rara", "lendaria", "mitica"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRarityFilter(r)}
            className={cn(
              "px-4 py-2 rounded-xl border text-sm font-semibold transition-all capitalize",
              rarityFilter === r ? "border-current bg-current/10" : "border-white/10 text-muted-foreground hover:text-white"
            )}
            style={{ color: rarityFilter === r ? RARITY_COLORS[r] : undefined }}
          >
            {r === "comum" ? "Bronze" : r === "rara" ? "Prata" : r === "lendaria" ? "Ouro" : "Platina"}
          </button>
        ))}
      </div>

      {/* Listings grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 shimmer rounded-2xl" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center glass rounded-2xl p-16">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl text-white mb-2">Marketplace vazio</h3>
          <p className="text-muted-foreground">
            {isAuthenticated ? "Seja o primeiro a listar uma figurinha!" : "Faça login para listar suas cartas."}
          </p>
          {!isAuthenticated && (
            <Button onClick={() => window.location.href = getLoginUrl()} className="mt-4 bg-primary text-primary-foreground font-bold">
              Entrar
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredListings.map((listing) => {
            const isMine = listing.seller.id === user?.id;
            const rarityColor = RARITY_COLORS[listing.card.rarity] ?? "#888";

            return (
              <div
                key={listing.listing.id}
                className="glass rounded-2xl p-4 border border-transparent hover:border-primary/20 transition-all"
                style={{ boxShadow: `0 0 20px ${rarityColor}15` }}
              >
                {/* Card */}
                <div className="flex justify-center mb-4">
                  <StickerCard card={listing.card as any} size="md" showAttrs={false} />
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Vendedor</span>
                    <span className="text-xs font-medium text-white truncate max-w-[120px]">
                      {listing.seller.name ?? "Anônimo"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Rede</span>
                    <span className="text-xs font-semibold" style={{ color: listing.listing.chain === "polygon" ? "#8247E5" : "#F0B90B" }}>
                      {listing.listing.chain === "polygon" ? "⬟ Polygon" : "◈ BNB Chain"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/8">
                    <span className="font-display text-xl text-white">
                      {listing.listing.price} {listing.listing.currency}
                    </span>
                    {isMine ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelListing.mutate({ listingId: listing.listing.id })}
                        disabled={cancelListing.isPending}
                        className="text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                      >
                        Cancelar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
                          buyListing.mutate({ listingId: listing.listing.id });
                        }}
                        disabled={buyListing.isPending}
                        className="bg-primary text-primary-foreground text-xs font-bold gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Comprar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List modal */}
      {showListModal && (
        <ListCardModal
          onClose={() => setShowListModal(false)}
          onList={(cardId, price, chain) => createListing.mutate({ cardId, price, chain })}
        />
      )}
    </div>
  );
}
