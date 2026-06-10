// scripts/deploy-multichain.js
// Hardhat deploy — Polygon PoS (chainId 137) e BNB Chain (chainId 56)
// Uso: npx hardhat run scripts/deploy-multichain.js --network polygon
//      npx hardhat run scripts/deploy-multichain.js --network bnb

const { ethers, network } = require("hardhat");

// ─────────────────────────────────────────────────────────────────────
// Configurações por rede
// ─────────────────────────────────────────────────────────────────────
const CONFIG = {
  polygon: {
    vrfCoordinator: "0xec0Ed46f36576541C75739E915ADbCe9a17d8416", // Polygon mainnet VRF 2.5
    keyHash:        "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    subscriptionId: process.env.CHAINLINK_SUB_ID_POLYGON,
    baseUri:        "ipfs://QmPLACEHOLDER_POLYGON/{id}.json",
    contractUri:    "ipfs://QmPLACEHOLDER_POLYGON/collection.json",
    royaltyRecipient: process.env.TREASURY_ADDRESS,
    contract:       "FigurinhasCopa",          // Polygon usa Chainlink VRF
    marketplace:    "OpenSea / Magic Eden",
  },
  bnb: {
    vrfCoordinator: "0x0000000000000000000000000000000000000000", // Binance Oracle VRF (substituir)
    binancePay:     "0x0000000000000000000000000000000000000000", // Binance Pay oracle
    baseUri:        "ipfs://QmPLACEHOLDER_BNB/{id}.json",
    contractUri:    "ipfs://QmPLACEHOLDER_BNB/collection.json",
    royaltyRecipient: process.env.TREASURY_ADDRESS,
    contract:       "FigurinhasCopaBNB",       // BNB usa Binance Oracle
    marketplace:    "Binance NFT Marketplace",
  },
};

// ─────────────────────────────────────────────────────────────────────
// Supply por raridade (680 figurinhas)
// ─────────────────────────────────────────────────────────────────────
function buildSupplies() {
  const ids = [], raridades = [], supplies = [];
  for (let i = 1; i <= 680; i++) {
    ids.push(i);
    // Lenda histórica (IDs 601–680) → Épica
    // Cada 11ª figurinha de seleção (camisa 10) → Lendária
    // Goleiros (posição 1 de cada time, IDs x1) → Épica
    // Demais → Comum ou Rara
    const isLenda   = i >= 601;
    const isCamisa10 = i % 12 === 0; // simplificação para deploy
    const isGoleiro = i % 12 === 1;
    const isRara    = i % 12 === 6 || i % 12 === 9;

    let rar, supply;
    if (isLenda || isCamisa10) { rar = 3; supply = 500;   }
    else if (isGoleiro)         { rar = 2; supply = 2_500; }
    else if (isRara)            { rar = 1; supply = 10_000;}
    else                        { rar = 0; supply = 50_000;}

    raridades.push(rar);
    supplies.push(supply);
  }
  return { ids, raridades, supplies };
}

async function main() {
  const net = network.name;
  const cfg = CONFIG[net];
  if (!cfg) throw new Error(`Rede '${net}' não configurada. Use 'polygon' ou 'bnb'.`);

  const [deployer] = await ethers.getSigners();
  console.log(`\n🚀 Deploy na ${net.toUpperCase()} com ${deployer.address}`);
  console.log(`   Saldo: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ${net === "bnb" ? "BNB" : "POL"}`);

  // ── 1. Deploy do contrato de coleção ─────────────────────────────
  console.log(`\n📜 Deployando ${cfg.contract}...`);
  const Factory = await ethers.getContractFactory(cfg.contract);

  let figurinhas;
  if (net === "polygon") {
    figurinhas = await Factory.deploy(
      cfg.baseUri,
      cfg.royaltyRecipient,
      cfg.royaltyRecipient,  // admin = treasury no MVP
    );
  } else {
    figurinhas = await Factory.deploy(
      cfg.baseUri,
      cfg.contractUri,
      cfg.royaltyRecipient,
      cfg.royaltyRecipient,
      cfg.vrfCoordinator,
      cfg.binancePay,
    );
  }
  await figurinhas.waitForDeployment();
  const figAddr = await figurinhas.getAddress();
  console.log(`   ✅ FigurinhasCopa: ${figAddr}`);

  // ── 2. Configurar 680 figurinhas ─────────────────────────────────
  console.log("\n🃏 Configurando 680 figurinhas (supply + raridade)...");
  const { ids, raridades, supplies } = buildSupplies();

  // Envia em batches de 100 para não estourar gás
  const BATCH = 100;
  for (let i = 0; i < ids.length; i += BATCH) {
    const tx = await figurinhas.configurarFigurinhas(
      ids.slice(i, i + BATCH),
      raridades.slice(i, i + BATCH),
      supplies.slice(i, i + BATCH),
    );
    await tx.wait();
    process.stdout.write(`   IDs ${ids[i]}–${ids[Math.min(i + BATCH - 1, ids.length - 1)]} ✓\r`);
  }
  console.log("\n   ✅ Todas configuradas");

  // ── 3. Deploy do PackStore ────────────────────────────────────────
  console.log("\n📦 Deployando PackStore...");
  const PackStore = await ethers.getContractFactory(
    net === "polygon" ? "PackStore" : "PackStore"   // mesma interface, VRF diferente
  );
  // PackStore recebe o endereço das figurinhas na construção
  // (para simplificar o deploy script, PackStore é genérico)
  // O deploy real seria: new PackStore(vrfCoordinator, subId, keyHash, figAddr, treasury)

  // ── 4. Conceder MINTER_ROLE ao PackStore ─────────────────────────
  // const MINTER = await figurinhas.MINTER_ROLE();
  // await (await figurinhas.grantRole(MINTER, packStoreAddr)).wait();
  // console.log(`   ✅ MINTER_ROLE concedido ao PackStore`);

  // ── 5. Deploy do TradeDesk ────────────────────────────────────────
  console.log("\n🔄 Deployando TradeDesk...");
  const TradeDesk = await ethers.getContractFactory("TradeDesk");
  const tradeDesk = await TradeDesk.deploy(figAddr);
  await tradeDesk.waitForDeployment();
  const tdAddr = await tradeDesk.getAddress();
  console.log(`   ✅ TradeDesk: ${tdAddr}`);

  // ── 6. Resumo ─────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────────");
  console.log(`🏁 Deploy concluído na ${net.toUpperCase()}`);
  console.log(`   Marketplace: ${cfg.marketplace}`);
  console.log(`   FigurinhasCopa: ${figAddr}`);
  console.log(`   TradeDesk:      ${tdAddr}`);
  console.log("─────────────────────────────────────────────");
  console.log("\n📋 Próximos passos:");
  console.log("   1. Verificar contratos: npx hardhat verify --network " + net + " " + figAddr);
  if (net === "bnb") {
    console.log("   2. Submeter no Binance NFT Marketplace (verificação KYC exigida)");
    console.log("   3. Configurar Binance Pay: merchants.binance.com");
  } else {
    console.log("   2. Criar subscriptionId Chainlink VRF em vrf.chain.link");
    console.log("   3. Adicionar PackStore como consumer na subscription");
  }
  console.log("   4. Congelar metadata após upload IPFS: freezeMetadata()");
}

main().catch((e) => { console.error(e); process.exit(1); });
