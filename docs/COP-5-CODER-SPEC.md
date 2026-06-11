# COP-5: Unity ↔ Blockchain Integration — Coder Spec

**Status:** Draft (blocked on COP-4)
**Owner for execution:** Coder agent (once COP-4 delivers testnet addresses)
**Reviewer:** CTO

---

## Overview

Replace simulated/placeholder calls in `Unity/Assets/Scripts/Web3/Web3Service.cs` with real calls via **ChainSafe Web3 Unity SDK** (`Chainsafe.Web3Unity`).

Current state: all methods are stubs returning mock data. After this spec is implemented, every method makes real contract calls via the user's connected wallet.

---

## Prerequisites

1. COP-4 must complete, providing deployed contract addresses on Amoy testnet
2. Fill `ContractConfig.Amoy` addresses in `Web3Service.cs` (lines 42-53)
3. Regenerate ABI JSONs: `cp artifacts/contracts/*.json unity/Assets/Resources/ABIs/`
4. Install NuGet: `com.chainsafe.web3unity` (latest stable)

---

## Implementation Tasks

### T1: Wallet Connection — `ConnectWallet()` / `DisconnectWallet()`

**File:** `Web3Service.cs:126-149`

**Current stub:** returns hardcoded `"0x9aF2...b41"`

**Replace with:** ChainSafe WalletConnect flow

```
- Use Web3Unity.WalletConnect connector
- On connect: set _connectedAddress from accounts[0]
- On disconnect: clear _connectedAddress, disconnect WalletConnect session
- Platform: mobile uses deep-link WalletConnect; desktop uses QR modal
- Store reconnect session (PlayerPrefs) so users don't re-auth every launch
```

**Events to emit:**
- `OnWalletConnected(string address)`
- `OnWalletDisconnected()`

**Error states:** User rejects connection, network mismatch, session expired

### T2: Read NFT Balances — `ReadBalanceOf()` / `LoadOwnedCards()`

**File:** `Web3Service.cs:183-235`

**Current stub:** `ReadBalanceOf` returns 0; `LoadOwnedCards` calls it in a loop

**Contract:** `FigurinhasCopa` (ERC-1155)

**Replace `ReadBalanceOf` with:**
```
var contract = new Contract(AbiFor("FigurinhasCopa"), AddressFor("FigurinhasCopa"));
var balance = await contract.Call("balanceOf", new object[] { owner, tokenId });
return BigInteger.Parse(balance[0].ToString());
```

**Optimize `LoadOwnedCards`:** Instead of 680 individual `balanceOf` calls, use `balanceOfBatch` if supported by the SDK. If not, batch calls in groups of 50 with `Task.WhenAll` and a 100ms throttle between batches.

**Error states:** RPC timeout, contract not found, user on wrong network

### T3: Read Card Stats — `LoadCardStats()`

**File:** `Web3Service.cs:239-260`

**Current stub:** falls back to local `CardCatalog.Get(tokenId)`

**Contract:** `CardStats` — function `getCarta(uint256 tokenId) returns (Carta)`

**Replace with:**
```
var contract = new Contract(AbiFor("CardStats"), AddressFor("CardStats"));
var result = await contract.Call("getCarta", new object[] { tokenId });
// result[0] = Carta struct with uint8 fields: pac, sho, pas, dri, def, phy, ovr, posicao, raridade, selecao
```

**Fallback:** If contract call fails or contract is not deployed, fall back to `CardCatalog.Get(tokenId)`.

### T4: Buy Pack — `BuyPack()`

**File:** `Web3Service.cs:264-294`

**Current stub:** simulates with delay, returns random hash

**Contract:** `PackStore` — function `comprarPacote(uint8 tipo)` (payable)

**Replace with:**
```
var contract = new Contract(AbiFor("PackStore"), AddressFor("PackStore"));
var tx = await contract.Send("comprarPacote", new object[] { packType }, new TransactionOverrides { Value = priceWei });
return tx.TransactionHash;
```

**Pre-flight checks before sending tx:**
- `ageVerified` check (query PackStore contract)
- Wallet has enough native currency for gas + price

