# Integração Binance — CryptoÁlbum Copa

Guia completo para publicar e operar a coleção no ecossistema Binance,
incorporando as boas práticas do guia oficial "Como criar e vender NFTs" (Binance Square).

---

## Por que BNB Chain + Binance?

| Critério | Polygon | BNB Chain |
|---|---|---|
| Custo por mint | ~$0,001–0,01 | ~$0,01–0,05 |
| Marketplace nativo | OpenSea, Magic Eden | **Binance NFT Marketplace** |
| Pagamento fiat | Crossmint, MoonPay | **Binance Pay** (integração nativa) |
| Base de usuários | Geral Web3 | **Forte na América Latina e Ásia** |
| VRF disponível | Chainlink | Binance Oracle |

**Estratégia adotada:** multi-chain. Polygon como rede principal (volume, DeFi) e BNB Chain como canal de distribuição Binance (aquisição de usuários Binance, liquidez no Binance NFT Marketplace).

---

## 1. Pré-requisitos Binance NFT

Conforme o guia oficial:

- **Verificação KYC completa** na Binance antes de submeter a coleção.
- Conta Binance NFT com pelo menos **10 seguidores** (exigência atual da plataforma).
- Selecionar BNB Smart Chain (chainId 56) na criação da coleção.

---

## 2. Configurando o contractURI para o Binance NFT Marketplace

O Binance NFT lê um arquivo `contractURI` para exibir os metadados da coleção.
Hospedar em IPFS e registrar no contrato:

```json
{
  "name": "CryptoÁlbum Copa",
  "description": "Álbum de figurinhas da Copa do Mundo em NFT. 680 figurinhas únicas em ERC-1155 na BNB Chain.",
  "image": "ipfs://QmXXX/cover.png",
  "external_link": "https://cryptoalbumcopa.com",
  "seller_fee_basis_points": 500,
  "fee_recipient": "0xSEU_ENDERECO_TESOURO"
}
```

Chamar no contrato após upload:
```solidity
figurinhasCopaBNB.setContractURI("ipfs://QmXXX/collection.json");
figurinhasCopaBNB.freezeMetadata(); // congela para sempre após verificar
```

---

## 3. Binance Pay — Fluxo de pagamento fiat

Binance Pay permite que o usuário pague com cartão, Pix ou saldo Binance,
recebendo os NFTs direto na carteira — sem nunca tocar em cripto manualmente.

```
Usuário no app CryptoÁlbum
    → clica "Comprar Pacote" com Binance Pay
    → redireciona para checkout Binance Pay (QR code ou deeplink)
    → Binance confirma o pagamento
    → nosso backend verifica via API Binance Pay
    → chama confirmarBinancePay() no contrato
    → VRF sorteia as figurinhas e minta na carteira do usuário
```

### Configuração Binance Pay

1. Criar conta em **merchants.binance.com**
2. Configurar webhook de confirmação:
   ```
   POST https://seubackend.com/binancepay/webhook
   Body: { merchantTradeNo, transactionId, status, buyerOpenId }
   ```
3. Verificar assinatura HMAC-SHA512 do webhook
4. Após verificação, chamar `confirmarBinancePay()` no contrato

### Exemplo de integração (backend Node.js)

```javascript
// webhook handler
app.post('/binancepay/webhook', async (req, res) => {
  const sig = req.headers['binancepay-signature'];
  if (!verifyHmac(req.body, sig, process.env.BINANCE_PAY_SECRET)) {
    return res.status(401).end();
  }

  const { merchantTradeNo, status, buyerOpenId } = req.body;
  if (status !== 'PAY_SUCCESS') return res.json({ returnCode: 'SUCCESS' });

  // Busca o endereço da carteira vinculado ao buyerOpenId
  const comprador = await db.getWalletByBinanceId(buyerOpenId);
  const tipoPacote = await db.getTipoPacoteByTradeNo(merchantTradeNo);

  // Chama o contrato
  const tx = await contractBNB.confirmarBinancePay(merchantTradeNo, comprador, tipoPacote);
  await tx.wait();

  res.json({ returnCode: 'SUCCESS' });
});
```

---

## 4. Trust Wallet — Configuração

Trust Wallet suporta tokens ERC-721 e ERC-1155 nativamente.
Para que as figurinhas apareçam automaticamente no Trust Wallet:

1. Submeter a coleção ao **Trust Wallet Assets** (GitHub open-source):
   ```
   https://github.com/trustwallet/assets
   ```
2. Adicionar pasta: `blockchains/smartchain/assets/0xSEU_CONTRATO/`
3. Incluir `logo.png` (256×256px) e `info.json`

```json
{
  "name": "CryptoÁlbum Copa",
  "website": "https://cryptoalbumcopa.com",
  "description": "Figurinhas NFT da Copa do Mundo",
  "explorer": "https://bscscan.com/token/0xSEU_CONTRATO",
  "type": "ERC1155",
  "symbol": "COPA",
  "decimals": 0,
  "status": "active",
  "tags": ["collectible", "nft", "sports"]
}
```

---

## 5. Listagem no Binance NFT Marketplace

Após o deploy e verificação KYC:

1. Acessar **nft.binance.com** → Perfil → Criado → Criar NFT
2. Selecionar rede: **BNB Smart Chain**
3. Selecionar coleção: **CryptoÁlbum Copa** (aparece pelo contractURI)
4. Definir preço mínimo de leilão ou preço fixo
5. Especificar royalties: **5%** (já registrado no ERC-2981 e no contractURI)
6. Assinar a transação na carteira (gás ~$0,01 na BNB Chain)

### Tipos de venda disponíveis no Binance NFT

| Tipo | Quando usar |
|---|---|
| Preço fixo | Figurinhas comuns / raras no mercado secundário |
| Leilão inglês | Figurinhas lendárias e míticas (preço sobe com lances) |
| Leilão holandês | Drops de edições especiais (preço cai até ser comprado) |
| Mystery Box | **Ideal para pacotes!** Binance tem interface nativa de Mystery Box |

> 💡 **Mystery Box da Binance NFT** é exatamente o modelo de pacote de figurinhas — o usuário compra sem saber o conteúdo. Considerar lançar pacotes como Mystery Boxes no marketplace para aproveitar o tráfego orgânico da Binance.

---

## 6. Checklist de lançamento na BNB Chain

- [ ] Deploy do `FigurinhasCopaBNB.sol` na BSC mainnet (chainId 56)
- [ ] Verificar contrato no BscScan (`npx hardhat verify --network bnb`)
- [ ] Configurar e congelar `contractURI` no IPFS
- [ ] Configurar `configurarFigurinhas()` com os 680 IDs
- [ ] Configurar pools por raridade
- [ ] Aprovação KYC na Binance NFT
- [ ] Configurar Binance Pay no merchants.binance.com
- [ ] Submeter logo ao Trust Wallet Assets
- [ ] Criar Mystery Boxes para pacotes no Binance NFT
- [ ] Testar fluxo completo na BSC testnet (chainId 97) antes do mainnet
