import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  BookOpen, ShoppingBag, Swords, Trophy, Store, LayoutDashboard,
  Menu, X, Wallet, ChevronRight, Zap
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Início", icon: Zap },
  { path: "/album", label: "Álbum", icon: BookOpen },
  { path: "/shop", label: "Loja", icon: ShoppingBag },
  { path: "/arena", label: "Arena PvP", icon: Swords },
  { path: "/ranking", label: "Ranking", icon: Trophy },
  { path: "/marketplace", label: "Marketplace", icon: Store },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function WalletButton() {
  const { user, isAuthenticated } = useAuth();
  const [showChainSelect, setShowChainSelect] = useState(false);
  const connectWallet = trpc.player.connectWallet.useMutation();

  const handleConnect = async (chain: "polygon" | "bnb") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    // Simular conexão de carteira (em produção usaria ethers.js / wagmi)
    const mockAddress = "0x" + Math.random().toString(16).slice(2, 42).padEnd(40, "0");
    await connectWallet.mutateAsync({ walletAddress: mockAddress, chain });
    setShowChainSelect(false);
  };

  if (!isAuthenticated) {
    return (
      <Button
        onClick={() => window.location.href = getLoginUrl()}
        className="bg-primary text-primary-foreground hover:brightness-110 gap-2 font-semibold"
        size="sm"
      >
        <Wallet className="w-4 h-4" />
        Entrar
      </Button>
    );
  }

  if (user?.walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
          user.selectedChain === "polygon" ? "border-purple-500/50 text-purple-300 bg-purple-500/10" : "border-yellow-500/50 text-yellow-300 bg-yellow-500/10"
        )}>
          <span>{user.selectedChain === "polygon" ? "⬟" : "◈"}</span>
          <span>{user.walletAddress.slice(0, 6)}…{user.walletAddress.slice(-4)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowChainSelect(!showChainSelect)}
        className="bg-primary text-primary-foreground hover:brightness-110 gap-2 font-semibold"
        size="sm"
      >
        <Wallet className="w-4 h-4" />
        Conectar Carteira
      </Button>
      {showChainSelect && (
        <div className="absolute right-0 top-full mt-2 w-52 glass rounded-xl p-2 z-50 shadow-2xl">
          <p className="text-xs text-muted-foreground px-2 py-1 mb-1">Selecionar rede</p>
          <button
            onClick={() => handleConnect("polygon")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            <span className="text-purple-400 text-lg">⬟</span>
            <div className="text-left">
              <p className="font-semibold text-white">Polygon</p>
              <p className="text-[10px] text-muted-foreground">Chainlink VRF</p>
            </div>
          </button>
          <button
            onClick={() => handleConnect("bnb")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm"
          >
            <span className="text-yellow-400 text-lg">◈</span>
            <div className="text-left">
              <p className="font-semibold text-white">BNB Chain</p>
              <p className="text-[10px] text-muted-foreground">Binance Oracle</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.01_260)] flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-60 bg-[oklch(0.10_0.012_260)] border-r border-sidebar-border flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:relative lg:flex"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary font-display text-sm">CA</span>
          </div>
          <div>
            <p className="font-display text-white text-sm leading-tight">CryptoÁlbum</p>
            <p className="text-[10px] text-muted-foreground">Copa Edition</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location === path || (path !== "/" && location.startsWith(path));
            return (
              <Link
                key={path}
                href={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-sidebar-foreground hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {isAuthenticated && user && (
          <div className="px-4 py-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user.name?.charAt(0) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name ?? "Jogador"}</p>
                <p className="text-[10px] text-muted-foreground">ELO {user.elo ?? 1000}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-14 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center px-4 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Breadcrumb */}
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {NAV_ITEMS.find((n) => n.path === location || (n.path !== "/" && location.startsWith(n.path)))?.label ?? "CryptoÁlbum Copa"}
            </p>
          </div>

          <WalletButton />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