### T5: PvP Match — `CreateMatch()` / `AcceptMatch()`

**File:** `Web3Service.cs:298-353`

**Contract:** `MatchEscrow`

**`CreateMatch`** calls: `criarPartida(uint256[CARTAS_POR_TIME] time)` — non-payable for stake=0, payable(msg.value=stake) for stake>0

**`AcceptMatch`** calls: `aceitarPartida(uint256 id, uint256[CARTAS_POR_TIME] time)` — payable with stake if > 0

**Pre-flight checks:**
- Verify user owns all 5 cards (balanceOf check)
- For staked matches: verify age (`ageVerified` mapping)
- For staked matches: verify geolocation allows staking

**Events:** Subscribe to `PartidaCriada` / `PartidaResolvida` / `PartidaAceita` for real-time updates

### T6: Ranking — `GetElo()`

**File:** `Web3Service.cs:357-374`

**Current stub:** returns 1000

**Contract:** `RankingSeasons` — function `getRating(address) returns (uint256)`

**Replace with:**
```
var contract = new Contract(AbiFor("RankingSeasons"), AddressFor("Ranking"));
var result = await contract.Call("getRating", new object[] { address });
return int.Parse(result[0].ToString());
```

### T7: Trades — `CreateTrade()` / `AcceptTrade()`

**File:** `Web3Service.cs:378-430`

**Contract:** `TradeDesk`

**`CreateTrade`** calls: `criarOferta(idsOferecidos, qtdOferecidas, idsPedidos, qtdPedidas, destinatario, duracaoSegundos)`
- `destinatario` = address(0) for public offers
- `duracaoSegundos` = 86400 (24h)

**`AcceptTrade`** calls: `aceitarOferta(uint256 id)`

**Pre-flight:** User must have called `setApprovalForAll(TradeDesk, true)` on FigurinhasCopa before creating/accepting trades. If not approved, prompt for approval tx first.

---

## Acceptance Criteria

- [ ] WalletConnect flow works on Android + iOS + WebGL (desktop QR + mobile deep-link)
- [ ] `balanceOfBatch` loads all 680 cards in < 5 seconds on mainnet RPC
- [ ] Card stats read from chain with local fallback when chain unavailable
- [ ] Pack purchase flow: connect → select pack → approve tx → wait for VRF → see opened cards
- [ ] PvP match flow: create match → opponent accepts → battle resolves → ELO updates
- [ ] Trade flow: create offer → another user accepts → atomic swap executes
- [ ] All stubs removed; no mock addresses or simulated delays remain
- [ ] Error states handled gracefully with user-facing snackbar messages (not raw exceptions)
- [ ] Network switching (Amoy ↔ Polygon ↔ BNB) clears connection state and resets UI

---

## Contract Interface Reference

| Contract | Function | Type | Parameters |
|----------|----------|------|------------|
| FigurinhasCopa | `balanceOf(account, id)` | read | `address, uint256` |
| FigurinhasCopa | `balanceOfBatch(accounts, ids)` | read | `address[], uint256[]` |
| FigurinhasCopa | `setApprovalForAll(operator, approved)` | write | `address, bool` |
| CardStats | `getCarta(tokenId)` | read | `uint256 → Carta struct` |
| PackStore | `comprarPacote(tipo)` | write (payable) | `uint8` |
| MatchEscrow | `criarPartida(time)` | write (payable) | `uint256[5]` |
| MatchEscrow | `aceitarPartida(id, time)` | write (payable) | `uint256, uint256[5]` |
| RankingSeasons | `getRating(jogador)` | read | `address → uint256` |
| TradeDesk | `criarOferta(...)` | write | see TradeDesk.sol:45 |
| TradeDesk | `aceitarOferta(id)` | write | `uint256` |
| TradeDesk | `lerOferta(id)` | read | `uint256 → Oferta struct` |

---

## Review Cycle

1. Coder implements all 7 tasks
2. CTO reviews the PR — focused on error handling, gas optimization, and UX edge cases
3. QA tests with real Amoy testnet after COP-4 deploy
4. CTO signs off before merging
