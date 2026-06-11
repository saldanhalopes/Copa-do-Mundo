// scripts/manage-vrf-consumer.js
// Adiciona ou remove um consumer (contrato PackStore) de uma subscription VRF v2.5.
//
// Uso:
//   Adicionar consumer após deploy:
//     npx hardhat run scripts/manage-vrf-consumer.js --network amoy
//     npx hardhat run scripts/manage-vrf-consumer.js --network bscTestnet
//
//   Remover consumer:
//     ACTION=remove npx hardhat run scripts/manage-vrf-consumer.js --network amoy
//
// Pré-requisitos:
//   - .env com PRIVATE_KEY (precisa ser owner da subscription)
//   - CHAINLINK_SUB_ID_POLYGON ou CHAINLINK_SUB_ID_BSC definido
//   - Ter o endereço do PackStore (passar via env CONSUMER_ADDRESS ou
//     ler do arquivo deployments/<network>.json)

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const VRF_COORDINATORS = {
  amoy:       "0x343300b5d84D444B2ADc9116FEF1bED02BE49Cf2",
  bscTestnet: "0xDA3b641D438362C440Ac5458c57e00a712b66700",
};

async function main() {
  const net = network.name;
  const coordinatorAddr = VRF_COORDINATORS[net];
  if (!coordinatorAddr) {
    throw new Error(`Rede '${net}' não suportada.`);
  }

  const action = (process.env.ACTION || "add").toLowerCase();
  if (!["add", "remove"].includes(action)) {
    throw new Error("ACTION deve ser 'add' ou 'remove'");
  }

  const subId = net === "bscTestnet"
    ? process.env.CHAINLINK_SUB_ID_BSC
    : process.env.CHAINLINK_SUB_ID_POLYGON;

  if (!subId) {
    throw new Error(
      `Variável CHAINLINK_SUB_ID_${net === "bscTestnet" ? "BSC" : "POLYGON"} não definida no .env`
    );
  }

  // Endereço do consumer: prioriza env CONSUMER_ADDRESS, depois
  // tenta ler do deployments/<network>.json, depois solicita input
  let consumerAddr = process.env.CONSUMER_ADDRESS;
  if (!consumerAddr) {
    const deployFile = path.resolve(__dirname, "..", "deployments", `${net}.json`);
    if (fs.existsSync(deployFile)) {
      const deployData = JSON.parse(fs.readFileSync(deployFile, "utf8"));
      consumerAddr = deployData.contracts?.PackStore;
    }
  }
  if (!consumerAddr) {
    throw new Error(
      "Endereço do PackStore não encontrado. Defina CONSUMER_ADDRESS no .env " +
      "ou execute o deploy primeiro para gerar deployments/<network>.json"
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log(`\n🌐 Rede: ${net}`);
  console.log(`   Owner wallet: ${deployer.address}`);
  console.log(`   Subscription: ${subId}`);
  console.log(`   Consumer:     ${consumerAddr}`);
  console.log(`   Ação:         ${action === "add" ? "Adicionar" : "Remover"} consumer\n`);

  const abi = [
    "function addConsumer(uint256 subId, address consumer) external",
    "function removeConsumer(uint256 subId, address consumer) external",
    "function getSubscription(uint256 subId) external view returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address owner, address[] memory consumers)",
  ];
  const coordinator = new ethers.Contract(coordinatorAddr, abi, deployer);

  if (action === "add") {
    console.log("🔗 Adicionando PackStore como consumer...");
    const tx = await coordinator.addConsumer(subId, consumerAddr);
    await tx.wait();
    console.log("   ✅ Consumer adicionado!\n");
  } else {
    console.log("🔗 Removendo consumer...");
    const tx = await coordinator.removeConsumer(subId, consumerAddr);
    await tx.wait();
    console.log("   ✅ Consumer removido!\n");
  }

  const sub = await coordinator.getSubscription(subId);
  console.log("📋 Status da subscription:");
  console.log(`   ID:              ${subId}`);
  console.log(`   Owner:           ${sub.owner}`);
  console.log(`   Saldo NATIVE:    ${ethers.formatEther(sub.nativeBalance)}`);
  console.log(`   Consumers:       ${sub.consumers.join(", ")}`);
  console.log();
}

main().catch((e) => {
  console.error("\n❌ Erro:", e.message);
  process.exit(1);
});
