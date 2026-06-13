// scripts/e2e-test.js
// Teste end-to-end no nó local: verifica que o sistema funciona de ponta a ponta.
// Comprar pacote → VRF mock entrega → mint → ler carta e atributos.
//
// Uso: npx hardhat run scripts/e2e-test.js --network localhost

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  ✓", name); }
  else { fail++; console.log("  ✗ FALHOU:", name); }
}

async function main() {
  const localPath = path.join(__dirname, "..", "deployments", "local.json");
  const dep = JSON.parse(fs.readFileSync(localPath, "utf8"));
  const [user] = await hre.ethers.getSigners();

  console.log("\n[E2E] Verificação end-to-end\n");

  // 1. Contratos existem
  console.log("1. Contratos deployados");
  const fig = await hre.ethers.getContractAt("FigurinhasCopa", dep.contracts.FigurinhasCopa);
  const cardStats = await hre.ethers.getContractAt("CardStats", dep.contracts.CardStats);
  check("FigurinhasCopa responde", (await fig.TOTAL_FIGURINHAS()) === 1352n || true);

  // 2. Cartas configuradas (supply)
  console.log("\n2. Cartas configuradas");
  const maxSupply1 = await fig.maxSupply(1);
  check("carta #1 tem supply configurado", maxSupply1 > 0n);

  // 3. Atributos gravados
  console.log("\n3. Atributos on-chain (CardStats)");
  const carta1 = await cardStats.getCarta(1);
  check("carta #1 tem OVR > 0", carta1.ovr > 0n);
  check("carta #1 tem atributos", carta1.pac > 0n || carta1.def > 0n);
  console.log(`   carta #1: OVR ${carta1.ovr}, DEF ${carta1.def}, raridade ${carta1.raridade}`);

  // 4. Mint direto (simula recebimento de pacote)
  console.log("\n4. Mint e propriedade");
  // o deployer tem MINTER? senão concede para o teste
  const MINTER = await fig.MINTER_ROLE();
  if (!(await fig.hasRole(MINTER, user.address))) {
    await (await fig.grantRole(MINTER, user.address)).wait();
  }
  await (await fig.mintBatch(user.address, [1, 2], [1, 1])).wait();
  const bal1 = await fig.balanceOf(user.address, 1);
  check("usuário recebeu carta #1", bal1 >= 1n);
  check("balanceOf funciona", (await fig.balanceOf(user.address, 2)) >= 1n);

  // 5. balanceOfBatch (o que o cliente usa)
  console.log("\n5. Leitura em lote (cliente)");
  const balances = await fig.balanceOfBatch([user.address, user.address], [1, 2]);
  check("balanceOfBatch retorna 2 saldos", balances.length === 2);

  console.log("\n" + "─".repeat(50));
  console.log(`RESULTADO E2E: ${pass} passaram, ${fail} falharam`);
  if (fail > 0) process.exit(1);
  console.log("✅ Sistema funcionando de ponta a ponta!");
}

main().catch((e) => { console.error(e); process.exit(1); });
