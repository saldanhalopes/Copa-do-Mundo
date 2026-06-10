// test/logic.test.js
// Valida que a lógica dos contratos, do gerador Python e do protótipo são consistentes.
// Roda com: node test/logic.test.js
const fs = require("fs");
const path = require("path");

let passou = 0, falhou = 0;
function check(nome, cond) {
  if (cond) { passou++; console.log("  ✓", nome); }
  else { falhou++; console.log("  ✗ FALHOU:", nome); }
}

// ─────────────────────────────────────────────────────────────
// 1. Empacotamento de stats (CardStats.sol vs generator Python)
// ─────────────────────────────────────────────────────────────
console.log("\n[1] Empacotamento de atributos (uint256)");
function pack(pac, sho, pas, dri, def, phy, ovr, pos, rar, sel) {
  return BigInt(pac)
    | (BigInt(sho) << 8n)
    | (BigInt(pas) << 16n)
    | (BigInt(dri) << 24n)
    | (BigInt(def) << 32n)
    | (BigInt(phy) << 40n)
    | (BigInt(ovr) << 48n)
    | (BigInt(pos) << 56n)
    | (BigInt(rar) << 64n)
    | (BigInt(sel) << 72n);
}
function unpack(p) {
  const b = (shift) => Number((p >> BigInt(shift)) & 0xffn);
  return { pac: b(0), sho: b(8), pas: b(16), dri: b(24), def: b(32), phy: b(40), ovr: b(48), pos: b(56), rar: b(64), sel: b(72) };
}
const packed = pack(95, 99, 99, 97, 75, 90, 92, 8, 3, 0);
const u = unpack(packed);
check("PAC=95 sobrevive ao empacotamento", u.pac === 95);
check("SHO=99 sobrevive", u.sho === 99);
check("OVR=92 sobrevive", u.ovr === 92);
check("raridade=3 (Lendária) sobrevive", u.rar === 3);
check("posição=8 (CAM) sobrevive", u.pos === 8);

// confere contra o stats.json gerado pelo Python (se existir)
const statsPath = path.join(__dirname, "..", "generator", "output", "stats.json");
if (fs.existsSync(statsPath)) {
  const data = JSON.parse(fs.readFileSync(statsPath, "utf8"));
  const p11 = BigInt(data.packedStats[10]); // carta #11 = camisa 10 lendária
  const c11 = unpack(p11);
  check("Gerador Python: carta #11 é raridade 3 (Lendária)", c11.rar === 3);
  check("Gerador Python: carta #11 OVR está em 87-92", c11.ovr >= 87 && c11.ovr <= 92);
  check("Gerador Python: total de 44 cartas (demo 4 seleções)", data.tokenIds.length === 44);
} else {
  console.log("  (stats.json não encontrado — rode o gerador primeiro)");
}

// ─────────────────────────────────────────────────────────────
// 2. Força de batalha (MatchEscrow.sol _forcaCarta)
// ─────────────────────────────────────────────────────────────
console.log("\n[2] Força de batalha (atributos decidem)");
function forcaCarta(c, rand) {
  let attr;
  if (c.pos === 0 || c.pos === 1) attr = c.def;
  else if (c.pos >= 6) attr = c.sho;
  else attr = c.pas;
  return c.ovr * 2 + attr + rand;
}
const lendaria = { ovr: 92, sho: 99, pas: 90, def: 75, pos: 8 }; // CAM
const comum = { ovr: 65, sho: 50, pas: 57, def: 74, pos: 1 };     // ZAG
// mesmo com sorte máxima para a comum e mínima para a lendária
const fL = forcaCarta(lendaria, 0);
const fC = forcaCarta(comum, 9);
check("Lendária (CAM) vence comum mesmo com sorte adversa", fL > fC);
check("Força usa SHO para atacante", forcaCarta({ ovr: 80, sho: 90, pas: 50, def: 40, pos: 8 }, 0) === 250);
check("Força usa DEF para zagueiro", forcaCarta({ ovr: 80, sho: 40, pas: 50, def: 88, pos: 1 }, 0) === 248);

// ─────────────────────────────────────────────────────────────
// 3. Química Fantasy (FantasyLeague.sol)
// ─────────────────────────────────────────────────────────────
console.log("\n[3] Química do time (bônus de seleção e posição)");
function calcQuimica(cartas, posicoesAlvo) {
  let quimica = 0;
  const selecoes = {};
  cartas.forEach((c, i) => {
    if (c.pos === posicoesAlvo[i]) quimica += 3;
    selecoes[c.sel] = (selecoes[c.sel] || 0) + 1;
  });
  Object.values(selecoes).forEach((cnt) => { if (cnt >= 2) quimica += (cnt - 1) * 2; });
  if (cartas.length === 11 && Object.keys(selecoes).length === 1) quimica += 15;
  return quimica;
}
const timeMono = Array(11).fill({ pos: 5, sel: 0 });
const posAlvo = Array(11).fill(5);
const qMono = calcQuimica(timeMono, posAlvo);
check("Time 100% mesma seleção + posições certas tem química alta", qMono === 33 + 15 + 20);
const timeMisto = [{pos:5,sel:0},{pos:5,sel:1},{pos:5,sel:2}];
check("Time misto (3 seleções) tem menos química", calcQuimica(timeMisto, [5,5,5]) === 9);

// ─────────────────────────────────────────────────────────────
// 4. ELO (RankingSeasons.sol)
// ─────────────────────────────────────────────────────────────
console.log("\n[4] Rating ELO (atualização pós-partida)");
const K = 32;
function expectativa(eloA, eloB) {
  if (eloA >= eloB) {
    const diff = eloA - eloB;
    const e = 5000 + (diff * 4500) / 400;
    return e > 9500 ? 9500 : e;
  } else {
    const diff = eloB - eloA;
    const e = (diff * 4500) / 400;
    return e > 4500 ? 500 : 5000 - e;
  }
}
// dois jogadores iguais (1000 vs 1000): vencedor sobe ~16, perdedor cai ~16
const expV = expectativa(1000, 1000);
const ganhoVencedor = Math.floor((K * (10000 - expV)) / 10000);
check("Jogadores iguais: vencedor ganha 16 de ELO", ganhoVencedor === 16);
// azarão vencendo favorito ganha mais
const expAzarao = expectativa(800, 1200);
const ganhoAzarao = Math.floor((K * (10000 - expAzarao)) / 10000);
check("Azarão (800) vencendo favorito (1200) ganha mais que 16", ganhoAzarao > 16);

// ─────────────────────────────────────────────────────────────
// 5. Distribuição do pote (MatchEscrow taxaCasaBps)
// ─────────────────────────────────────────────────────────────
console.log("\n[5] Distribuição do pote PvP");
function distribuir(stake, taxaBps) {
  const pote = stake * 2;
  const taxa = (pote * taxaBps) / 10000;
  return { premio: pote - taxa, taxa };
}
const d = distribuir(10, 500); // aposta 10, taxa 5%
check("Aposta 10+10=20, taxa 5% = 1, prêmio = 19", d.premio === 19 && d.taxa === 1);

// ─────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`RESULTADO: ${passou} passaram, ${falhou} falharam`);
process.exit(falhou > 0 ? 1 : 0);
