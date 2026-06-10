import { useState, useEffect, useMemo, useRef } from "react";

// ============================================================
// CRYPTOÁLBUM COPA — Protótipo interativo
// ERC-1155 · Polygon · Chainlink VRF (simulado no front)
// ============================================================

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500;600;700&display=swap');
`;

const TEAMS = [
  { id: "BRA", nome: "Brasil", cor: "#FFDF00", cor2: "#009C3B", texto: "#005524" },
  { id: "ARG", nome: "Argentina", cor: "#75AADB", cor2: "#F5F7FA", texto: "#2A5E8C" },
  { id: "FRA", nome: "França", cor: "#002395", cor2: "#ED2939", texto: "#FFFFFF" },
  { id: "ALE", nome: "Alemanha", cor: "#1A1A1A", cor2: "#DD0000", texto: "#FFCE00" },
];

const ELENCOS = {
  BRA: ["Tonhão", "Bira Costa", "Juvenal", "Cacá Lima", "Dudu Reis", "Zé Henrique", "Mariola", "Pituca", "Ramonzinho", "Galego", "Rei Arthur"],
  ARG: ["Goyco", "Tano Ferri", "El Vasco", "Chino Páez", "Lucho Sosa", "Pipa Galván", "Mago Ruiz", "Coco Ledesma", "Nico Bravo", "Tucu Molina", "El Diez"],
  FRA: ["Bastien", "Maxence", "Théo Laval", "Côme Diarra", "Iliès Roche", "Aurel Niang", "Baptiste M.", "Eliott Caron", "Sofian Bey", "Léandre", "Le Magicien"],
  ALE: ["Der Riese", "Falk Brandt", "Jonas Kühl", "Timo Hess", "Levin Roth", "Karl Steiner", "Moritz B.", "Anton Vogel", "Niko Frey", "Emil Wirtz", "Der Kaiser"],
};

const POSICOES = ["GOL", "ZAG", "ZAG", "LD", "LE", "VOL", "MEI", "MEI", "PD", "PE", "CAM"];

// Perfis de atributos por posição (PAC,SHO,PAS,DRI,DEF,PHY) — pesos
const PERFIS = {
  GOL: [0.6,0.3,0.7,0.5,1.4,1.2], ZAG: [0.8,0.4,0.7,0.6,1.5,1.3],
  LD:[1.3,0.6,1.1,1.0,1.2,1.0], LE:[1.3,0.6,1.1,1.0,1.2,1.0],
  VOL:[0.9,0.7,1.2,1.0,1.3,1.2], MEI:[1.0,1.1,1.3,1.2,0.7,0.9],
  PD:[1.4,1.1,1.0,1.3,0.5,0.8], PE:[1.4,1.1,1.0,1.3,0.5,0.8],
  CAM:[1.1,1.3,1.3,1.4,0.5,0.8], ESCUDO:[0,0,0,0,0,0],
};
const ATTR_KEYS = ["PAC","SHO","PAS","DRI","DEF","PHY"];
const OVR_RANGE = [[60,69],[70,79],[80,86],[87,92],[93,99]]; // por raridade

// gerador determinístico simples (seed pelo id)
function seeded(seed){ let s=seed; return ()=>{ s=(s*9301+49297)%233280; return s/233280; }; }

function gerarAttrs(pos, rar, seedNum) {
  if (pos === "ESCUDO") return null;
  const rnd = seeded(seedNum * 7 + 13);
  const [omin, omax] = OVR_RANGE[rar];
  const ovrAlvo = Math.floor(omin + rnd() * (omax - omin));
  const perfil = PERFIS[pos];
  const attrs = {};
  perfil.forEach((peso, i) => {
    let v = Math.round(ovrAlvo * (0.7 + 0.3 * peso) + (rnd() * 12 - 6));
    attrs[ATTR_KEYS[i]] = Math.max(30, Math.min(99, v));
  });
  attrs.OVR = Math.max(omin, Math.min(omax, ovrAlvo));
  return attrs;
}

// Raridade: 0 comum · 1 rara · 2 épica · 3 lendária
function buildStickers() {
  const list = [];
  let n = 1;
  for (const t of TEAMS) {
    list.push({ id: `${t.id}-ESC`, num: n++, team: t.id, nome: `Escudo ${t.nome}`, pos: "ESCUDO", rar: 1, attrs: null });
    ELENCOS[t.id].forEach((nome, i) => {
      let rar = 0;
      if (i === 0) rar = 2; // goleiro épica
      if (i === 10) rar = 3; // camisa 10 lendária
      if (i === 5 || i === 8) rar = 1; // duas raras
      const pos = POSICOES[i];
      list.push({ id: `${t.id}-${i + 1}`, num: n, team: t.id, nome, pos, rar, camisa: i === 10 ? 10 : i + 1, attrs: gerarAttrs(pos, rar, n) });
      n++;
    });
  }
  return list;
}

const STICKERS = buildStickers();
const BY_ID = Object.fromEntries(STICKERS.map((s) => [s.id, s]));
const POOLS = [0, 1, 2, 3].map((r) => STICKERS.filter((s) => s.rar === r).map((s) => s.id));
const TOTAL = STICKERS.length;

const RAR_META = [
  { nome: "Comum", supply: "50.000", chip: "#8A8F98" },
  { nome: "Rara", supply: "10.000", chip: "#9FB6CC" },
  { nome: "Épica", supply: "2.500", chip: "#D4A938" },
  { nome: "Lendária", supply: "500", chip: "#B36CF0" },
];

const PACKS = [
  { id: 0, nome: "Pacote Básico", preco: 4, qtd: 5, garantia: 0, desc: "5 figurinhas aleatórias" },
  { id: 1, nome: "Pacote Premium", preco: 16, qtd: 5, garantia: 1, desc: "5 figurinhas · ≥1 Rara garantida" },
  { id: 2, nome: "Pacote Lendário", preco: 50, qtd: 10, garantia: 2, desc: "10 figurinhas · ≥1 Épica garantida" },
];

const CHAINS = [
  { id: "polygon", nome: "Polygon", symbol: "POL", cor: "#8247E5", vrf: "Chainlink VRF", market: "OpenSea / Magic Eden", logo: "⬟" },
  { id: "bnb",     nome: "BNB Chain", symbol: "BNB", cor: "#F0B90B", vrf: "Binance Oracle", market: "Binance NFT Marketplace", logo: "◈" },
];

const WALLETS = [
  { id: "metamask",   nome: "MetaMask",    chains: ["polygon","bnb"], logo: "🦊" },
  { id: "trustwallet",nome: "Trust Wallet",chains: ["polygon","bnb"], logo: "🛡️" },
  { id: "binance",    nome: "Binance Web3",chains: ["bnb"],           logo: "🔶" },
  { id: "email",      nome: "Email / Google (sem cripto)", chains: ["polygon","bnb"], logo: "📧" },
];

// sorteio com a mesma tabela do PackStore.sol (sem mítica no demo)
function rollRarity(x) {
  if (x < 7000) return 0;
  if (x < 9000) return 1;
  if (x < 9800) return 2;
  return 3;
}
function drawPack(pack) {
  const ids = [];
  let ok = pack.garantia === 0;
  for (let i = 0; i < pack.qtd; i++) {
    let rar;
    if (i === pack.qtd - 1 && !ok) rar = pack.garantia;
    else rar = rollRarity(Math.floor(Math.random() * 10000));
    if (rar >= pack.garantia) ok = true;
    const pool = POOLS[rar];
    ids.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return ids;
}

const hash = () => "0x" + Array.from({ length: 10 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("") + "…";

const OFERTAS_INICIAIS = [
  { id: 1, user: "leo.eth", da: "BRA-11", quer: "ARG-1" },
  { id: 2, user: "marta⚽", da: "FRA-ESC", quer: "BRA-6" },
  { id: 3, user: "0x7aF3…c2", da: "ALE-11", quer: "FRA-9" },
  { id: 4, user: "didico.sol", da: "ARG-11", quer: "ALE-1" },
];

// ============================================================

export default function CryptoAlbumCopa() {
  const [tab, setTab] = useState("album");
  const [teamTab, setTeamTab] = useState("BRA");
  const [connected, setConnected] = useState(false);
  const [chain, setChain] = useState("polygon");
  const [showChainModal, setShowChainModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const [pol, setPol] = useState(100);
  const [owned, setOwned] = useState(() => {
    const o = {};
    ["BRA-ESC", "BRA-2", "BRA-2", "BRA-5", "BRA-6", "ARG-3", "ARG-3", "ARG-7", "FRA-4", "ALE-9", "ALE-9"].forEach((id) => (o[id] = (o[id] || 0) + 1));
    return o;
  });
  const [opening, setOpening] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [ofertas, setOfertas] = useState(OFERTAS_INICIAIS);
  const [novas, setNovas] = useState(new Set());
  const [trophy, setTrophy] = useState(false);
  const toastId = useRef(0);
  const activeChain = CHAINS.find(c => c.id === chain);

  const unicas = useMemo(() => Object.keys(owned).filter((k) => owned[k] > 0).length, [owned]);
  const repetidas = useMemo(() => Object.values(owned).reduce((a, c) => a + Math.max(0, c - 1), 0), [owned]);
  const completo = unicas === TOTAL;

  function toast(msg, sub) {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }

  function comprar(pack) {
    if (!connected) return toast("Conecte sua carteira primeiro");
    if (pol < pack.preco) return toast("Saldo POL insuficiente", "Use o faucet de teste no topo");
    setPol((p) => p - pack.preco);
    setOpening({ fase: 1, pack, ids: [], flipped: [] });
    setTimeout(() => setOpening((o) => o && { ...o, fase: 2 }), 900);
    setTimeout(() => {
      const ids = drawPack(pack);
      setOpening((o) => o && { ...o, fase: 3, ids, flipped: [] });
      ids.forEach((_, i) =>
        setTimeout(() => setOpening((o) => o && { ...o, flipped: [...o.flipped, i] }), 500 + i * 450)
      );
      setTimeout(() => {
        setOwned((prev) => {
          const nx = { ...prev };
          const novasIds = new Set();
          ids.forEach((id) => {
            if (!nx[id]) novasIds.add(id);
            nx[id] = (nx[id] || 0) + 1;
          });
          setNovas(novasIds);
          return nx;
        });
      }, 500 + ids.length * 450);
    }, 2600);
  }

  function fecharPacote() {
    setOpening(null);
    toast("Figurinhas coladas no álbum", `mintBatch confirmado · ${hash()}`);
    setTab("album");
  }

  function aceitarTroca(of) {
    if (!connected) return toast("Conecte sua carteira primeiro");
    if (!owned[of.quer]) return;
    setOwned((prev) => {
      const nx = { ...prev };
      nx[of.quer] -= 1;
      if (nx[of.quer] === 0) delete nx[of.quer];
      nx[of.da] = (nx[of.da] || 0) + 1;
      return nx;
    });
    setOfertas((o) => o.filter((x) => x.id !== of.id));
    toast(`Troca atômica concluída com ${of.user}`, `safeBatchTransferFrom ×2 · ${hash()}`);
  }

  function criarOferta(da, quer) {
    setOfertas((o) => [{ id: Date.now(), user: "você", da, quer }, ...o]);
    toast("Oferta de troca publicada no mural", `criarOferta() · ${hash()}`);
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#0A2E22", fontFamily: "'Space Grotesk', system-ui, sans-serif", color: "#F3E9D2" }}>
      <style>{FONTS + CSS}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 px-3 py-2.5 flex items-center justify-between gap-2 flex-wrap" style={{ background: "rgba(10,46,34,.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(243,233,210,.15)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: "conic-gradient(#FFDF00,#009C3B,#FFDF00)", boxShadow: "0 0 12px rgba(255,223,0,.35)" }}>⚽</div>
          <div>
            <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 14, letterSpacing: ".5px", lineHeight: 1 }}>CRYPTOÁLBUM <span style={{ color: "#FFDF00" }}>COPA</span></div>
            <div className="text-xs" style={{ color: "rgba(243,233,210,.5)" }}>ERC-1155 · Multi-chain</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Chain Selector */}
          <button onClick={() => setShowChainModal(true)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all" style={{ background: "rgba(243,233,210,.1)", border: `1px solid ${activeChain.cor}55` }}>
            <span style={{ color: activeChain.cor }}>{activeChain.logo}</span>
            <span style={{ color: "rgba(243,233,210,.8)" }}>{activeChain.nome}</span>
          </button>
          {connected && (
            <button onClick={() => { setPol(p => p + 100); toast(`Faucet: +100 ${activeChain.symbol} de teste`); }} className="text-xs px-2 py-1.5 rounded-xl" style={{ border: "1px dashed rgba(243,233,210,.35)", color: "rgba(243,233,210,.7)" }}>
              +{activeChain.symbol}
            </button>
          )}
          {connected ? (
            <div className="text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5" style={{ background: "rgba(243,233,210,.1)", border: "1px solid rgba(243,233,210,.18)" }}>
              <span className="text-base">{WALLETS.find(w => w.id === walletType)?.logo || "💼"}</span>
              <span style={{ color: "#FFDF00", fontWeight: 700 }}>{pol} {activeChain.symbol}</span>
              <span style={{ color: "rgba(243,233,210,.5)" }}>0x9aF…b41</span>
            </div>
          ) : (
            <button onClick={() => setShowWalletModal(true)} className="text-sm font-bold px-3 py-2 rounded-xl" style={{ background: "#FFDF00", color: "#0A2E22" }}>
              Conectar
            </button>
          )}
        </div>
      </header>

      {/* CHAIN SELECTOR MODAL */}
      {showChainModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: "rgba(0,0,0,.7)" }} onClick={() => setShowChainModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-4 anim-pop" style={{ background: "#112A20", border: "1px solid rgba(243,233,210,.2)" }} onClick={e => e.stopPropagation()}>
            <div className="font-bold mb-3" style={{ color: "#F3E9D2", fontFamily: "'Archivo Black', sans-serif" }}>Escolher rede</div>
            {CHAINS.map(c => (
              <button key={c.id} onClick={() => { setChain(c.id); setShowChainModal(false); toast(`Rede: ${c.nome}`, `VRF: ${c.vrf} · Marketplace: ${c.market}`); }} className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all" style={{ background: chain === c.id ? `${c.cor}22` : "rgba(243,233,210,.05)", border: `2px solid ${chain === c.id ? c.cor : "transparent"}` }}>
                <span className="text-2xl">{c.logo}</span>
                <div className="text-left flex-1">
                  <div className="font-bold" style={{ color: c.cor }}>{c.nome}</div>
                  <div className="text-xs" style={{ color: "rgba(243,233,210,.55)" }}>VRF: {c.vrf} · {c.market}</div>
                </div>
                {chain === c.id && <span style={{ color: c.cor }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WALLET MODAL */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: "rgba(0,0,0,.7)" }} onClick={() => setShowWalletModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-4 anim-pop" style={{ background: "#112A20", border: "1px solid rgba(243,233,210,.2)" }} onClick={e => e.stopPropagation()}>
            <div className="font-bold mb-1" style={{ color: "#F3E9D2", fontFamily: "'Archivo Black', sans-serif" }}>Conectar carteira</div>
            <div className="text-xs mb-3" style={{ color: "rgba(243,233,210,.5)" }}>Rede selecionada: <span style={{ color: activeChain.cor }}>{activeChain.nome}</span></div>
            {WALLETS.filter(w => w.chains.includes(chain)).map(w => (
              <button key={w.id} onClick={() => { setWalletType(w.id); setConnected(true); setShowWalletModal(false); toast(`${w.nome} conectado`, `${activeChain.nome} · chainId ${chain === "bnb" ? 56 : 137}`); }} className="w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all" style={{ background: "rgba(243,233,210,.07)", border: "1px solid rgba(243,233,210,.15)" }}>
                <span className="text-2xl">{w.logo}</span>
                <span className="font-bold" style={{ color: "#F3E9D2" }}>{w.nome}</span>
                {w.id === "binance" && <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#F0B90B22", color: "#F0B90B" }}>Nativo BNB</span>}
                {w.id === "email" && <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#009C3B22", color: "#009C3B" }}>Sem cripto</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PROGRESSO */}
      <div className="px-4 pt-4 max-w-3xl mx-auto">
        <div className="flex items-end justify-between mb-1">
          <div className="text-xs uppercase tracking-widest" style={{ color: "rgba(243,233,210,.6)" }}>Progresso do álbum</div>
          <div className="text-sm font-bold">{unicas}<span style={{ color: "rgba(243,233,210,.5)" }}>/{TOTAL}</span>{repetidas > 0 && <span className="ml-2 text-xs" style={{ color: "#FFDF00" }}>{repetidas} repetidas p/ troca</span>}</div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(243,233,210,.12)" }}>
          <div className="h-full rounded-full anim-bar" style={{ width: `${(unicas / TOTAL) * 100}%`, background: "linear-gradient(90deg,#009C3B,#FFDF00)" }} />
        </div>
        {completo && !trophy && (
          <button onClick={() => setTrophy(true)} className="mt-3 w-full py-3 rounded-xl font-bold text-sm anim-pulse" style={{ background: "linear-gradient(90deg,#D4A938,#FFDF00)", color: "#0A2E22" }}>
            🏆 ÁLBUM COMPLETO! Resgatar Troféu ERC-721 — claimTrophy()
          </button>
        )}
      </div>

      {/* TABS */}
      <nav className="flex gap-1 px-4 pt-4 max-w-3xl mx-auto">
        {[["album", "📖 Álbum"], ["pacotes", "✨ Pacotes"], ["fantasy", "⚡ Fantasy"], ["trocas", "🔄 Trocas"], ["vender", "💰 Vender"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className="flex-1 py-2.5 text-xs font-bold rounded-t-xl transition-all" style={tab === k ? { background: "#F3E9D2", color: "#0A2E22" } : { background: "rgba(243,233,210,.08)", color: "rgba(243,233,210,.7)" }}>
            {l}
          </button>
        ))}
      </nav>

      {/* CONTEÚDO — papel do álbum */}
      <main className="max-w-3xl mx-auto px-4 pb-24">
        <div className="rounded-b-2xl rounded-tr-2xl p-4 paper" style={{ color: "#3A2E1E" }}>
          {tab === "album" && <Album teamTab={teamTab} setTeamTab={setTeamTab} owned={owned} novas={novas} />}
          {tab === "pacotes" && <Pacotes comprar={comprar} pol={pol} activeChain={activeChain} />}
          {tab === "fantasy" && <Fantasy owned={owned} connected={connected} toast={toast} />}
          {tab === "trocas" && <Trocas ofertas={ofertas} owned={owned} aceitar={aceitarTroca} criarOferta={criarOferta} connected={connected} toast={toast} />}
          {tab === "vender" && <Vender owned={owned} activeChain={activeChain} connected={connected} toast={toast} />}
        </div>
      </main>

      {/* MODAL ABERTURA DE PACOTE */}
      {opening && <PackModal opening={opening} fechar={fecharPacote} owned={owned} activeChain={activeChain} />}

      {/* MODAL TROFÉU */}
      {trophy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,.8)" }} onClick={() => setTrophy(false)}>
          <div className="rounded-2xl p-8 text-center max-w-sm anim-pop" style={{ background: "linear-gradient(160deg,#1A0F2E,#0A2E22)", border: "2px solid #D4A938" }}>
            <div className="text-6xl mb-3 anim-float">🏆</div>
            <div style={{ fontFamily: "'Archivo Black', sans-serif", color: "#FFDF00", fontSize: 20 }}>TROFÉU #1</div>
            <p className="text-sm mt-2" style={{ color: "rgba(243,233,210,.8)" }}>Primeiro colecionador do mundo a completar o álbum. ERC-721 mintado e verificado on-chain.</p>
            <div className="text-xs mt-3" style={{ color: "rgba(243,233,210,.5)" }}>balanceOfBatch ✓ · {hash()}</div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className="fixed bottom-4 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="anim-toast px-4 py-2.5 rounded-xl text-sm max-w-sm w-full" style={{ background: "#142E26", border: "1px solid rgba(255,223,0,.35)", boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
            <div className="font-bold" style={{ color: "#F3E9D2" }}>{t.msg}</div>
            {t.sub && <div className="text-xs mt-0.5" style={{ color: "rgba(243,233,210,.55)", fontFamily: "monospace" }}>{t.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ÁLBUM
// ============================================================
function Album({ teamTab, setTeamTab, owned, novas }) {
  const team = TEAMS.find((t) => t.id === teamTab);
  const figs = STICKERS.filter((s) => s.team === teamTab);
  const coladas = figs.filter((f) => owned[f.id]).length;

  return (
    <div>
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {TEAMS.map((t) => (
          <button key={t.id} onClick={() => setTeamTab(t.id)} className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all" style={teamTab === t.id ? { background: t.cor2, color: t.cor, border: `2px solid ${t.cor}` } : { background: "rgba(58,46,30,.08)", color: "#3A2E1E", border: "2px solid transparent" }}>
            {t.nome}
          </button>
        ))}
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, color: "#3A2E1E" }}>{team.nome}</h2>
        <span className="text-xs font-bold" style={{ color: coladas === 12 ? "#0A7A3C" : "#8A7A5E" }}>{coladas}/12 coladas {coladas === 12 && "✓"}</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {figs.map((f) => (
          <Slot key={f.id} fig={f} count={owned[f.id] || 0} nova={novas.has(f.id)} />
        ))}
      </div>

      <p className="text-xs mt-4 text-center" style={{ color: "#8A7A5E" }}>
        Cada figurinha é um token ERC-1155 na Polygon · metadados em IPFS · supply imutável
      </p>
    </div>
  );
}

function Slot({ fig, count, nova }) {
  if (count === 0) {
    return (
      <div className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1 p-2" style={{ border: "2px dashed #C2B294", background: "rgba(58,46,30,.04)" }}>
        <div className="text-lg font-bold" style={{ color: "#C2B294" }}>{String(fig.num).padStart(3, "0")}</div>
        <div className="text-xs text-center leading-tight" style={{ color: "#C2B294" }}>COLE AQUI</div>
        <div className="text-xs" style={{ color: "#D6C7A8" }}>{fig.pos}</div>
      </div>
    );
  }
  return <Sticker fig={fig} count={count} nova={nova} pasted />;
}

function Sticker({ fig, count = 1, nova, pasted, big }) {
  const t = TEAMS.find((x) => x.id === fig.team);
  const rot = pasted ? ((fig.num * 7) % 5) - 2 : 0;
  const frame = ["frame-comum", "frame-rara", "frame-epica", "frame-lendaria"][fig.rar];
  const isEsc = fig.pos === "ESCUDO";

  return (
    <div className={`relative aspect-square rounded-lg overflow-hidden ${frame} ${nova ? "anim-slap" : ""}`} style={{ transform: `rotate(${rot}deg)`, boxShadow: "1px 2px 5px rgba(58,46,30,.3)" }}>
      <div className="absolute inset-0 flex flex-col" style={{ background: `linear-gradient(165deg, ${t.cor2} 62%, ${t.cor} 62%)` }}>
        <div className="flex-1 flex items-center justify-center">
          {isEsc ? (
            <div className="w-1/2 aspect-square rounded-full flex items-center justify-center text-xl font-black" style={{ background: t.cor, color: t.texto, border: `3px solid ${t.texto}`, fontFamily: "'Archivo Black'" }}>{t.id}</div>
          ) : (
            <div className="flex flex-col items-center">
              <div className={`${big ? "w-12 h-12 text-base" : "w-9 h-9 text-sm"} rounded-full flex items-center justify-center font-black`} style={{ background: t.cor, color: t.texto, border: `2px solid rgba(255,255,255,.6)` }}>
                {fig.camisa}
              </div>
              <div className="text-xs mt-1 font-bold" style={{ color: t.texto === "#FFFFFF" || t.id === "FRA" ? "#fff" : t.texto, textShadow: "0 1px 2px rgba(0,0,0,.35)" }}>{fig.pos}</div>
            </div>
          )}
        </div>
        <div className="px-1 pb-1 text-center">
          <div className={`${big ? "text-sm" : "text-xs"} font-bold leading-tight truncate`} style={{ color: t.id === "ARG" ? "#2A5E8C" : t.texto === "#FFFFFF" ? "#fff" : "#1A1A1A" }}>{isEsc ? t.nome : fig.nome}</div>
          <div style={{ fontSize: 8, color: "rgba(0,0,0,.55)", fontFamily: "monospace" }}>#{String(fig.num).padStart(3, "0")} · {RAR_META[fig.rar].nome}</div>
        </div>
      </div>
      {/* OVR badge estilo FIFA */}
      {!isEsc && fig.attrs && (
        <div className="absolute top-1 left-1 text-center leading-none" style={{ color: t.texto === "#FFFFFF" || t.id === "FRA" ? "#fff" : "#1A1A1A", textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>
          <div className={`${big ? "text-lg" : "text-sm"} font-black`}>{fig.attrs.OVR}</div>
        </div>
      )}
      {count > 1 && (
        <div className="absolute top-1 right-1 text-xs font-black px-1.5 rounded-full" style={{ background: "#3A2E1E", color: "#FFDF00" }}>×{count}</div>
      )}
      {nova && <div className="absolute bottom-7 left-1 text-xs font-black px-1.5 rounded-full anim-pulse" style={{ background: "#0A7A3C", color: "#fff", fontSize: 9 }}>NOVA</div>}
    </div>
  );
}

// ============================================================
// PACOTES
// ============================================================
function Pacotes({ comprar, pol, activeChain }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, color: "#3A2E1E" }}>Banca de pacotes</h2>
      <p className="text-xs mb-3" style={{ color: "#8A7A5E" }}>Sorteio verificável via <b>{activeChain.vrf}</b> · Polygon 70% Comum · 20% Rara · 8% Épica · 2% Lendária</p>

      {/* Marketplace badge */}
      <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl" style={{ background: activeChain.id === "bnb" ? "#F0B90B18" : "#8247E518", border: `1px solid ${activeChain.cor}44` }}>
        <span className="text-xl">{activeChain.logo}</span>
        <div className="text-xs">
          <div className="font-bold" style={{ color: activeChain.id === "bnb" ? "#B08A00" : "#5A3A9A" }}>Marketplace: {activeChain.market}</div>
          <div style={{ color: "#8A7A5E" }}>{activeChain.id === "bnb" ? "Figurinhas também disponíveis como Mystery Boxes na Binance NFT" : "Figurinhas disponíveis na OpenSea e Magic Eden"}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {PACKS.map((p) => (
          <div key={p.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#FFF8E8", border: "1px solid #E0D2B4" }}>
            <div className="w-14 rounded-lg flex items-center justify-center text-2xl shrink-0 pack-foil" style={{ height: 72 }}>⚽</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold" style={{ color: "#3A2E1E" }}>{p.nome}</div>
              <div className="text-xs" style={{ color: "#8A7A5E" }}>{p.desc}</div>
              <div className="text-xs mt-0.5" style={{ color: "#B0A080", fontFamily: "monospace" }}>comprarPacote({p.id}) → {activeChain.vrf}</div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => comprar(p)} disabled={pol < p.preco} className="px-3 py-1.5 rounded-xl font-bold text-xs transition-all" style={pol >= p.preco ? { background: "#0A2E22", color: "#FFDF00" } : { background: "#E0D2B4", color: "#A89878" }}>
                {p.preco} {activeChain.symbol}
              </button>
              {activeChain.id === "bnb" && (
                <button onClick={() => comprar(p)} className="px-3 py-1.5 rounded-xl font-bold text-xs" style={{ background: "#F0B90B", color: "#1A1200" }}>
                  Binance Pay
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Wallets info */}
      <div className="mt-3 rounded-xl p-3 text-xs" style={{ background: "rgba(10,46,34,.06)", color: "#6A5E48" }}>
        {activeChain.id === "bnb" ? (
          <span>🔶 Aceito via <b>Binance Pay</b>, <b>BNB</b> ou <b>BUSD</b> · Compatível com Trust Wallet e MetaMask</span>
        ) : (
          <span>💳 Aceito com cartão de crédito via Crossmint · POL · USDC · Embedded wallet para iniciantes</span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MODAL DE ABERTURA
// ============================================================
function PackModal({ opening, fechar, owned, activeChain }) {
  const { fase, pack, ids, flipped } = opening;
  const done = fase === 3 && flipped.length === ids.length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(5,20,15,.94)" }}>
      <div className="w-full max-w-md text-center">
        {fase === 1 && (
          <div className="anim-pop">
            <div className="text-5xl mb-4">📡</div>
            <div className="font-bold" style={{ color: "#F3E9D2" }}>Enviando transação…</div>
            <div className="text-xs mt-1" style={{ color: "rgba(243,233,210,.55)", fontFamily: "monospace" }}>comprarPacote({pack.id}) · Polygon PoS</div>
          </div>
        )}
        {fase === 2 && (
          <div className="anim-pop">
            <div className="text-5xl mb-4 anim-spin-slow inline-block">🔮</div>
            <div className="font-bold" style={{ color: "#F3E9D2" }}>{activeChain?.vrf || "VRF"} gerando aleatoriedade…</div>
            <div className="text-xs mt-1" style={{ color: "rgba(243,233,210,.55)" }}>Prova criptográfica on-chain — nem nós podemos manipular o sorteio</div>
            <div className="text-xs mt-2" style={{ color: "rgba(243,233,210,.4)", fontFamily: "monospace" }}>requestRandomWords · 3 confirmações · {activeChain?.nome}</div>
          </div>
        )}
        {fase === 3 && (
          <div>
            <div className="font-bold mb-4" style={{ color: "#FFDF00", fontFamily: "'Archivo Black', sans-serif" }}>RASGUE O PACOTE! ✨</div>
            <div className={`grid gap-2 ${ids.length > 5 ? "grid-cols-5" : "grid-cols-5"} justify-items-center`}>
              {ids.map((id, i) => {
                const fig = BY_ID[id];
                const isFlipped = flipped.includes(i);
                return (
                  <div key={i} className="w-full aspect-square" style={{ perspective: 600 }}>
                    <div className="relative w-full h-full transition-transform duration-500" style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "none" }}>
                      <div className="absolute inset-0 rounded-lg pack-foil flex items-center justify-center text-xl" style={{ backfaceVisibility: "hidden" }}>⚽</div>
                      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                        {isFlipped && <Sticker fig={fig} nova={!owned[id]} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {done && (
              <button onClick={fechar} className="mt-6 px-6 py-3 rounded-xl font-bold anim-pop" style={{ background: "#FFDF00", color: "#0A2E22" }}>
                Colar no álbum 📖
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TROCAS
// ============================================================
function Trocas({ ofertas, owned, aceitar, criarOferta, connected, toast }) {
  const [criando, setCriando] = useState(false);
  const [dou, setDou] = useState("");
  const [quero, setQuero] = useState("");

  // figurinhas repetidas que posso oferecer
  const repetidas = Object.keys(owned).filter((id) => owned[id] > 1 && BY_ID[id]);
  // figurinhas que me faltam
  const faltam = STICKERS.filter((s) => !owned[s.id]).map((s) => s.id);

  function publicar() {
    if (!connected) return toast("Conecte sua carteira primeiro");
    if (!dou || !quero) return toast("Escolha as duas figurinhas");
    criarOferta(dou, quero);
    setCriando(false); setDou(""); setQuero("");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, color: "#3A2E1E" }}>Mural de trocas</h2>
        <button onClick={() => setCriando(!criando)} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: criando ? "#E0D2B4" : "#0A2E22", color: criando ? "#6A5E48" : "#FFDF00" }}>
          {criando ? "Cancelar" : "+ Criar oferta"}
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: "#8A7A5E" }}>Swap atômico via TradeDesk.sol — ou os dois lados recebem, ou nada acontece. Troca por figurinha, sem dinheiro.</p>

      {/* CRIAR OFERTA */}
      {criando && (
        <div className="rounded-xl p-3 mb-4 anim-pop" style={{ background: "#FFF3D6", border: "2px solid #D4A938" }}>
          <div className="text-xs font-bold mb-2" style={{ color: "#6A5E48" }}>Crie sua troca:</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs block mb-1" style={{ color: "#8A7A5E" }}>Eu dou (repetida):</label>
              <select value={dou} onChange={(e) => setDou(e.target.value)} className="w-full text-xs p-2 rounded-lg" style={{ background: "#fff", border: "1px solid #E0D2B4", color: "#3A2E1E" }}>
                <option value="">Escolher…</option>
                {repetidas.map((id) => <option key={id} value={id}>#{String(BY_ID[id].num).padStart(3, "0")} {BY_ID[id].nome} (×{owned[id]})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "#8A7A5E" }}>Eu quero (faltante):</label>
              <select value={quero} onChange={(e) => setQuero(e.target.value)} className="w-full text-xs p-2 rounded-lg" style={{ background: "#fff", border: "1px solid #E0D2B4", color: "#3A2E1E" }}>
                <option value="">Escolher…</option>
                {faltam.map((id) => <option key={id} value={id}>#{String(BY_ID[id].num).padStart(3, "0")} {BY_ID[id].nome}</option>)}
              </select>
            </div>
          </div>
          {dou && quero && (
            <div className="flex items-center justify-center gap-2 my-2">
              <div className="w-16"><Sticker fig={BY_ID[dou]} /></div>
              <span className="text-xl" style={{ color: "#B0A080" }}>⇄</span>
              <div className="w-16"><Sticker fig={BY_ID[quero]} /></div>
            </div>
          )}
          {repetidas.length === 0 && <div className="text-xs text-center py-2" style={{ color: "#B05030" }}>Você não tem figurinhas repetidas para oferecer. Abra mais pacotes!</div>}
          <button onClick={publicar} disabled={!dou || !quero} className="w-full py-2 rounded-lg text-xs font-bold mt-1" style={dou && quero ? { background: "#0A2E22", color: "#FFDF00" } : { background: "#E0D2B4", color: "#A89878" }}>
            Publicar oferta no mural
          </button>
        </div>
      )}

      {ofertas.length === 0 && <div className="text-sm text-center py-8" style={{ color: "#8A7A5E" }}>Nenhuma oferta aberta.</div>}
      <div className="flex flex-col gap-3">
        {ofertas.map((of) => {
          const da = BY_ID[of.da];
          const quer = BY_ID[of.quer];
          const tenho = (owned[of.quer] || 0) > 0;
          const repetida = (owned[of.quer] || 0) > 1;
          const minha = of.user === "você";
          return (
            <div key={of.id} className="rounded-xl p-3" style={{ background: minha ? "#EAF5EC" : "#FFF8E8", border: `1px solid ${minha ? "#9FD3AA" : "#E0D2B4"}` }}>
              <div className="text-xs font-bold mb-2" style={{ color: "#6A5E48" }}>{minha ? "🟢 Sua oferta" : `${of.user} oferece:`}</div>
              <div className="flex items-center gap-2">
                <div className="w-20 shrink-0"><Sticker fig={da} /></div>
                <div className="text-2xl shrink-0" style={{ color: "#B0A080" }}>⇄</div>
                <div className="w-20 shrink-0"><Sticker fig={quer} /></div>
                <div className="flex-1 min-w-0 pl-1">
                  <div className="text-xs leading-snug" style={{ color: "#6A5E48" }}>
                    Quer: <b>{quer.nome}</b>
                    {!minha && (tenho ? (repetida ? <span style={{ color: "#0A7A3C" }}> — você tem repetida! ✓</span> : <span style={{ color: "#B08018" }}> — você tem só 1</span>) : <span style={{ color: "#B05030" }}> — você não tem</span>)}
                  </div>
                  {!minha && (
                    <button onClick={() => aceitar(of)} disabled={!tenho} className="mt-2 w-full py-2 rounded-lg text-xs font-bold transition-all" style={tenho ? { background: "#0A2E22", color: "#FFDF00" } : { background: "#E0D2B4", color: "#A89878" }}>
                      {tenho ? "Aceitar troca atômica" : "Indisponível"}
                    </button>
                  )}
                  {minha && <div className="mt-2 text-xs" style={{ color: "#0A7A3C" }}>Aguardando alguém aceitar…</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// VENDER — listagem em marketplace externo (OpenSea / Binance NFT)
// ============================================================
function Vender({ owned, activeChain, connected, toast }) {
  const [preco, setPreco] = useState({});
  // só figurinhas que possuo (repetidas são as candidatas naturais a vender)
  const minhas = Object.keys(owned).filter((id) => owned[id] > 0 && BY_ID[id]);

  const marketName = activeChain.id === "bnb" ? "Binance NFT" : "OpenSea";
  const marketUrl = activeChain.id === "bnb"
    ? "https://www.binance.com/en/nft/home"
    : "https://opensea.io";

  function listar(id) {
    if (!connected) return toast("Conecte sua carteira primeiro");
    const p = preco[id];
    if (!p) return toast("Defina um preço");
    toast(`Listando no ${marketName}…`, `setApprovalForAll → Seaport · ${activeChain.symbol} ${p}`);
    // Em produção: window.open com deep link de listagem do marketplace
    setTimeout(() => toast("Figurinha listada!", `Abrindo ${marketName} para confirmar`), 1400);
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, color: "#3A2E1E" }}>Vender figurinhas</h2>
      <p className="text-xs mb-3" style={{ color: "#8A7A5E" }}>
        Venda por <b>{activeChain.symbol}</b> no <b>{marketName}</b>. A propriedade é sua — o NFT sai da sua carteira só quando alguém compra.
      </p>

      {/* Banner marketplace */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ background: activeChain.id === "bnb" ? "#F0B90B18" : "#2081E218", border: `1px solid ${activeChain.cor}44` }}>
        <span className="text-2xl">{activeChain.id === "bnb" ? "◈" : "⛵"}</span>
        <div className="flex-1 text-xs">
          <div className="font-bold" style={{ color: "#3A2E1E" }}>Marketplace: {marketName}</div>
          <div style={{ color: "#8A7A5E" }}>Royalty de 5% aplicado via ERC-2981 · listagem sem custódia (Seaport)</div>
        </div>
        <a href={marketUrl} target="_blank" rel="noreferrer" className="text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0" style={{ background: activeChain.cor, color: "#1A1200" }}>Abrir ↗</a>
      </div>

      {minhas.length === 0 && <div className="text-sm text-center py-8" style={{ color: "#8A7A5E" }}>Você ainda não tem figurinhas. Abra um pacote!</div>}

      <div className="flex flex-col gap-2">
        {minhas.map((id) => {
          const fig = BY_ID[id];
          const qtd = owned[id];
          return (
            <div key={id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "#FFF8E8", border: "1px solid #E0D2B4" }}>
              <div className="w-14 shrink-0"><Sticker fig={fig} count={qtd} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate" style={{ color: "#3A2E1E" }}>{fig.nome}</div>
                <div className="text-xs" style={{ color: "#8A7A5E" }}>#{String(fig.num).padStart(3, "0")} · {RAR_META[fig.rar].nome} {qtd > 1 && `· ${qtd} cópias`}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <input type="number" placeholder="0.00" value={preco[id] || ""} onChange={(e) => setPreco({ ...preco, [id]: e.target.value })} className="w-16 text-xs p-1.5 rounded-lg text-right" style={{ background: "#fff", border: "1px solid #E0D2B4", color: "#3A2E1E" }} />
                <span className="text-xs font-bold" style={{ color: activeChain.cor === "#F0B90B" ? "#B08A00" : "#5A3A9A" }}>{activeChain.symbol}</span>
                <button onClick={() => listar(id)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg" style={{ background: "#0A2E22", color: "#FFDF00" }}>Listar</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl p-3 text-xs" style={{ background: "rgba(10,46,34,.06)", color: "#6A5E48" }}>
        💡 Dica: venda suas <b>repetidas</b> e use o valor para comprar mais pacotes ou troque diretamente na aba 🔄 Trocas (sem taxas de marketplace).
      </div>
    </div>
  );
}

// ============================================================
// FANTASY — escalar time com atributos e pontuar (química estilo FIFA)
// ============================================================
const FORMACAO = [
  { pos: "GOL", label: "GOL" }, { pos: "ZAG", label: "ZAG" }, { pos: "ZAG", label: "ZAG" },
  { pos: "LD", label: "LD" }, { pos: "LE", label: "LE" },
  { pos: "VOL", label: "VOL" }, { pos: "MEI", label: "MEI" }, { pos: "CAM", label: "CAM" },
  { pos: "PD", label: "PD" }, { pos: "PE", label: "PE" }, { pos: "MEI", label: "MEI" },
];

function Fantasy({ owned, connected, toast }) {
  const [time, setTime] = useState(Array(11).fill(null)); // tokenIds
  const [slotAberto, setSlotAberto] = useState(null);

  const minhas = Object.keys(owned).filter((id) => owned[id] > 0 && BY_ID[id] && BY_ID[id].attrs);

  // cálculo de OVR + química (espelha FantasyLeague.sol)
  const { somaOvr, quimica, pontuacao, preenchidos } = useMemo(() => {
    let somaOvr = 0, quimica = 0, preenchidos = 0;
    const selecoes = {};
    time.forEach((id, i) => {
      if (!id) return;
      const f = BY_ID[id];
      preenchidos++;
      somaOvr += f.attrs.OVR;
      if (f.pos === FORMACAO[i].pos) quimica += 3; // posição certa
      selecoes[f.team] = (selecoes[f.team] || 0) + 1;
    });
    Object.values(selecoes).forEach((c) => { if (c >= 2) quimica += (c - 1) * 2; });
    if (preenchidos === 11 && Object.keys(selecoes).length === 1) quimica += 15; // monoseleção
    return { somaOvr, quimica, pontuacao: somaOvr + quimica, preenchidos };
  }, [time]);

  function escolher(id) {
    const nt = [...time]; nt[slotAberto] = id; setTime(nt); setSlotAberto(null);
  }
  function confirmar() {
    if (!connected) return toast("Conecte sua carteira primeiro");
    if (preenchidos < 11) return toast("Escale os 11 jogadores");
    toast(`Time escalado! ${pontuacao} pts`, `escalar() · OVR ${somaOvr} + química ${quimica}`);
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, color: "#3A2E1E" }}>Fantasy League ⚡</h2>
      <p className="text-xs mb-3" style={{ color: "#8A7A5E" }}>Escale 11 cartas. Atributos imutáveis + química definem sua pontuação. Mesma seleção e posição certa dão bônus (estilo FIFA UT).</p>

      {/* Placar */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl p-2 text-center" style={{ background: "#FFF8E8", border: "1px solid #E0D2B4" }}>
          <div className="text-xs" style={{ color: "#8A7A5E" }}>OVR Time</div>
          <div className="text-lg font-black" style={{ color: "#3A2E1E" }}>{somaOvr}</div>
        </div>
        <div className="rounded-xl p-2 text-center" style={{ background: "#EAF5EC", border: "1px solid #9FD3AA" }}>
          <div className="text-xs" style={{ color: "#5A8A6A" }}>Química</div>
          <div className="text-lg font-black" style={{ color: "#0A7A3C" }}>+{quimica}</div>
        </div>
        <div className="rounded-xl p-2 text-center" style={{ background: "#0A2E22" }}>
          <div className="text-xs" style={{ color: "#FFDF0099" }}>Pontuação</div>
          <div className="text-lg font-black" style={{ color: "#FFDF00" }}>{pontuacao}</div>
        </div>
      </div>

      {/* Campo */}
      <div className="rounded-xl p-3 mb-3" style={{ background: "linear-gradient(180deg,#1A7A3C,#0F5A2A)", border: "2px solid #0A4A22" }}>
        <div className="grid grid-cols-3 gap-2">
          {FORMACAO.map((slot, i) => {
            const id = time[i];
            const f = id ? BY_ID[id] : null;
            return (
              <button key={i} onClick={() => setSlotAberto(i)} className="rounded-lg p-1 transition-all" style={{ background: f ? "transparent" : "rgba(255,255,255,.12)", border: f ? "none" : "1.5px dashed rgba(255,255,255,.4)", minHeight: 64 }}>
                {f ? <Sticker fig={f} /> : (
                  <div className="flex flex-col items-center justify-center h-full py-2">
                    <div className="text-xs font-bold" style={{ color: "#fff" }}>{slot.label}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,.6)" }}>+ add</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={confirmar} disabled={preenchidos < 11} className="w-full py-3 rounded-xl font-bold text-sm" style={preenchidos === 11 ? { background: "#FFDF00", color: "#0A2E22" } : { background: "#E0D2B4", color: "#A89878" }}>
        {preenchidos === 11 ? `Escalar time — ${pontuacao} pts` : `Escale ${11 - preenchidos} jogador(es)`}
      </button>

      {/* Seletor de carta */}
      {slotAberto !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: "rgba(0,0,0,.7)" }} onClick={() => setSlotAberto(null)}>
          <div className="w-full max-w-sm rounded-2xl p-4 anim-pop max-h-[70vh] overflow-y-auto" style={{ background: "#112A20" }} onClick={(e) => e.stopPropagation()}>
            <div className="font-bold mb-1" style={{ color: "#F3E9D2", fontFamily: "'Archivo Black'" }}>Escolher {FORMACAO[slotAberto].label}</div>
            <div className="text-xs mb-3" style={{ color: "rgba(243,233,210,.6)" }}>Cartas na posição certa dão +química</div>
            {minhas.length === 0 && <div className="text-sm text-center py-6" style={{ color: "rgba(243,233,210,.6)" }}>Você não tem cartas com atributos. Abra pacotes!</div>}
            <div className="grid grid-cols-3 gap-2">
              {minhas.filter((id) => !time.includes(id)).map((id) => {
                const f = BY_ID[id];
                const certa = f.pos === FORMACAO[slotAberto].pos;
                return (
                  <button key={id} onClick={() => escolher(id)} className="relative rounded-lg" style={{ outline: certa ? "2px solid #0A7A3C" : "none" }}>
                    <Sticker fig={f} count={owned[id]} />
                    {certa && <div className="absolute -top-1 -right-1 text-xs px-1 rounded-full font-black" style={{ background: "#0A7A3C", color: "#fff", fontSize: 9 }}>✓pos</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CSS
// ============================================================
const CSS = `
.paper {
  background:
    radial-gradient(circle at 18% 12%, rgba(255,255,255,.65), transparent 42%),
    repeating-linear-gradient(0deg, rgba(58,46,30,.025) 0 2px, transparent 2px 5px),
    #F3E9D2;
  box-shadow: inset 0 0 60px rgba(58,46,30,.12);
}
.pack-foil {
  background: linear-gradient(135deg, #0A2E22 0%, #14533C 35%, #FFDF00 50%, #14533C 65%, #0A2E22 100%);
  background-size: 250% 250%;
  animation: foil 3.2s ease infinite;
  border: 1px solid rgba(255,223,0,.5);
}
@keyframes foil { 0%,100%{background-position:0% 0%} 50%{background-position:100% 100%} }
.frame-comum { border: 3px solid #fff; }
.frame-rara { border: 3px solid; border-image: linear-gradient(135deg,#E8EDF2,#9FB6CC,#E8EDF2) 1; }
.frame-epica { border: 3px solid #D4A938; box-shadow: 0 0 10px rgba(212,169,56,.55) !important; }
.frame-lendaria { border: 3px solid transparent; background-clip: padding-box; position: relative; }
.frame-lendaria::after {
  content:""; position:absolute; inset:-3px; z-index:-1; border-radius:10px;
  background: conic-gradient(from var(--a,0deg), #FF5C8A, #FFDF00, #4DFFB8, #4DA6FF, #B36CF0, #FF5C8A);
  animation: holo 2.6s linear infinite;
}
@property --a { syntax:'<angle>'; initial-value:0deg; inherits:false; }
@keyframes holo { to { --a: 360deg; } }
.frame-lendaria { box-shadow: 0 0 14px rgba(179,108,240,.6) !important; }
@keyframes slap { 0%{transform:scale(1.9) rotate(8deg);opacity:0} 60%{transform:scale(.94) rotate(-2deg);opacity:1} 100%{transform:scale(1) rotate(0)} }
.anim-slap { animation: slap .5s cubic-bezier(.2,.9,.3,1.2) both; }
@keyframes pop { from{transform:scale(.85);opacity:0} to{transform:scale(1);opacity:1} }
.anim-pop { animation: pop .35s ease both; }
@keyframes toastIn { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
.anim-toast { animation: toastIn .3s ease both; }
@keyframes spinSlow { to{transform:rotate(360deg)} }
.anim-spin-slow { animation: spinSlow 1.6s linear infinite; }
@keyframes floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.anim-float { animation: floaty 2.4s ease-in-out infinite; }
@keyframes pulseG { 0%,100%{opacity:1} 50%{opacity:.7} }
.anim-pulse { animation: pulseG 1.4s ease infinite; }
.anim-bar { transition: width .6s ease; }
@media (prefers-reduced-motion: reduce) {
  .anim-slap,.anim-pop,.anim-toast,.anim-spin-slow,.anim-float,.anim-pulse,.pack-foil,.frame-lendaria::after { animation: none !important; }
}
`;
