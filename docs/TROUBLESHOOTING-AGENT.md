# 🔧 TROUBLESHOOTING-AGENT.md — Resolução de Problemas (para IA)

> Guia para uma IA-agente resolver falhas durante a execução do `RUNBOOK.md`.
> Cada seção: sintoma → causa provável → correção. Tente, verifique, siga.

---

## §deps — Instalação de dependências

**Sintoma:** `npm install` falha com peer dependency errors.
**Correção:**
```bash
npm install --legacy-peer-deps
```

**Sintoma:** `pip install pillow` falha com "externally-managed-environment".
**Correção:**
```bash
pip install pillow --break-system-packages
# ou crie um venv:
python3 -m venv .venv && source .venv/bin/activate && pip install pillow
```

**Sintoma:** Node muito antigo.
**Correção:** instale Node 20+ (nvm: `nvm install 20 && nvm use 20`).

---

## §blockchain — Nó local e deploy

**Sintoma:** `npx hardhat node` falha ao baixar o compilador solc.
**Causa:** ambiente sem acesso a binaries.soliditylang.org.
**Correção:**
- Use o modo Docker (RUNBOOK Passo 3 Opção A) — a imagem já traz tudo.
- OU configure solc local no hardhat.config.js apontando para um solc instalado via npm.

**Sintoma:** `deploy-local.js` falha em "VRFCoordinatorV2Mock não encontrado".
**Causa:** o mock do Chainlink não está nos contracts.
**Correção:** o script já tem fallback (usa address placeholder). O PackStore funciona
para mint direto; o sorteio VRF completo precisa do mock. Para PoC, o fallback basta.
Se quiser o mock: instale `@chainlink/contracts` e importe o mock no projeto.

**Sintoma:** "nonce too high" ou estado inconsistente.
**Correção:** reinicie o nó limpo:
```bash
docker compose down -v && docker compose up -d --build   # com Docker
# sem Docker: mate o `hardhat node` e suba de novo
```

**Sintoma:** deploy reverte em `configurarFigurinhas`.
**Causa:** lotes grandes demais (gas) ou ids duplicados.
**Correção:** o seed-cards.js já usa lotes de 200. Se reverter, reduza BATCH para 100.

---

## §backend — API e config

**Sintoma:** backend reinicia em loop / não acha contratos.
**Causa:** `deployments/local.json` ausente ou caminho errado.
**Correção:**
```bash
# confirme que o deploy rodou
cat deployments/local.json | grep FigurinhasCopa
# rode o deployer se faltar
docker compose run --rm deployer    # com Docker
npx hardhat run scripts/deploy-local.js --network localhost   # sem Docker
```

**Sintoma:** `/health` ok mas `/contracts` vazio.
**Causa:** `DEPLOYMENTS_PATH` não aponta para o arquivo certo.
**Correção (sem Docker):**
```bash
cd backend && DEPLOYMENTS_PATH=../deployments/local.json npm start
```

**Sintoma:** porta 3001 em uso.
**Correção:** `PORT=3002 npm start` ou mate o processo: `lsof -ti:3001 | xargs kill`.

---

## §catalogo — Gerador

**Sintoma:** `generate_catalog.py` reporta número ≠ 1352.
**Causa:** `paises.py` alterado (deve ter 48 países, 23 posições).
**Correção:** confirme `python3 paises.py` → "48 países, 23 jogadores cada".

**Sintoma:** `build_metadata.py` falha "catalogo.json não encontrado".
**Correção:** rode `generate_catalog.py` antes (gera o catálogo).

---

## §e2e — Teste end-to-end

**Sintoma:** "carta #1 tem OVR > 0" falha.
**Causa:** seed-cards.js não rodou (atributos não gravados).
**Correção:** rode o Passo 4 (seed) antes do Passo 5 (e2e).

**Sintoma:** "usuário recebeu carta #1" falha.
**Causa:** sem MINTER_ROLE.
**Correção:** o e2e-test.js já concede o role automaticamente. Se persistir,
confirme que o deploy fiou os roles (ver logs do deploy).

---

## §docker — Ambiente

**Sintoma:** `docker compose up` falha "daemon not running".
**Correção:** inicie o Docker. Se indisponível, use o modo "sem Docker" do RUNBOOK.

**Sintoma:** serviço fica "unhealthy".
**Correção:**
```bash
docker compose logs <servico>    # ver o erro
docker compose restart <servico>
```

**Sintoma:** falta de RAM/recursos.
**Correção:** suba menos serviços; o essencial para o PoC é `hardhat` + `deployer`.
Backend e DB podem rodar no host se necessário.

---

## Estratégia geral quando travar

1. Leia a mensagem de erro completa.
2. Identifique o passo do RUNBOOK que falhou.
3. Procure o sintoma aqui.
4. Aplique a correção, re-rode o passo, verifique.
5. Após 3 tentativas sem sucesso, escreva o bloqueio em `.agent/REPORT.md`
   com: passo, comando, erro completo, o que tentou.

> Lembre: todos os passos são idempotentes. Re-executar é seguro.
