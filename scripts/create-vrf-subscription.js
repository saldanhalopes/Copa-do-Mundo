// scripts/create-vrf-subscription.js
// Cria uma subscription Chainlink VRF v2.5, financia com native token,
// e exibe o subscriptionId para copiar ao .env.
//
// Uso:
//   npx hardhat run scripts/create-vrf-subscription.js --network amoy
//   npx hardhat run scripts/create-vrf-subscription.js --network bscTestnet
//
// Pré-requisitos:
//   - .env com PRIVATE_KEY da carteira de deploy (precisa de native token
//     para pagar o gas e financiar a subscription)
//   - A carteira usada será a owner da subscription

const { ethers, network } = require("hardhat");

const VRF = {
  amoy: {
    coordinator: "0x343300b5d84D444B2ADc9116FEF1bED02BE49Cf2",
    nome: "Polygon Amoy",
    nativeSymbol: "POL",
    // ~0.01 POL é suficiente para testes (cobre ~5 requests com callbackGas 400k)
    fundingAmount: ethers.parseEther("0.01"),
  },
  bscTestnet: {
    coordinator: "0xDA3b641D438362C440Ac5458c57e00a712b66700",
    nome: "BSC Testnet",
    nativeSymbol: "tBNB",
    fundingAmount: ethers.parseEther("0.005"),
  },
};

async function main() {
  const net = network.name;
  const cfg = VRF[net];
  if (!cfg) {
    throw new Error(
      `Rede '${net}' não suportada. Use 'amoy' ou 'bscTestnet'.`
    );
  }

  const [deployer] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(deployer.address);

  console.log(`\n🌐 Rede: ${cfg.nome} (${net})`);
  console.log(`   Carteira: ${deployer.address}`);
  console.log(`   Saldo: ${ethers.formatEther(bal)} ${cfg.nativeSymbol}\n`);

  if (bal < cfg.fundingAmount + ethers.parseEther("0.001")) {
    console.warn(
      `⚠️  Saldo baixo! Precisa de no mínimo ${ethers.formatEther(cfg.fundingAmount + ethers.parseEther("0.001"))} ${cfg.nativeSymbol} ` +
      `para criar a subscription e financiá-la.`
    );
  }

  // Conecta ao VRF Coordinator — inclui o evento na ABI para parse automático
  const abi = [
    "function createSubscription() external returns (uint256 subId)",
    "function fundSubscriptionWithNative(uint256 subId) external payable",
    "function addConsumer(uint256 subId, address consumer) external",
    "function getSubscription(uint256 subId) external view returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address owner, address[] memory consumers)",
    "event SubscriptionCreated(uint256 indexed subId, address owner)",
  ];
  const coordinator = new ethers.Contract(cfg.coordinator, abi, deployer);

  // ── 1. Criar subscription ──────────────────────────────────────
  console.log("📝 Criando subscription...");
  const txCreate = await coordinator.createSubscription();
  const receiptCreate = await txCreate.wait();

  // Extrai o subId do event SubscriptionCreated(subId, owner) via
  // o contrato conectado (parseLog automaticamente usa a ABI fornecida)
  const subId = receiptCreate.logs
    .filter((l) => l.fragment?.name === "SubscriptionCreated")
    .map((l) => l.args[0])[0];

  if (!subId) {
    throw new Error("Não foi possível extrair subscriptionId do evento SubscriptionCreated");
  }
  console.log(`   ✅ Subscription criada! ID: ${subId}\n`);

  // ── 2. Financiar com native token ──────────────────────────────
  console.log(`💰 Financiando subscription #${subId} com ${ethers.formatEther(cfg.fundingAmount)} ${cfg.nativeSymbol}...`);
  const txFund = await coordinator.fundSubscriptionWithNative(subId, {
    value: cfg.fundingAmount,
  });
  await txFund.wait();
  console.log("   ✅ Subscription financiada!\n");

  // ── 3. Exibir resumo ──────────────────────────────────────────
  const sub = await coordinator.getSubscription(subId);
  console.log("📋 Resumo da subscription:");
  console.log(`   ID:              ${subId}`);
  console.log(`   Owner:           ${sub.owner}`);
  console.log(`   Saldo NATIVE:    ${ethers.formatEther(sub.nativeBalance)} ${cfg.nativeSymbol}`);
  console.log(`   Consumers:       ${sub.consumers.length === 0 ? "nenhum" : sub.consumers.join(", ")}`);
  console.log(`   Coordinator:     ${cfg.coordinator}`);

  console.log("\n──────────────────────────────────────────────────────");
  console.log("🔧 PRÓXIMOS PASSOS:");
  console.log(`   1. Copie o subscriptionId para o .env:`);
  console.log(`      ${net === "bscTestnet" ? "CHAINLINK_SUB_ID_BSC" : "CHAINLINK_SUB_ID_POLYGON"}=${subId}`);
  console.log(`   2. Execute o deploy dos contratos:`);
  console.log(`      npx hardhat run scripts/deploy-testnet.js --network ${net}`);
  console.log(`   3. Adicione o PackStore como consumer na subscription:`);
  console.log(`      npx hardhat run scripts/manage-vrf-consumer.js --network ${net}`);
  console.log("──────────────────────────────────────────────────────\n");
}

main().catch((e) => {
  console.error("\n❌ Erro:", e.message);
  process.exit(1);
});
