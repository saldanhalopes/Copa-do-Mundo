using System;
using System.Collections.Generic;
using System.Numerics;
using System.Threading.Tasks;
using UnityEngine;
using CryptoAlbumCopa.Data;

// ChainSafe web3.unity SDK v3.x
// Instalar via Package Manager → Add via Git URL:
//   https://github.com/ChainSafe/web3.unity.git?path=/Packages/io.chainsafe.web3-unity
// Doc oficial: https://docs.gaming.chainsafe.io/
//
// v3 API (mudou em relação a v1/v2):
//   using ChainSafe.Gaming.UnityPackage;   // Web3Unity (antes: Web3Accessor)
//   using ChainSafe.Gaming.Web3;
//   using ChainSafe.Gaming.Evm.Contracts;
//   - signer.PublicAddress é SÍNCRONO (antes: await GetAddress())
//   - carteiras unificadas em um único modal
//   - classe EVM removida; usar web3.ErcXX.* ou ContractBuilder

namespace CryptoAlbumCopa.Web3Net
{
    /// <summary>
    /// Endereços dos contratos por rede. Preencher após o deploy (deploy-testnet.js).
    /// </summary>
    public static class ContractConfig
    {
        public struct Network
        {
            public int ChainId;
            public string Rpc;
            public string Figurinhas;   // ERC-1155
            public string CardStats;
            public string PackStore;
            public string MatchEscrow;
            public string Ranking;
            public string TradeDesk;
            public string Symbol;
        }

        public static readonly Network Polygon = new Network
        {
            ChainId = 137,
            Rpc = "https://polygon-rpc.com",
            Symbol = "POL",
            Figurinhas = "0x0000000000000000000000000000000000000000",
            CardStats = "0x0000000000000000000000000000000000000000",
            PackStore = "0x0000000000000000000000000000000000000000",
            MatchEscrow = "0x0000000000000000000000000000000000000000",
            Ranking = "0x0000000000000000000000000000000000000000",
            TradeDesk = "0x0000000000000000000000000000000000000000",
        };

        public static readonly Network Amoy = new Network
        {
            ChainId = 80002,
            Rpc = "https://rpc-amoy.polygon.technology",
            Symbol = "POL",
            // preencher após `npm run deploy:amoy`
            Figurinhas = "0x0000000000000000000000000000000000000000",
            CardStats = "0x0000000000000000000000000000000000000000",
            PackStore = "0x0000000000000000000000000000000000000000",
            MatchEscrow = "0x0000000000000000000000000000000000000000",
            Ranking = "0x0000000000000000000000000000000000000000",
            TradeDesk = "0x0000000000000000000000000000000000000000",
        };

        public static readonly Network Bnb = new Network
        {
            ChainId = 56,
            Rpc = "https://bsc-dataseed1.binance.org",
            Symbol = "BNB",
            Figurinhas = "0x0000000000000000000000000000000000000000",
            CardStats = "0x0000000000000000000000000000000000000000",
            PackStore = "0x0000000000000000000000000000000000000000",
            MatchEscrow = "0x0000000000000000000000000000000000000000",
            Ranking = "0x0000000000000000000000000000000000000000",
            TradeDesk = "0x0000000000000000000000000000000000000000",
        };
    }

    /// <summary>
    /// Camada de integração com a blockchain via ChainSafe Web3.unity.
    /// Responsável por: conectar carteira, ler NFTs da carteira (balanceOfBatch),
    /// comprar pacotes, criar/aceitar partidas, ler ELO.
    ///
    /// NOTA: os métodos abaixo mostram a estrutura e a chamada esperada ao SDK.
    /// As linhas com o SDK real ficam comentadas porque dependem do pacote
    /// ChainSafe instalado no projeto Unity. Substituir os stubs ao integrar.
    /// </summary>
    public class Web3Service : MonoBehaviour
    {
        public static Web3Service Instance { get; private set; }

        public ContractConfig.Network ActiveNetwork = ContractConfig.Amoy;
        public string ConnectedAddress { get; private set; }
        public bool IsConnected => !string.IsNullOrEmpty(ConnectedAddress);

        // private Web3 _web3; // instância ChainSafe

