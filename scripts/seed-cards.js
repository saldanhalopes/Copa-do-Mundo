// scripts/seed-cards.js
// Configura os contratos com as 1.352 cartas: supply/raridade (FigurinhasCopa)
// e atributos (CardStats). Lê generator/output/{catalogo,stats}.json.
//
// Uso: npx hardhat run scripts/seed-cards.js --network localhost

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// supply por raridade (espelha TOKENOMICS.md)
const SUPPLY = [50000, 10000, 2500, 500, 50];

async function main() {
  // carrega endereços do deploy
  const localPath = path.join(__dirname, "..", "deployments", "local.json");
  if (!fs.existsSync(localPath)) {
    console.error("❌ deployments/local.json não encontrado. Rode deploy-local.js primeiro.");
    process.exit(1);
  }
  const dep = JSON.parse(fs.readFileSync(localPath, "utf8"));

  // carrega catálogo e stats do gerador
  const genDir = path.join(__dirname, "..", "generator", "output");
  const catalogo = JSON.parse(fs.readFileSync(path.join(genDir, "catalogo.json"), "utf8"));
  const stats = JSON.parse(fs.readFileSync(path.join(genDir, "stats.json"), "utf8"));

  const fig = await hre.ethers.getContractAt("FigurinhasCopa", dep.contracts.FigurinhasCopa);
  const cardStats = await hre.ethers.getContractAt("CardStats", dep.contracts.CardStats);
  const pack = await hre.ethers.getContractAt("PackStore", dep.contracts.PackStore);

  // ── 1. Configurar supply/raridade de todas as cartas (em lotes) ──
  console.log("🃏 Configurando supply/raridade...");
  const ids = catalogo.map((c) => c.id);
  const rars = catalogo.map((c) => c.rar);
  const supplies = catalogo.map((c) => SUPPLY[c.rar]);

  const BATCH = 200;
  for (let i = 0; i < ids.length; i += BATCH) {
    const tx = await fig.configurarFigurinhas(
      ids.slice(i, i + BATCH),
      rars.slice(i, i + BATCH),
      supplies.slice(i, i + BATCH)
    );
    await tx.wait();
    process.stdout.write(`   ${Math.min(i + BATCH, ids.length)}/${ids.length}\r`);
  }
  console.log("\n   ✅ supply configurado");

  // ── 2. Gravar atributos no CardStats (só jogadores têm) ──
  console.log("📊 Gravando atributos (CardStats)...");
  const sIds = stats.tokenIds;
  const sPacked = stats.packedStats.map((p) => BigInt(p));
  for (let i = 0; i < sIds.length; i += BATCH) {
    const tx = await cardStats.setStatsBatch(
      sIds.slice(i, i + BATCH),
      sPacked.slice(i, i + BATCH)
    );
    await tx.wait();
    process.stdout.write(`   ${Math.min(i + BATCH, sIds.length)}/${sIds.length}\r`);
  }
  console.log("\n   ✅ atributos gravados");

  // ── 3. Configurar pools de raridade no PackStore (só jogadores) ──
  console.log("🎁 Configurando pools do PackStore...");
  for (let rar = 0; rar < 5; rar++) {
    const poolIds = catalogo.filter((c) => c.tipo === 0 && c.rar === rar).map((c) => c.id);
    if (poolIds.length === 0) continue;
    const POOL_BATCH = 100;
    for (let i = 0; i < poolIds.length; i += POOL_BATCH) {
      const batch = poolIds.slice(i, i + POOL_BATCH);
      const tx = await pack.configurarPool(rar, batch);
      await tx.wait();
    }
    console.log(`   raridade ${rar}: ${poolIds.length} cartas`);
  }

  console.log("\n✅ Seed completo. Contratos prontos para uso.");
}

main().catch((e) => { console.error(e); process.exit(1); });
