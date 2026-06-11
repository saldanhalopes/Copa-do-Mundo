# 🔐 SECURITY-OPS.md — Segurança & Operações
### CryptoÁlbum Copa

> Threat model, gestão de chaves, monitoramento e runbook de incidentes.

---

## 1. Threat Model

### Atores e ativos
| Ativo | Valor | Ameaça |
|---|---|---|
| Cartas NFT dos usuários | Alto | roubo, mint fraudulento |
| Fundos em escrow (PvP) | Alto | drenagem, reentrancy |
| Tesouro/royalties | Alto | acesso indevido |
| Chaves admin | Crítico | comprometimento total |
| Metadados/arte | Médio | alteração (mitigado por freeze) |

### Superfícies de ataque
```
┌─────────────┐
│   Usuário   │ ← phishing, carteira comprometida
└──────┬──────┘
       │
┌──────▼──────┐
│   Cliente   │ ← código malicioso, MITM
└──────┬──────┘
       │
┌──────▼──────┐
│   Backend   │ ← injection, DDoS, webhook spoofing
└──────┬──────┘
       │
┌──────▼──────┐
│  Contratos  │ ← reentrancy, overflow, acesso indevido, VRF manipulation
└─────────────┘
```

---

## 2. Defesas por camada

### Smart Contracts
- `ReentrancyGuard` em toda função com valor
- Checks-Effects-Interactions
- `AccessControl` + roles mínimos
- `Pausable` para emergência
- Supply/metadados imutáveis (`freeze*`)
- Aleatoriedade via VRF (não manipulável)
- Auditoria externa + bug bounty (Immunefi)

### Backend
- Validação de schema em todo input
- Verificação HMAC nos webhooks
- Rate limiting + Cloudflare (DDoS)
- Nenhuma chave privada armazenada
- Princípio do menor privilégio (DB, infra)
- Secrets em vault (não em código)

### Cliente
- Nunca expor seed phrase
- Confirmar transações com o usuário
- Validar dados on-chain (não confiar no backend)
- Code obfuscation (IL2CPP)

---

## 3. Gestão de chaves & Multisig

### Gnosis Safe 3-de-5
```
Signatários: 3 founders + 2 advisors técnicos
Threshold:   3 assinaturas para executar
```

**Controla:**
- `DEFAULT_ADMIN_ROLE` de todos os contratos
- `PAUSER_ROLE`
- Endereço de tesouro/royalties

**Migração (Fase 1):**
1. Deploy dos contratos (admin = deployer temporário)
2. Criar o Safe 3/5
3. `transfer-admin-to-safe.js` move todos os roles
4. Renunciar role do deployer
5. Verificar: deployer não tem mais permissão

### Chaves operacionais (separadas do admin)
- **Resolver** (resolve partidas): hot wallet com fundos mínimos, rotacionável
- **Oracle** (registra desempenho): idem
- **Deploy**: hardware wallet, usada só em deploys

---

## 4. Monitoramento

### Alertas on-chain
| Evento | Ação |
|---|---|
| Pausa de contrato acionada | notificar time imediatamente |
| Transferência grande do tesouro | alerta + verificação |
| Falha repetida de VRF | investigar coordinator |
| Mint anômalo (volume) | possível exploit |

### Métricas de infra
- Uptime da API e WebSocket
- Latência de matchmaking
- Erros 5xx
- Lag do indexer vs chain head
- Saúde do RPC (Chainstack)

### Ferramentas sugeridas
- On-chain: Tenderly (alertas), Defender (OpenZeppelin)
- Infra: Grafana + Prometheus, Sentry (erros)
- Logs: centralizados, retenção adequada (LGPD)

---

## 5. Runbook de Incidentes

### Severidade & resposta
| Nível | Exemplo | Resposta |
|---|---|---|
| SEV-1 | Exploit ativo, fundos em risco | pausar contratos AGORA |
| SEV-2 | Bug crítico sem exploit ativo | hotfix prioritário |
| SEV-3 | Degradação de serviço | investigar, comunicar |
| SEV-4 | Bug menor | backlog |

### Procedimento SEV-1 (exploit)
```
1. PAUSAR contratos afetados (Safe → pause())
2. Comunicar o time (canal de incidente)
3. Avaliar escopo (quanto/o que foi afetado)
4. Comunicar usuários (transparência)
5. Corrigir (patch / migração)
6. Post-mortem público
```

> Como pausar exige 3 assinaturas do Safe, ter os signatários disponíveis é crítico.
> Considerar um `PAUSER_ROLE` operacional separado (hot wallet) para resposta rápida,
> com o admin (Safe) podendo revogar.

---

## 6. Conformidade operacional

| Área | Controle |
|---|---|
| KYC/AML | delegado ao provedor de pagamento (Crossmint/Binance/MoonPay) |
| Geofencing | bloquear pacotes/apostas onde ilegal (ver JURIDICO) |
| Idade | verificação no cadastro; PvP-aposta só +18 |
| LGPD/GDPR | mínimo de dados, direito de exclusão, consentimento |
| Logs | retenção limitada, anonimização quando possível |

---

## 7. Backup & Recuperação

| Ativo | Estratégia |
|---|---|
| Arte/metadados | IPFS (Pinata) + Arweave (permanente) |
| Banco (trocas, usuários) | backup diário + point-in-time recovery |
| Configuração de contratos | documentada e versionada (deploy scripts) |
| Chaves | hardware wallets + backup seguro offline |

> As cartas NFT em si **não precisam de backup** — vivem na blockchain.
> Por isso a arte em Arweave é crítica: garante a imagem mesmo se a empresa sumir.

---

## 8. Checklist de segurança pré-mainnet

- [ ] Auditoria externa concluída, issues críticas/altas resolvidas
- [ ] Bug bounty publicado (Immunefi)
- [ ] Admin migrado para Gnosis Safe 3/5
- [ ] Deployer sem roles residuais
- [ ] Análise estática (Slither/Mythril) limpa
- [ ] Monitoramento e alertas configurados (Tenderly/Defender)
- [ ] Runbook de incidentes documentado e testado
- [ ] Signatários do Safe disponíveis e treinados
- [ ] Secrets em vault, não em código
- [ ] Webhooks com verificação de assinatura
- [ ] Rate limiting e DDoS protection ativos
- [ ] Backup de arte no Arweave confirmado

---

## 9. Política de divulgação responsável

- Canal de segurança: security@cryptoalbumcopa.com
- Bug bounty no Immunefi com recompensas por severidade
- Não divulgar exploits publicamente antes do patch
- Reconhecimento aos pesquisadores (hall of fame)