        void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        // ─── Conexão de carteira (ChainSafe v3) ───────────────────
        public async Task<bool> ConnectWallet()
        {
            try
            {
                // v3: Web3Unity é o ponto de entrada; modal unificado de carteira
                // _web3 = await Web3Unity.Instance.Connect();
                // ConnectedAddress = _web3.Signer.PublicAddress; // síncrono na v3

                await Task.Delay(400); // stub
                ConnectedAddress = "0x9aF2...b41"; // placeholder até integrar SDK
                Debug.Log($"[Web3] Conectado: {ConnectedAddress} @ chain {ActiveNetwork.ChainId}");
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"[Web3] Falha ao conectar: {e.Message}");
                return false;
            }
        }

        // ─── Ler NFTs da carteira (ERC-1155 balanceOfBatch) ───────
        /// <summary>
        /// Retorna os tokenIds que o usuário possui e a quantidade de cada.
        /// On-chain: chama balanceOfBatch no contrato FigurinhasCopa.
        /// </summary>
        public async Task<Dictionary<int, int>> LoadOwnedCards()
        {
            var owned = new Dictionary<int, int>();
            // var ids = Enumerable.Range(1, CardCatalog.Total).Select(i => new BigInteger(i)).ToArray();
            // var accounts = Enumerable.Repeat(ConnectedAddress, ids.Length).ToArray();
            // var balances = await contract.Call("balanceOfBatch", new object[]{ accounts, ids });
            // for (int i = 0; i < ids.Length; i++)
            //     if ((int)balances[i] > 0) owned[(int)ids[i]] = (int)balances[i];

            await Task.Delay(300); // stub
            Debug.Log("[Web3] LoadOwnedCards (stub) — integrar balanceOfBatch");
            return owned;
        }

        /// <summary>
        /// Lê os atributos imutáveis de uma carta do CardStats.sol (getCarta).
        /// </summary>
        public async Task<Attributes> LoadCardStats(int tokenId)
        {
            // var packed = await contract.Call("getPacked", new object[]{ new BigInteger(tokenId) });
            // return Attributes.Unpack((ulong)packed);
            await Task.Delay(50);
            var c = CardCatalog.Get(tokenId);
            return c?.Attrs ?? default;
        }

        // ─── Comprar pacote (PackStore.comprarPacote) ─────────────
        public async Task<string> BuyPack(int packType, BigInteger priceWei)
        {
            // var tx = await contract.Send("comprarPacote", new object[]{ packType }, value: priceWei);
            // return tx.TransactionHash;
            await Task.Delay(600);
            Debug.Log($"[Web3] BuyPack({packType}) — integrar comprarPacote + VRF callback");
            return "0xstub_tx_hash";
        }

        // ─── PvP (MatchEscrow) ────────────────────────────────────
        public async Task<string> CreateMatch(int[] team, BigInteger stakeWei)
        {
            // var tx = await contract.Send("criarPartida", new object[]{ team }, value: stakeWei);
            await Task.Delay(500);
            Debug.Log("[Web3] CreateMatch — integrar criarPartida");
            return "0xstub_match";
        }

        public async Task<string> AcceptMatch(int matchId, int[] team, BigInteger stakeWei)
        {
            await Task.Delay(500);
            Debug.Log($"[Web3] AcceptMatch({matchId}) — integrar aceitarPartida");
            return "0xstub_accept";
        }

        // ─── Ranking (RankingSeasons.getRating) ───────────────────
        public async Task<int> GetElo(string address)
        {
            // var elo = await contract.Call("getRating", new object[]{ address });
            // return (int)elo;
            await Task.Delay(100);
            return 1000;
        }

        // ─── Trocas (TradeDesk) ───────────────────────────────────
        public async Task<string> AcceptTrade(int offerId)
        {
            // var tx = await contract.Send("aceitarOferta", new object[]{ offerId });
            await Task.Delay(300);
            Debug.Log($"[Web3] AcceptTrade({offerId}) — integrar aceitarOferta (swap atômico)");
            return "0xstub_trade";
        }

        public async Task<string> CreateTrade(int[] giveIds, int[] wantIds)
        {
            // var tx = await contract.Send("criarOferta", new object[]{ giveIds, qtdsGive, wantIds, qtdsWant, address(0), duracao });
            await Task.Delay(300);
            Debug.Log("[Web3] CreateTrade — integrar criarOferta");
            return "0xstub_create_trade";
        }
    }
}
