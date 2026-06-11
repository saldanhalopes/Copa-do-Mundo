# Jurídico e Conformidade — CryptoÁlbum Copa

Análise dos riscos legais e o que é preciso resolver antes do lançamento comercial.
**Aviso:** este documento é um guia técnico, não aconselhamento jurídico. Contrate
advogados especializados em cada jurisdição-alvo antes de operar.

---

## 1. Propriedade Intelectual (BLOQUEADOR CRÍTICO)

O maior risco do projeto. Há marcas e direitos de imagem envolvidos:

| Elemento | Detentor do direito | Risco |
|---|---|---|
| "Copa do Mundo FIFA", logo, troféu | FIFA | Altíssimo |
| Nomes/imagens de jogadores reais | FIFPro + clubes + atletas | Altíssimo |
| Escudos de seleções | Federações nacionais | Alto |
| Nomes de estádios reais | Proprietários/patrocinadores | Médio |

### Dois caminhos possíveis

**Caminho A — Licenciamento oficial**
- Negociar licença com a FIFA (caríssimo, geralmente exclusivo, concorre com EA/Panini)
- Licença FIFPro para imagem dos jogadores
- Inviável para um projeto independente no início

**Caminho B — Arte original / domínio genérico (RECOMENDADO para MVP)**
- Jogadores **fictícios** (já implementado: o gerador usa nomes inventados)
- Evitar "Copa do Mundo FIFA" → usar "Torneio Mundial de Futebol 2026" ou marca própria
- Seleções por **cores e siglas genéricas**, sem escudos oficiais
- Mascotes e arte 100% originais
- **Este é o caminho atual do projeto** — por isso os jogadores são fictícios

> Decisão de produto: validar o jogo com arte original. Buscar licenças só após tração.

---

## 2. Loot Boxes e Jogos de Azar

Os **pacotes** (compra sem saber o conteúdo) e o **PvP com aposta** podem ser
enquadrados como jogo de azar em várias jurisdições.

### Pacotes (loot boxes)
| País/Região | Situação |
|---|---|
| Bélgica, Holanda | Loot boxes pagas com itens de valor = proibidas/restritas |
| Brasil | Zona cinzenta; exibir probabilidades é boa prática |
| China | Exige divulgação obrigatória das probabilidades |
| EUA | Varia por estado; pressão regulatória crescente |

**Mitigações já no design:**
- Probabilidades **públicas e on-chain** (o `PackStore` tem a tabela verificável)
- Considerar venda direta de cartas avulsas como alternativa
- Restringir venda de pacotes em jurisdições onde forem proibidos (geofencing)

### PvP com aposta (stake)
- Apostar dinheiro em resultado de jogo pode ser **gambling regulado**
- O fato de o resultado depender de **atributos + habilidade de escalação** ajuda
  a argumentar "jogo de habilidade" (skill-based), mas não elimina o risco
- **Mitigações:** modo sem aposta como padrão; aposta só onde for legal;
  possível licença de gambling em alguns mercados

---

## 3. Valores Mobiliários (Securities)

Risco de os NFTs/tokens serem classificados como valores mobiliários.

- **Cartas como colecionáveis/utilidade:** menor risco — são itens de jogo com uso
  (jogar, colecionar), não promessa de lucro passivo
- **Evitar:** prometer valorização, "investimento", retorno garantido, dividendos
- **Token $FIGO (fase 2):** alto risco se mal estruturado — adiar até ter parecer
- **Teste de Howey (EUA):** investimento + expectativa de lucro + esforço de terceiros
  → estruturar para falhar nesse teste (sem promessa de lucro)

### Brasil
- Lei 14.478/2022 (marco legal dos criptoativos)
- CVM: se houver característica de investimento coletivo → competência da CVM
- Manter comunicação focada em "jogo" e "colecionável", nunca "investimento"

---

## 4. KYC / AML (Lavagem de Dinheiro)

Obrigatório no **on-ramp fiat** (quando o usuário paga com cartão/Pix).

- Delegar KYC ao provedor de pagamento (Crossmint, MoonPay, Binance Pay já fazem)
- Limites de transação sem KYC (varia por jurisdição)
- Monitoramento de transações suspeitas
- Marketplace secundário: atenção a wash trading e lavagem via NFTs

---

## 5. Proteção de Dados (LGPD / GDPR)

| Lei | Região | Requisito |
|---|---|---|
| LGPD | Brasil | Consentimento, finalidade, direito de exclusão |
| GDPR | UE | Idem + DPO se escala grande |
| COPPA | EUA | Proteção de menores de 13 anos |

- Coletar o mínimo de dados (privacy by design)
- Política de privacidade e termos de uso claros
- Carteira embedded (email/Google) cria dados pessoais → tratar conforme LGPD
- Endereços de carteira podem ser dados pessoais sob GDPR

---

## 6. Menores de Idade

Jogo com compras e apostas exige cuidado redobrado:

- Verificação de idade no cadastro
- PvP com aposta: **bloquear para menores** (gambling)
- Compras: controle parental / limites
- COPPA (EUA): proibido coletar dados de <13 anos sem consentimento parental

---

## 7. Termos de Uso e Riscos (a redigir)

Documentos obrigatórios antes do lançamento:
- [ ] Termos de Uso (incl. natureza dos NFTs, não-garantia de valor)
- [ ] Política de Privacidade (LGPD/GDPR)
- [ ] Regras do jogo e probabilidades dos pacotes
- [ ] Disclaimer de risco (volatilidade cripto, perda de cartas)
- [ ] Política de reembolso e disputas

---

## 8. Checklist pré-lançamento

| Item | Status no projeto |
|---|---|
| Arte original (sem IP de terceiros) | ✅ jogadores fictícios |
| Probabilidades públicas | ✅ on-chain no PackStore |
| Auditoria dos contratos | ❌ pendente (CertiK/Hacken) |
| Parecer jurídico por jurisdição | ❌ pendente |
| Modo sem aposta como padrão | ⚠️ implementar |
| Geofencing (bloqueio regional) | ❌ pendente |
| KYC no on-ramp | ⚠️ delegado ao provedor |
| Termos + Privacidade | ❌ pendente |
| Verificação de idade | ❌ pendente |

---

## Recomendação de fase de lançamento

1. **Soft launch (testnet):** sem dinheiro real, arte original, foco em validar o jogo
2. **Beta (mainnet, sem aposta):** cartas e trocas reais, PvP só por glória/ranking
3. **Launch completo:** com aposta apenas em jurisdições aprovadas, após auditoria
   e pareceres jurídicos
