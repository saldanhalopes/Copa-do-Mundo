# 🤖 AI-IMPLEMENTATION-GUIDE.md — Código Exato para Completar

> Guia para uma IA-agente completar as partes que hoje são **stubs**.
> Mostra exatamente qual código escrever, onde, e como verificar.

---

## 1. Web3Service.cs — sair dos stubs (Unity)

Os métodos em `unity/Assets/Scripts/Web3/Web3Service.cs` retornam valores fake.
Substitua pela integração ChainSafe v3 real. Pré-requisito: SDK instalado
(ver `unity/UNITY-SPEC.md` §3-4).

### ConnectWallet
```csharp
using ChainSafe.Gaming.UnityPackage;
using ChainSafe.Gaming.Web3;

public async Task<bool> ConnectWallet()
{
    try
    {
        var web3 = await Web3Unity.Instance.Connect(); // modal unificado
        _web3 = web3;
        ConnectedAddress = web3.Signer.PublicAddress;   // síncrono na v3
        return true;
    }
    catch (Exception e) { Debug.LogError(e); return false; }
}
```

### LoadOwnedCards (balanceOfBatch)
```csharp
public async Task<Dictionary<int,int>> LoadOwnedCards()
{
    var owned = new Dictionary<int,int>();
    int total = CardCatalog.Total;

    // monta arrays para balanceOfBatch
    var accounts = new string[total];
    var ids = new BigInteger[total];
    for (int i = 0; i < total; i++) { accounts[i] = ConnectedAddress; ids[i] = i + 1; }

    var contract = _web3.ContractBuilder.Build(ABI_FIGURINHAS, ActiveNetwork.Figurinhas);
    var result = await contract.Call("balanceOfBatch", new object[] { accounts, ids });
    var balances = (List<BigInteger>)result[0];

    for (int i = 0; i < total; i++)
        if (balances[i] > 0) owned[i + 1] = (int)balances[i];
    return owned;
}
```

### BuyPack (comprarPacote com value)
```csharp
public async Task<string> BuyPack(int packType, BigInteger priceWei)
{
    var contract = _web3.ContractBuilder.Build(ABI_PACKSTORE, ActiveNetwork.PackStore);
    var tx = await contract.Send("comprarPacote",
        new object[] { packType },
        new TransactionRequest { Value = priceWei });
    return tx.TransactionHash;
}
```

### LoadCardStats (CardStats → BigInteger → atributos)
```csharp
public async Task<Attributes> LoadCardStats(int tokenId)
{
    var contract = _web3.ContractBuilder.Build(ABI_CARDSTATS, ActiveNetwork.CardStats);
    var result = await contract.Call("getPacked", new object[] { new BigInteger(tokenId) });
    var (attrs, _, _, _) = Card.UnpackFull((BigInteger)result[0]);
    return attrs;
}
```

**ABIs:** gere com `npx hardhat compile`, copie de `artifacts/contracts/*/X.json`
(campo `abi`) para `Assets/Resources/ABIs/X.json`, carregue com
`Resources.Load<TextAsset>("ABIs/FigurinhasCopa")`.

**Verificação:** conectar carteira de teste → álbum mostra cartas reais da chain.

---

## 2. React — conectar à chain local

No `CryptoAlbumCopa.jsx`, troque o modo demo por leitura real:
```javascript
import { createPublicClient, http } from 'viem';

const client = createPublicClient({ transport: http('http://localhost:8545') });

// endereços do backend
const { contracts } = await fetch('http://localhost:3001/contracts').then(r => r.json());

// ler saldo em lote
const balances = await client.readContract({
  address: contracts.FigurinhasCopa,
  abi: FIGURINHAS_ABI,
  functionName: 'balanceOfBatch',
  args: [Array(1352).fill(userAddress), Array.from({length:1352}, (_,i)=>i+1)]
});
```

---

## 3. Ordem de implementação sugerida (para a IA)

```
1. npx hardhat compile          → gera ABIs
2. copiar ABIs para Resources/  (Unity) ou importar no React
3. implementar ConnectWallet    → testar conexão
4. implementar LoadOwnedCards   → testar leitura
5. implementar BuyPack          → testar compra (VRF mock entrega)
6. implementar Match (PvP)      → criar/aceitar partida
7. rodar e2e-test.js            → confirmar fluxo on-chain
```

---

## 4. Contratos: o que já está pronto vs a completar

| Item | Estado |
|---|---|
| Lógica dos 8 contratos | ✅ pronta, compila |
| Deploy local | ✅ `scripts/deploy-local.js` |
| Seed (cartas+atributos) | ✅ `scripts/seed-cards.js` |
| VRF mock | ⚠️ fallback; instalar `@chainlink/contracts` para sorteio completo |
| Integração cliente | ❌ stubs → este guia |

---

## 5. Critério de conclusão

A integração está completa quando:
- [ ] `scripts/e2e-test.js` passa (fluxo on-chain)
- [ ] Cliente conecta carteira de teste local
- [ ] Cliente lê cartas possuídas da chain (não do modo demo)
- [ ] Compra de pacote minta cartas reais na carteira
- [ ] `scripts/verify-all.sh` retorna tudo ✅

Quando tudo isso passar, a prova de conceito está **funcionando de ponta a ponta**.
