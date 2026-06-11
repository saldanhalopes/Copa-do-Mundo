// scripts/deploy-testnet.js
// Deploy COMPLETO na testnet (Amoy/Polygon ou BSC testnet) com todos os contratos
// e a fiação (roles) entre eles.
//
// Uso: npx hardhat run scripts/deploy-testnet.js --network amoy
//
// Nota: requer o compilador solc. Como o sandbox bloqueia o download do Hardhat,
// em produção rode localmente após `npm install`. Os endereços VRF abaixo são
// os oficiais da testnet Amoy.

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const VRF = {
  amoy: {
    coordinator: "0x343300b5d84D444B2ADc9116FEF1bED02BE49Cf2",
    keyHash: "0x816bedba8a50b294e5cbd47842baf240c2385f2eaf719edbd4f250a137a8c899",
    nome: "Polygon Amoy",
    symbol: "POL",
  },
  bscTestnet: {
    coordinator: "0xDA3b641D438362C440Ac5458c57e00a712b66700", // Chainlink VRF v2.5 BSC testnet
    keyHash: "0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26", // 50 gwei key hash
    nome: "BSC Testnet",
    symbol: "tBNB",
  },
};

async function main() {
  const net = network.name;
  const cfg = VRF[net] || VRF.amoy;
  const [deployer] = await ethers.getSigners();
  const tesouro = process.env.TREASURY_ADDRESS || deployer.address;
  const subId = net === "bscTestnet"
    ? (process.env.CHAINLINK_SUB_ID_BSC || 1)
    : (process.env.CHAINLINK_SUB_ID_POLYGON || 1);

  console.log(`\n🚀 Deploy completo na ${cfg.nome}`);
  console.log(`   Deployer: ${deployer.address}\n`);

  // 1. Coleção ERC-1155
  const Fig = await ethers.getContractFactory("FigurinhasCopa");
  const fig = await Fig.deploy("ipfs://PLACEHOLDER/{id}.json", deployer.address, tesouro);
  await fig.waitForDeployment();
  const figAddr = await fig.getAddress();
  console.log("1. FigurinhasCopa:", figAddr);

  // 2. Atributos das cartas
  const Stats = await ethers.getContractFactory("CardStats");
  const stats = await Stats.deploy(deployer.address);
  await stats.waitForDeployment();
  const statsAddr = await stats.getAddress();
  console.log("2. CardStats:", statsAddr);

  // 3. Loja de pacotes (VRF)
  const Pack = await ethers.getContractFactory("PackStore");
  const pack = await Pack.deploy(cfg.coordinator, subId, cfg.keyHash, figAddr, tesouro);
  await pack.waitForDeployment();
  const packAddr = await pack.getAddress();
  console.log("3. PackStore:", packAddr);

  // 4. Trocas P2P
  const Trade = await ethers.getContractFactory("TradeDesk");
  const trade = await Trade.deploy(figAddr);
  await trade.waitForDeployment();
  console.log("4. TradeDesk:", await trade.getAddress());

  // 5. Ranking e temporadas
  const Rank = await ethers.getContractFactory("RankingSeasons");
  const rank = await Rank.deploy(deployer.address);
  await rank.waitForDeployment();
  const rankAddr = await rank.getAddress();
  console.log("5. RankingSeasons:", rankAddr);

  // 6. PvP com aposta
  const Match = await ethers.getContractFactory("MatchEscrow");
  const match = await Match.deploy(figAddr, statsAddr, tesouro, deployer.address);
  await match.waitForDeployment();
  const matchAddr = await match.getAddress();
  console.log("6. MatchEscrow:", matchAddr);

  // 7. Fantasy
  const Fantasy = await ethers.getContractFactory("FantasyLeague");
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

  // ── Registrar PackStore como consumer na subscription VRF ────
  console.log("\n🔗 Registrando PackStore como consumer VRF...");
  const coordinatorAddr = cfg.coordinator;
  const abiConsumer = [
    "function addConsumer(uint256 subId, address consumer) external",
    "function getSubscription(uint256 subId) external view returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address owner, address[] memory consumers)",
  ];
  const coordinator = new ethers.Contract(coordinatorAddr, abiConsumer, deployer);
  await (await coordinator.addConsumer(subId, packAddr)).wait();
  console.log("   PackStore adicionado como consumer na subscription VRF");

  // ── Output JSON ────────────────────────────────────────────────
  const deployment = {
    network: net,
    chainId: network.config.chainId,
    deployer: deployer.address,
    treasury: tesouro,
    vrfCoordinator: cfg.coordinator,
    chainlinkSubscriptionId: subId,
    contracts: {
      FigurinhasCopa: figAddr,
      CardStats: statsAddr,
      PackStore: packAddr,
      TradeDesk: await trade.getAddress(),
      RankingSeasons: rankAddr,
      MatchEscrow: matchAddr,
      FantasyLeague: await fantasy.getAddress(),
    },
    roles: {
      MINTER_ROLE_assignedTo: "PackStore",
      MATCH_ROLE_assignedTo: "MatchEscrow",
    },
    vrf: {
      coordinator: cfg.coordinator,
      subscriptionId: subId,
      consumer: packAddr,
      consumerRegistered: true,
    },
    deployedAt: new Date().toISOString(),
  };
  const outDir = path.resolve(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${net}.json`), JSON.stringify(deployment, null, 2));
  console.log(`\n📄 Output salvo em deployments/${net}.json`);

  console.log("\n✅ Deploy completo!");
  console.log("\n📋 Próximos passos:");
  console.log("   1. Rodar gerador: npm run gen:cards");
  console.log("   2. configurarFigurinhas() com os 680 ids/raridades/supplies");
  console.log("   3. setStatsBatch() com o output/stats.json");
  console.log("   4. Upload arte no IPFS, setURI(), freezeMetadata(), freezeStats()");
  console.log("   5. iniciarTemporada(30) no RankingSeasons");
}

main().catch((e) => { console.error(e); process.exit(1); });
