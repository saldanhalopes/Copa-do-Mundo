# AGENTS.md — Instruções para Agentes de IA

> **Se você é uma IA-agente lendo este repositório: comece aqui.**
> Este arquivo é o ponto de entrada. Ele diz o que é o projeto, como executá-lo
> do zero até funcionar, e como verificar cada passo. Siga o `RUNBOOK.md` na ordem.

## O que é este projeto

CryptoÁlbum Copa: plataforma de álbum de figurinhas da Copa em NFT (ERC-1155) +
jogo de cartas PvP. Stack: Solidity (contratos), Node (backend), Unity/React (cliente),
Docker (ambiente local). Prova de conceito — foco em **funcionar localmente**, não em produção.

## Sua missão

Levar o projeto do estado atual até **tudo funcionando em ambiente local**:
contratos deployados num nó local, metadados gerados, backend rodando, e o cliente
conectado e operante. Sem mainnet, sem dinheiro real, sem etapas que exijam humano.

## Regras de execução

1. **Leia `RUNBOOK.md` e execute os passos NA ORDEM.** Cada passo tem comando + verificação.
2. **Verifique cada passo antes de seguir.** Se a verificação falhar, consulte
   `docs/TROUBLESHOOTING-AGENT.md`, corrija, e só então avance.
3. **Não pule para mainnet nem ações pagas/irreversíveis.** Pare e reporte se um passo
   exigir isso (não deveria, neste runbook).
4. **Estado e progresso:** registre o que completou em `.agent/PROGRESS.md` (crie se não existir).
   Se você reiniciar, leia esse arquivo para saber onde parou.
5. **Idempotência:** todos os passos podem ser re-executados sem quebrar. Se algo já
   está feito, a verificação passa e você segue.

## Ordem de leitura (contexto)

Antes de executar, leia nesta ordem para entender o sistema:
1. `AGENTS.md` (este arquivo)
2. `RUNBOOK.md` (os passos)
3. `docs/INDEX.md` (mapa de toda a documentação)
4. `.planning/ROADMAP.md` (fases do projeto)
5. `docs/CONTRACTS-REFERENCE.md` + `docs/API-SPEC.md` (referências técnicas)

## Definição de "pronto" (Definition of Done)

O projeto está funcionando quando `RUNBOOK.md` passo "VERIFICAÇÃO FINAL" confirma:
- [ ] 8 contratos deployados no nó local (endereços em `deployments/local.json`)
- [ ] Metadados das 1.352 cartas gerados (`generator/output/metadata/`)
- [ ] Cartas configuradas on-chain (supply + atributos)
- [ ] Backend respondendo em `/health` e `/contracts`
- [ ] Teste end-to-end passa (`scripts/e2e-test.js`): comprar pacote → mint → ler carta
- [ ] Cliente (React ou Unity) conecta e lê o estado

## Ambiente

- Linux/macOS com Docker, Node 20+, Python 3.10+
- Se Docker não estiver disponível, use o modo "sem Docker" no RUNBOOK (seção alternativa)

## Quando parar e reportar

Pare e escreva um relatório em `.agent/REPORT.md` se:
- Um passo falhar e o troubleshooting não resolver após 3 tentativas
- Algo exigir credencial externa, pagamento, ou assinatura humana
- A verificação final não passar

Caso contrário: execute até o fim, atualize `.agent/PROGRESS.md`, e finalize com sucesso.
