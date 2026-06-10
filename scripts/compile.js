// scripts/compile.js — compila os contratos com solc (resolvendo imports de node_modules)
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const ROOT = path.join(__dirname, "..");
const CONTRACTS = path.join(ROOT, "contracts");
const NM = path.join(ROOT, "node_modules");

// Resolve import: node_modules primeiro, depois contracts/
function findImport(importPath) {
  const candidates = [
    path.join(NM, importPath),
    path.join(CONTRACTS, importPath),
    path.join(ROOT, importPath),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return { contents: fs.readFileSync(c, "utf8") };
  }
  return { error: "Not found: " + importPath };
}

const arquivos = fs.readdirSync(CONTRACTS).filter((f) => f.endsWith(".sol"));
const sources = {};
for (const f of arquivos) {
  sources[f] = { content: fs.readFileSync(path.join(CONTRACTS, f), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));

let erros = 0, warnings = 0;
if (output.errors) {
  for (const e of output.errors) {
    if (e.severity === "error") { erros++; console.log("❌", e.formattedMessage); }
    else warnings++;
  }
}

if (erros === 0) {
  console.log(`\n✅ Compilação OK — ${arquivos.length} contratos, ${warnings} warnings`);
  // salva artefatos
  const outDir = path.join(ROOT, "artifacts");
  fs.mkdirSync(outDir, { recursive: true });
  for (const file in output.contracts) {
    for (const name in output.contracts[file]) {
      const c = output.contracts[file][name];
      fs.writeFileSync(
        path.join(outDir, name + ".json"),
        JSON.stringify({ abi: c.abi, bytecode: c.evm.bytecode.object }, null, 2)
      );
    }
  }
  console.log("   Artefatos salvos em artifacts/");
  // resumo de tamanho de bytecode (limite EIP-170: 24576 bytes)
  console.log("\n   Tamanho do bytecode (limite 24KB):");
  for (const file in output.contracts) {
    for (const name in output.contracts[file]) {
      const bc = output.contracts[file][name].evm.bytecode.object;
      if (bc.length > 0) {
        const kb = (bc.length / 2 / 1024).toFixed(1);
        const ok = bc.length / 2 <= 24576 ? "✓" : "⚠ EXCEDE";
        console.log(`   ${ok} ${name}: ${kb} KB`);
      }
    }
  }
} else {
  console.log(`\n❌ ${erros} erro(s) de compilação`);
  process.exit(1);
}
