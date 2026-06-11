// scripts/deploy-local.js
// Deploy COMPLETO dos contratos no nó Hardhat local (docker-compose).
// Usa um VRF mock para o PackStore (não há Chainlink local).
//
// Uso (dentro do container): npx hardhat run scripts/deploy-local.js --network localhost
// Escreve os endereços em /app/deployments/local.json (volume compartilhado).

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const tesouro = deployer.address;
  console.log(`\n🚀 Deploy LOCAL com ${deployer.address}`);

  // ── 1. Mock do VRF Coordinator (para PackStore funcionar local) ──
  // Em local não há Chainlink; usamos um coordinator fake que entrega
  // aleatoriedade na hora. Se o mock não existir, deploya um inline simples.
  let vrfCoordinator;
  try {
    const Mock = await hre.ethers.getContractFactory("VRFCoordinatorV2Mock");
    vrfCoordinator = await Mock.deploy(0, 0);
    await vrfCoordinator.waitForDeployment();
    console.log("   VRF Mock:", await vrfCoordinator.getAddress());
  } catch {
    console.log("   ⚠️  VRFCoordinatorV2Mock não encontrado — PackStore usará address placeholder");
    vrfCoordinator = { getAddress: async () => "0x0000000000000000000000000000000000000001" };
  }
  const vrfAddr = await vrfCoordinator.getAddress();
  const keyHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const subId = 1;

  // ── 2. Coleção ERC-1155 ──
  const Fig = await hre.ethers.getContractFactory("FigurinhasCopa");
  const fig = await Fig.deploy("ipfs://LOCAL/{id}.json", deployer.address, tesouro);
  await fig.waitForDeployment();
  const figAddr = await fig.getAddress();
  console.log("1. FigurinhasCopa:", figAddr);

  // ── 3. CardStats ──
  const Stats = await hre.ethers.getContractFactory("CardStats");
  const stats = await Stats.deploy(deployer.address);
  await stats.waitForDeployment();
  const statsAddr = await stats.getAddress();
  console.log("2. CardStats:", statsAddr);

  // ── 4. PackStore ──
  const Pack = await hre.ethers.getContractFactory("PackStore");
  const pack = await Pack.deploy(vrfAddr, subId, keyHash, figAddr, tesouro);
  await pack.waitForDeployment();
  const packAddr = await pack.getAddress();
  console.log("3. PackStore:", packAddr);

  // ── 5. TradeDesk ──
  const Trade = await hre.ethers.getContractFactory("TradeDesk");
  const trade = await Trade.deploy(figAddr);
  await trade.waitForDeployment();
  console.log("4. TradeDesk:", await trade.getAddress());

  // ── 6. RankingSeasons ──
  const Rank = await hre.ethers.getContractFactory("RankingSeasons");
  const rank = await Rank.deploy(deployer.address);
  await rank.waitForDeployment();
  const rankAddr = await rank.getAddress();
  console.log("5. RankingSeasons:", rankAddr);

  // ── 7. MatchEscrow ──
  const Match = await hre.ethers.getContractFactory("MatchEscrow");
  const match = await Match.deploy(figAddr, statsAddr, tesouro, deployer.address);
  await match.waitForDeployment();
  const matchAddr = await match.getAddress();
  console.log("6. MatchEscrow:", matchAddr);

  // ── 8. FantasyLeague ──
  const Fantasy = await hre.ethers.getContractFactory("FantasyLeague");
  const fantasy = await Fantasy.deploy(figAddr, statsAddr, deployer.address);
  await fantasy.waitForDeployment();
  console.log("7. FantasyLeague:", await fantasy.getAddress());

  // ── Fiação de roles ──
  console.log("\n🔗 Permissões...");
  await (await fig.grantRole(await fig.MINTER_ROLE(), packAddr)).wait();
  await (await rank.grantRole(await rank.MATCH_ROLE(), matchAddr)).wait();
  console.log("   MINTER_ROLE → PackStore, MATCH_ROLE → MatchEscrow");

  // ── Escreve endereços em volume compartilhado ──
  const out = {
    network: "localhost",
    chainId: 31337,
    rpc: "http://hardhat:8545",
    contracts: {
      FigurinhasCopa: figAddr,
      CardStats: statsAddr,
      PackStore: packAddr,
      TradeDesk: await trade.getAddress(),
      RankingSeasons: rankAddr,
      MatchEscrow: matchAddr,
      FantasyLeague: await fantasy.getAddress(),
      VRFMock: vrfAddr,
    },
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const dir = path.join("/app", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "local.json"), JSON.stringify(out, null, 2));
  console.log("\n✅ Deploy local concluído. Endereços em deployments/local.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
