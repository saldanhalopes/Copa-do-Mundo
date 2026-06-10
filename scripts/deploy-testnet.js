// scripts/deploy-testnet.js
// Deploy COMPLETO na testnet (Amoy/Polygon ou BSC testnet) com todos os contratos
// e a fiação (roles) entre eles.
//
// Uso: npx hardhat run scripts/deploy-testnet.js --network amoy
//
// Nota: requer o compilador solc. Como o sandbox bloqueia o download do Hardhat,
// em produção rode localmente após `npm install`. Os endereços VRF abaixo são
// os oficiais da testnet Amoy.

const hre = require("hardhat");

const VRF = {
  amoy: {
    coordinator: "0x343300b5d84D444B2ADc9116FEF1bED02BE49Cf2",
    keyHash: "0x816bedba8a50b294e5cbd47842baf240c2385f2eaf719edbd4f250a137a8c899",
    nome: "Polygon Amoy",
    symbol: "POL",
  },
  bscTestnet: {
    coordinator: "0x0000000000000000000000000000000000000000", // Binance Oracle VRF testnet
    keyHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    nome: "BSC Testnet",
    symbol: "tBNB",
  },
};

async function main() {
  const net = hre.network.name;
  const cfg = VRF[net] || VRF.amoy;
  const [deployer] = await hre.ethers.getSigners();
  const tesouro = process.env.TREASURY_ADDRESS || deployer.address;
  const subId = process.env.CHAINLINK_SUB_ID_POLYGON || 1;

  console.log(`\n🚀 Deploy completo na ${cfg.nome}`);
  console.log(`   Deployer: ${deployer.address}\n`);

  // 1. Coleção ERC-1155
  const Fig = await hre.ethers.getContractFactory("FigurinhasCopa");
  const fig = await Fig.deploy("ipfs://PLACEHOLDER/{id}.json", deployer.address, tesouro);
  await fig.waitForDeployment();
  const figAddr = await fig.getAddress();
  console.log("1. FigurinhasCopa:", figAddr);

  // 2. Atributos das cartas
  const Stats = await hre.ethers.getContractFactory("CardStats");
  const stats = await Stats.deploy(deployer.address);
  await stats.waitForDeployment();
  const statsAddr = await stats.getAddress();
  console.log("2. CardStats:", statsAddr);

  // 3. Loja de pacotes (VRF)
  const Pack = await hre.ethers.getContractFactory("PackStore");
  const pack = await Pack.deploy(cfg.coordinator, subId, cfg.keyHash, figAddr, tesouro);
  await pack.waitForDeployment();
  const packAddr = await pack.getAddress();
  console.log("3. PackStore:", packAddr);

  // 4. Trocas P2P
  const Trade = await hre.ethers.getContractFactory("TradeDesk");
  const trade = await Trade.deploy(figAddr);
  await trade.waitForDeployment();
  console.log("4. TradeDesk:", await trade.getAddress());

  // 5. Ranking e temporadas
  const Rank = await hre.ethers.getContractFactory("RankingSeasons");
  const rank = await Rank.deploy(deployer.address);
  await rank.waitForDeployment();
  const rankAddr = await rank.getAddress();
  console.log("5. RankingSeasons:", rankAddr);

  // 6. PvP com aposta
  const Match = await hre.ethers.getContractFactory("MatchEscrow");
  const match = await Match.deploy(figAddr, statsAddr, tesouro, deployer.address);
  await match.waitForDeployment();
  const matchAddr = await match.getAddress();
  console.log("6. MatchEscrow:", matchAddr);

  // 7. Fantasy
  const Fantasy = await hre.ethers.getContractFactory("FantasyLeague");
  const fantasy = await Fantasy.deploy(figAddr, statsAddr, deployer.address);
  await fantasy.waitForDeployment();
  console.log("7. FantasyLeague:", await fantasy.getAddress());

  // ── Fiação de roles ──────────────────────────────────────────
  console.log("\n🔗 Configurando permissões...");
  const MINTER = await fig.MINTER_ROLE();
  await (await fig.grantRole(MINTER, packAddr)).wait();
  console.log("   MINTER_ROLE → PackStore");

  const MATCH_ROLE = await rank.MATCH_ROLE();
  await (await rank.grantRole(MATCH_ROLE, matchAddr)).wait();
  console.log("   MATCH_ROLE → MatchEscrow (atualiza ELO)");

  console.log("\n✅ Deploy completo!");
  console.log("\n📋 Próximos passos:");
  console.log("   1. Rodar gerador: npm run gen:cards");
  console.log("   2. configurarFigurinhas() com os 680 ids/raridades/supplies");
  console.log("   3. setStatsBatch() com o output/stats.json");
  console.log("   4. Upload arte no IPFS, setURI(), freezeMetadata(), freezeStats()");
  console.log("   5. Criar subscription VRF e adicionar PackStore como consumer");
  console.log("   6. iniciarTemporada(30) no RankingSeasons");
}

main().catch((e) => { console.error(e); process.exit(1); });
