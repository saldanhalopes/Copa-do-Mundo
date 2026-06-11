# RUNBOOK.md — Execução Autônoma (zero → funcionando)

> Para IA-agentes. Execute os passos NA ORDEM. Cada passo tem: **comando**,
> **verificação** (como saber que deu certo) e **se falhar**.
> Registre progresso em `.agent/PROGRESS.md` após cada passo.
>
> Meta: do repositório recém-clonado até o sistema funcionando localmente.

---

## Passo 0 — Pré-requisitos

**Comando:**
```bash
bash scripts/check-prereqs.sh
```
**Verificação:** imprime "✅ Todos os pré-requisitos OK".
**Se falhar:** instale o que faltar (Node 20+, Python 3.10+, Docker opcional). Veja a saída do script.

---

## Passo 1 — Instalar dependências

**Comando:**
```bash
npm install --legacy-peer-deps              # contratos (raiz)
cd backend && npm install && cd ..          # backend
pip install pillow --break-system-packages  # gerador de arte (opcional)
```
**Verificação:** `node_modules/` existe na raiz e em `backend/`.
**Se falhar:** ver `docs/TROUBLESHOOTING-AGENT.md` §deps.

---

## Passo 2 — Gerar o catálogo de cartas

**Comando:**
```bash
cd generator
python3 generate_catalog.py     # 1.352 cartas → output/catalogo.json + stats.json
python3 build_metadata.py       # → output/metadata/*.json
cd ..
```
**Verificação:**
```bash
test -f generator/output/catalogo.json && \
test -f generator/output/stats.json && \
ls generator/output/metadata/1.json && echo "OK"
```
Deve imprimir "OK" e o gerador deve reportar "1352 figurinhas".
**Se falhar:** confira Python 3 e que `generator/paises.py` existe.

---

## Passo 3 — Subir o ambiente

### Opção A — com Docker (recomendado)
**Comando:**
```bash
docker compose up -d --build
# aguarda o deployer terminar
docker compose logs deployer
```
**Verificação:**
```bash
docker compose exec backend cat /app/deployments/local.json | grep FigurinhasCopa
curl -s http://localhost:3001/health
```
Deve mostrar o endereço do contrato e `{"ok":true,...}`.

### Opção B — sem Docker (nó Hardhat manual)
**Comando:**
```bash
# terminal 1: nó local
npx hardhat node &
sleep 5
# terminal 2: deploy
npx hardhat run scripts/deploy-local.js --network localhost
```
**Verificação:**
```bash
test -f deployments/local.json && cat deployments/local.json | grep FigurinhasCopa
```
**Se falhar:** ver TROUBLESHOOTING §blockchain. Hardhat pode não baixar o compilador
em ambientes restritos — nesse caso, use o nó via Docker (Opção A) ou um solc local.

---

## Passo 4 — Semear os contratos (cartas + atributos)

**Comando:**
```bash
# com Docker:
docker compose run --rm deployer npx hardhat run scripts/seed-cards.js --network localhost
# sem Docker:
npx hardhat run scripts/seed-cards.js --network localhost
```
**Verificação:** o script imprime "✅ Seed completo".
**Se falhar:** confirme que o Passo 2 (catálogo) e Passo 3 (deploy) terminaram.

---

## Passo 5 — Teste end-to-end

**Comando:**
```bash
# com Docker:
docker compose run --rm deployer npx hardhat run scripts/e2e-test.js --network localhost
# sem Docker:
npx hardhat run scripts/e2e-test.js --network localhost
```
**Verificação:** imprime "✅ Sistema funcionando de ponta a ponta!" e "0 falharam".
**Se falhar:** o teste diz qual checagem falhou; volte ao passo correspondente.

---

## Passo 6 — Backend operante

**Comando:**
```bash
# com Docker já está rodando. Sem Docker:
cd backend && DEPLOYMENTS_PATH=../deployments/local.json npm start &
cd ..
```
**Verificação:**
```bash
curl -s http://localhost:3001/health      # {"ok":true,...}
curl -s http://localhost:3001/contracts   # endereços
```
**Se falhar:** ver TROUBLESHOOTING §backend.

---

## Passo 7 — Cliente conecta (escolha um)

### React (mais rápido de validar)
O protótipo `CryptoAlbumCopa.jsx` roda como artifact/standalone. Para conectar à chain
local, aponte o provider para `http://localhost:8545` (chainId 31337) e leia os endereços
de `/contracts`. Para PoC, o protótipo já funciona em modo demo.

### Unity (integração completa)
Siga `unity/UNITY-SPEC.md` §9: substitua os stubs em `Web3Service.cs` pelas chamadas
ChainSafe reais, configure a rede local (RPC `http://localhost:8545`, chainId 31337),
e use os endereços de `/contracts`. Ver `docs/AI-IMPLEMENTATION-GUIDE.md` §Unity para
o código exato a escrever.

**Verificação:** o cliente lista cartas e conecta carteira de teste.

---

## VERIFICAÇÃO FINAL (Definition of Done)

**Comando:**
```bash
bash scripts/verify-all.sh
```
**Verificação:** todos os itens marcam ✅:
- [ ] Catálogo + metadados gerados (1.352)
- [ ] Contratos deployados (deployments/local.json)
- [ ] Cartas configuradas + atributos on-chain
- [ ] Backend respondendo
- [ ] E2E passa

Se tudo passar: escreva `.agent/REPORT.md` com "SUCESSO" e a lista do que foi feito.
Se algo falhar após troubleshooting: escreva o bloqueio em `.agent/REPORT.md`.

---

## Mapa de scripts (referência rápida)

| Script | Faz |
|---|---|
| `scripts/check-prereqs.sh` | verifica ambiente |
| `generator/generate_catalog.py` | gera 1.352 cartas |
| `generator/build_metadata.py` | gera metadados JSON |
| `scripts/deploy-local.js` | deploya os 8 contratos |
| `scripts/seed-cards.js` | configura supply + atributos |
| `scripts/e2e-test.js` | teste de ponta a ponta |
| `scripts/verify-all.sh` | verificação final |
