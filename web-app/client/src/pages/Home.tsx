import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, ShoppingBag, Swords, Trophy, Store, ArrowRight, Zap, Shield, Repeat } from "lucide-react";

const CHAINS = [
  { id: "polygon", nome: "Polygon", symbol: "POL", cor: "#8247E5", logo: "⬟", desc: "Chainlink VRF · OpenSea" },
  { id: "bnb",     nome: "BNB Chain", symbol: "BNB", cor: "#F0B90B", logo: "◈", desc: "Binance Oracle · Binance NFT" },
];

const FEATURES = [
  { icon: BookOpen, title: "Álbum Digital", desc: "Colecione 185 figurinhas NFT de 20 seleções mundiais com atributos on-chain" },
  { icon: ShoppingBag, title: "Loja de Pacotes", desc: "Abra pacotes Básico, Premium e Lendário com sorteio verificável via VRF" },
  { icon: Swords, title: "Arena PvP", desc: "Monte seu time de 5 cartas e batalhe com aposta em partidas ELO" },
  { icon: Trophy, title: "Ranking ELO", desc: "Suba no ranking com sistema ELO por temporadas e conquiste recompensas" },
  { icon: Store, title: "Marketplace P2P", desc: "Negocie figurinhas com swap atômico direto entre jogadores" },
  { icon: Repeat, title: "Trocas Diretas", desc: "Proponha trocas personalizadas entre colecionadores sem intermediário" },
];

const RARITY_CARDS = [
  { rarity: "mitica",   label: "Platina",  color: "#E5E4E2", glow: "0 0 40px rgba(229,228,226,0.6)", name: "Pelé",         ovr: 98 },
  { rarity: "lendaria", label: "Ouro",     color: "#FFD700", glow: "0 0 32px rgba(255,215,0,0.5)",    name: "Zidane",      ovr: 95 },
  { rarity: "rara",     label: "Prata",    color: "#C0C0C0", glow: "0 0 24px rgba(192,192,192,0.4)", name: "Mbappé",      ovr: 91 },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [selectedChain, setSelectedChain] = useState<"polygon" | "bnb">("polygon");
  const connectWallet = trpc.player.connectWallet.useMutation();

  const handleConnect = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    const mockAddress = "0x" + Math.random().toString(16).slice(2, 42).padEnd(40, "0");
    await connectWallet.mutateAsync({ walletAddress: mockAddress, chain: selectedChain });
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-purple-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(179,108,240,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,169,56,0.08),transparent_60%)]" />

        {/* Floating cards decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:flex items-center justify-center pointer-events-none">
          <div className="relative w-96 h-96">
            {RARITY_CARDS.map((c, i) => (
              <div
                key={c.rarity}
                className="absolute w-36 h-52 rounded-2xl border overflow-hidden float-anim"
                style={{
                  boxShadow: c.glow,
                  borderColor: `${c.color}40`,
                  background: `linear-gradient(135deg, ${c.color}22, #0a0a1a)`,
                  top: i === 0 ? "10%" : i === 1 ? "30%" : "50%",
                  left: i === 0 ? "50%" : i === 1 ? "20%" : "60%",
                  animationDelay: `${i * 2}s`,
                  zIndex: 3 - i,
                  transform: `rotate(${(i - 1) * 8}deg)`,
                }}
              >
                <div className="p-3 h-full flex flex-col">
                  <div className="text-3xl font-display text-white">{c.ovr}</div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{ background: `${c.color}33` }}>
                      <span className="text-white font-display">{c.name.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-xs font-bold truncate">{c.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${c.color}33`, color: c.color }}>
                      {c.label}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 container max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/20 text-primary text-xs font-semibold mb-6">
              <Zap className="w-3 h-3" />
              ERC-1155 · Polygon · BNB Chain
            </div>

            <h1 className="font-display text-5xl lg:text-6xl text-white leading-tight mb-4">
              Colecione.{" "}
              <span className="text-gradient-gold">Batalhe.</span>{" "}
              Negocie.
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              A plataforma Web3 de figurinhas da Copa do Mundo. Colecione NFTs únicos,
              abra pacotes com sorteio verificável e dispute o ranking ELO global.
            </p>

            {/* Chain selector */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Selecionar rede</p>
              <div className="flex gap-3">
                {CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => setSelectedChain(chain.id as "polygon" | "bnb")}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all duration-200 text-sm font-semibold",
                      selectedChain === chain.id
                        ? "border-current bg-current/10"
                        : "border-white/10 bg-[oklch(0.12_0.015_260)] hover:border-current/50"
                    )}
                    style={{ color: selectedChain === chain.id ? chain.cor : undefined }}
                  >
                    <span className="text-xl">{chain.logo}</span>
                    <div className="text-left">
                      <p className="leading-tight">{chain.nome}</p>
                      <p className="text-[10px] text-muted-foreground font-normal">{chain.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              {isAuthenticated && user?.walletAddress ? (
                <Link
                  href="/album"
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground font-bold text-base hover:brightness-110 transition-all"
                >
                  <BookOpen className="w-5 h-5" />
                  Abrir Álbum
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Button
                  size="lg"
                  onClick={handleConnect}
                  disabled={connectWallet.isPending}
                  className="bg-primary text-primary-foreground hover:brightness-110 gap-2 font-bold text-base px-6"
                >
                  {connectWallet.isPending ? "Conectando…" : "Conectar Carteira"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-md border border-white/10 bg-transparent text-white font-semibold text-base hover:bg-white/5 transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
                Ver Pacotes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-white/10 bg-white/2">
        <div className="container max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Figurinhas NFT", value: "185" },
            { label: "Seleções", value: "20" },
            { label: "Tipos de Pacote", value: "3" },
            { label: "Raridades", value: "4" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="container max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl text-white mb-3">Tudo em uma plataforma</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Do álbum ao marketplace, passando pela arena PvP — uma experiência Web3 completa.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-6 hover:border-primary/30 transition-colors border border-transparent">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Rarity showcase ── */}
      <section className="border-t border-white/10 bg-white/1 py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-white mb-3">Quatro níveis de raridade</h2>
            <p className="text-muted-foreground">Cada carta tem atributos únicos e supply limitado na blockchain</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { rarity: "Bronze",   color: "#CD7F32", supply: "50.000", desc: "Jogadores regulares" },
              { rarity: "Prata",    color: "#C0C0C0", supply: "10.000", desc: "Destaques da temporada" },
              { rarity: "Ouro",     color: "#FFD700", supply: "2.500",  desc: "Estrelas mundiais" },
              { rarity: "Platina",  color: "#E5E4E2", supply: "500",    desc: "Ícones históricos" },
            ].map((r) => (
              <div key={r.rarity} className="glass rounded-2xl p-5 text-center border border-transparent hover:border-current/20 transition-colors"
                style={{ color: r.color }}>
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `${r.color}22`, border: `1px solid ${r.color}44` }}>
                  <Shield className="w-6 h-6" />
                </div>
                <p className="font-display text-lg">{r.rarity}</p>
                <p className="text-2xl font-bold text-white mt-1">{r.supply}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
