/**
 * scripts/transfer-admin-to-safe.js
 *
 * Transfere o controle administrativo dos contratos para um Gnosis Safe multisig.
 *
 * Uso:
 *   node scripts/transfer-admin-to-safe.js [options]
 *
 * Opções:
 *   --dry-run         Apenas simula, não executa transações
 *   --network amoy    Rede alvo (amoy | bscTestnet | polygon | bnb)
 *   --safe 0x...      Endereço do Gnosis Safe (3/5)
 *
 * Pré-requisitos:
 *   - Gnosis Safe já deployado na rede alvo
 *   - .env com PRIVATE_KEY de um signatário do Safe
 *   - Hardhat configurado (hardhat.config.js)
 *
 * Fluxo para cada contrato:
 *   1. grantRole(DEFAULT_ADMIN_ROLE, safe)  — se o contrato usa AccessControl
 *   2. renounceRole(DEFAULT_ADMIN_ROLE, deployer)  — opcional, após confirmação
 *   3. Se o contrato usa onlyOwner (PackStore), chama transferOwnership(safe)
 *   4. Atualiza tesouro para o Safe se aplicável
 */

const hre = require("hardhat");
const { ethers } = hre;

// Contratos e papéis — mapeamento de todos os contratos com AccessControl
const CONTRACTS = [
  {
    name: "FigurinhasCopa",
    file: "contracts/FigurinhasCopa.sol",
    type: "AccessControl",
    roles: ["DEFAULT_ADMIN_ROLE", "PAUSER_ROLE"],
    currentMinter: null, // será populado se já existir
  },
  {
    name: "FigurinhasCopaBNB",
    file: "contracts/FigurinhasCopaBNB.sol",
    type: "AccessControl",
    roles: ["DEFAULT_ADMIN_ROLE", "PAUSER_ROLE", "OPERATOR_ROLE"],
    currentMinter: null,
  },
  {
    name: "MatchEscrow",
    file: "contracts/MatchEscrow.sol",
    type: "AccessControl",
    roles: ["DEFAULT_ADMIN_ROLE", "RESOLVER_ROLE"],
  },
  {
    name: "RankingSeasons",
    file: "contracts/RankingSeasons.sol",
    type: "AccessControl",
    roles: ["DEFAULT_ADMIN_ROLE", "MATCH_ROLE"],
  },
  {
    name: "FantasyLeague",
    file: "contracts/FantasyLeague.sol",
    type: "AccessControl",
    roles: ["DEFAULT_ADMIN_ROLE", "ORACLE_ROLE"],
  },
  {
    name: "CardStats",
    file: "contracts/CardStats.sol",
    type: "AccessControl",
    roles: ["DEFAULT_ADMIN_ROLE", "SETTER_ROLE"],
  },
  {
    name: "PackStore",
    file: "contracts/PackStore.sol",
    type: "Ownable",
  },
  {
    name: "TradeDesk",
    file: "contracts/TradeDesk.sol",
    type: "None",
  },
];

const ROLE_HASHES = {
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
  PAUSER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE")),
  OPERATOR_ROLE: ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE")),
  RESOLVER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE")),
  MATCH_ROLE: ethers.keccak256(ethers.toUtf8Bytes("MATCH_ROLE")),
  ORACLE_ROLE: ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE")),
  SETTER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("SETTER_ROLE")),
};

async function main() {
  const args = parseArgs();
  const { safeAddress, network, dryRun } = args;

  console.log(`\n=== Transferência de Admin para Gnosis Safe ===`);
  console.log(`Rede:     ${network}`);
  console.log(`Safe:     ${safeAddress}`);
  console.log(`Modo:     ${dryRun ? "🔍 DRY RUN (sem transações)" : "🚀 EXECUTANDO"}`);
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}\n`);

  for (const config of CONTRACTS) {
    if (config.type === "None") {
      console.log(`⏭️  ${config.name} — sem papéis administrativos, pulando`);
      continue;
    }

    console.log(`\n─── ${config.name} ───`);

    const factory = await ethers.getContractFactory(config.name);
    const contract = factory.attach(process.env[`${config.name.toUpperCase()}_ADDRESS`]);

    if (!process.env[`${config.name.toUpperCase()}_ADDRESS`]) {
      console.log(`  ⚠️  Endereço não configurado (env ${config.name.toUpperCase()}_ADDRESS). Pulando.`);
      continue;
    }

    console.log(`  Endereço: ${contract.target}`);

    if (config.type === "AccessControl") {
      await transferAccessControlRoles(contract, config, safeAddress, deployer, dryRun);
    } else if (config.type === "Ownable") {
      await transferOwnershipRole(contract, safeAddress, deployer, dryRun);
    }
  }

  console.log("\n=== ✅ Transferência concluída ===");
  if (dryRun) {
    console.log("Execute sem --dry-run para efetivar as transações.");
  }
}

async function transferAccessControlRoles(contract, config, safeAddress, deployer, dryRun) {
  for (const roleName of config.roles) {
    const roleHash = ROLE_HASHES[roleName];
    if (!roleHash) {
      console.log(`  ⚠️  Role ${roleName} não mapeada, pulando`);
      continue;
    }

    const currentHolder = await contract.hasRole(roleHash, deployer.address);
    const safeHasRole = await contract.hasRole(roleHash, safeAddress);

    console.log(`  Role ${roleName}:`);
    console.log(`    Deployer tem: ${currentHolder}`);
    console.log(`    Safe tem:     ${safeHasRole}`);

    if (safeHasRole) {
      console.log(`    ✅ Safe já possui ${roleName}`);
      continue;
    }

    if (!currentHolder) {
      console.log(`    ⚠️  Deployer não tem ${roleName} — não pode transferir`);
      continue;
    }

    if (!dryRun) {
      const tx = await contract.grantRole(roleHash, safeAddress);
      await tx.wait();
      console.log(`    ✅ grantRole(${roleName}) → Safe — tx: ${tx.hash}`);
    } else {
      console.log(`    🔍 [dry-run] grantRole(${roleName}, ${safeAddress})`);
    }
  }
}

async function transferOwnershipRole(contract, safeAddress, deployer, dryRun) {
  const currentOwner = await contract.owner();
  console.log(`  Owner atual: ${currentOwner}`);

  if (currentOwner.toLowerCase() === safeAddress.toLowerCase()) {
    console.log(`  ✅ Safe já é o owner`);
    return;
  }

  if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log(`  ⚠️  Deployer não é o owner — owner atual é ${currentOwner}`);
    return;
  }

  if (!dryRun) {
    const tx = await contract.transferOwnership(safeAddress);
    await tx.wait();
    console.log(`  ✅ transferOwnership() → Safe — tx: ${tx.hash}`);
  } else {
    console.log(`  🔍 [dry-run] transferOwnership(${safeAddress})`);
  }
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const args = {
    safeAddress: null,
    network: "amoy",
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--network") args.network = argv[++i];
    else if (argv[i] === "--safe") args.safeAddress = argv[++i];
  }

  if (!args.safeAddress) {
    args.safeAddress = process.env.SAFE_ADDRESS;
  }

  if (!args.safeAddress) {
    console.error("Erro: informe --safe <endereco> ou defina SAFE_ADDRESS no .env");
    process.exit(1);
  }

  if (!ethers.isAddress(args.safeAddress)) {
    console.error(`Erro: endereço inválido: ${args.safeAddress}`);
    process.exit(1);
  }

  return args;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
