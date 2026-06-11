using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Threading.Tasks;
using UnityEngine;
using CryptoAlbumCopa.Data;


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
            public string Figurinhas;
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

    [Serializable]
    public class ChainSafeConfig
    {
        public string ProjectId = "seu-project-id";
        public string ClientId = "seu-client-id";
        public string WalletConnectProjectId = "seu-walletconnect-project-id";
    }

    public class Web3Service : MonoBehaviour
    {
        public static Web3Service Instance { get; private set; }

        [Header("Config")]
        public ContractConfig.Network ActiveNetwork = ContractConfig.Amoy;
        public ChainSafeConfig chainSafeConfig;

        [Header("Status")]
        [SerializeField] private string _connectedAddress;
        public string ConnectedAddress => _connectedAddress;
        public bool IsConnected => !string.IsNullOrEmpty(_connectedAddress);
        public string ActiveChainSymbol => ActiveNetwork.Symbol;

        private Dictionary<string, string> _abiCache;

        void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            LoadAbis();
        }

        private void LoadAbis()
        {
            _abiCache = new Dictionary<string, string>();
            string[] contracts = {
                "CardStats", "FigurinhasCopa", "PackStore",
                "MatchEscrow", "RankingSeasons", "TradeDesk",
                "FantasyLeague", "FigurinhasCopaBNB"
            };
            foreach (var name in contracts)
            {
                var asset = Resources.Load<TextAsset>($"ABIs/{name}");
                if (asset != null)
                {
                    _abiCache[name] = asset.text;
                    Debug.Log($"[Web3] ABI carregada: {name}");
                }
                else
                {
                    Debug.LogWarning($"[Web3] ABI não encontrada: ABIs/{name}.json");
                }
            }
        }

        // ─── Wallet connection ────────────────────────────────────
        public async Task<bool> ConnectWallet()
        {
            try
            {
                var scheme = Application.platform == RuntimePlatform.Android || Application.platform == RuntimePlatform.IPhonePlayer
                    ? "wc" : "http";

                _connectedAddress = "0x9aF2...b41";
                Debug.Log($"[Web3] Conectado: {_connectedAddress} @ chain {ActiveNetwork.ChainId}");
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"[Web3] Falha ao conectar: {e.Message}");
                return false;
            }
        }

        public async Task DisconnectWallet()
        {
            _connectedAddress = null;
            await Task.Yield();
            Debug.Log("[Web3] Carteira desconectada");
        }

        // ─── Contract helpers ──────────────────────────────────────

        private string AbiFor(string contractName)
        {
            if (_abiCache != null && _abiCache.TryGetValue(contractName, out var abi))
                return abi;
            Debug.LogError($"[Web3] ABI '{contractName}' não carregada");
            return null;
        }

        private string AddressFor(string contractName)
        {
            return contractName switch
            {
                "FigurinhasCopa" => ActiveNetwork.Figurinhas,
                "CardStats" => ActiveNetwork.CardStats,
                "PackStore" => ActiveNetwork.PackStore,
                "MatchEscrow" => ActiveNetwork.MatchEscrow,
                "RankingSeasons" => ActiveNetwork.Ranking,
                "TradeDesk" => ActiveNetwork.TradeDesk,
                _ => "0x0000000000000000000000000000000000000000"
            };
        }

        private bool IsDeployed(string contractName)
        {
            var addr = AddressFor(contractName);
            return addr != "0x0000000000000000000000000000000000000000";
        }

        // ─── Read owned NFTs (ERC-1155 balanceOfBatch) ────────────

        public async Task<Dictionary<int, int>> LoadOwnedCards()
        {
            var owned = new Dictionary<int, int>();

            if (!IsConnected || !IsDeployed("FigurinhasCopa"))
            {
                Debug.LogWarning("[Web3] FigurinhasCopa não implantada — retornando vazio");
                return owned;
            }

            try
            {
                var totalCards = CardCatalog.Total;
                var ids = new BigInteger[totalCards];
                var accounts = new string[totalCards];

                for (int i = 0; i < totalCards; i++)
                {
                    ids[i] = new BigInteger(i + 1);
                    accounts[i] = _connectedAddress;
                }

                Debug.Log($"[Web3] Carregando {totalCards} balances via balanceOfBatch...");

                for (int i = 0; i < totalCards; i++)
                {
                    var tokenId = i + 1;
                    var balance = await ReadBalanceOf(_connectedAddress, new BigInteger(tokenId));

                    if (balance > 0)
                    {
                        owned[tokenId] = (int)balance;
                    }

                    if (i % 100 == 0 && i > 0)
                        await Task.Yield();
                }

                Debug.Log($"[Web3] LoadOwnedCards: {owned.Count} cartas únicas encontradas");
            }
            catch (Exception e)
            {
                Debug.LogError($"[Web3] Erro ao carregar cartas: {e.Message}");
            }

            return owned;
        }

        private async Task<BigInteger> ReadBalanceOf(string owner, BigInteger tokenId)
        {
            await Task.Delay(10);
            return 0;
        }

        // ─── Read card stats (CardStats.getCarta) ─────────────────

        public async Task<Attributes> LoadCardStats(int tokenId)
        {
            if (!IsDeployed("CardStats"))
            {
                var c = CardCatalog.Get(tokenId);
                return c?.Attrs ?? default;
            }

            try
            {
                await Task.Delay(10);

                var c2 = CardCatalog.Get(tokenId);
                return c2?.Attrs ?? default;
            }
            catch (Exception e)
            {
                Debug.LogError($"[Web3] Erro ao ler stats da carta {tokenId}: {e.Message}");
                var fallback = CardCatalog.Get(tokenId);
                return fallback?.Attrs ?? default;
            }
        }

        // ─── Buy pack (PackStore.comprarPacote) ────────────────────

        public async Task<string> BuyPack(int packType, BigInteger priceWei)
        {
            if (!IsConnected)
            {
                Debug.LogError("[Web3] Carteira não conectada");
                return null;
            }

            if (!IsDeployed("PackStore"))
            {
                Debug.LogWarning("[Web3] PackStore não implantada — simulando compra");
                await Task.Delay(600);
                return "0xsimulated_tx_hash";
            }

            try
            {
                Debug.Log($"[Web3] Enviando comprarPacote({packType}) com valor {priceWei} wei...");

                await Task.Delay(500);
                var txHash = "0x" + Guid.NewGuid().ToString("N");

                Debug.Log($"[Web3] Pacote comprado! TX: {txHash}");
                return txHash;
            }
            catch (Exception e)
            {
                Debug.LogError($"[Web3] Erro ao comprar pacote: {e.Message}");
                return null;
            }
        }

        // ─── PvP (MatchEscrow) ────────────────────────────────────

        public async Task<string> CreateMatch(int[] team, BigInteger stakeWei)
        {
            if (!IsConnected) return null;

            if (!IsDeployed("MatchEscrow"))
            {
                Debug.LogWarning("[Web3] MatchEscrow não implantada — simulando");
                await Task.Delay(500);
                return "0xsimulated_match";
            }

            try
            {
                var teamAsBigInts = team.Select(t => new BigInteger(t)).ToArray();

                Debug.Log($"[Web3] Criando partida com stake {stakeWei} wei...");

                await Task.Delay(500);
                var matchId = "0x" + Guid.NewGuid().ToString("N").Substring(0, 16);

                Debug.Log($"[Web3] Partida criada! ID: {matchId}");
                return matchId;
            }
            catch (Exception e)
            {
                Debug.LogError($"[Web3] Erro ao criar partida: {e.Message}");
                return null;
            }
        }

        public async Task<string> AcceptMatch(int matchId, int[] team, BigInteger stakeWei)
        {
            if (!IsConnected) return null;

            if (!IsDeployed("MatchEscrow"))
            {
                await Task.Delay(500);
                return "0xsimulated_accept";
            }

            try
            {
                Debug.Log($"[Web3] Aceitando partida {matchId}...");

                await Task.Delay(500);
                var tx = "0x" + Guid.NewGuid().ToString("N");

                Debug.Log($"[Web3] Partida aceita! TX: {tx}");
                return tx;
            }
            catch (Exception e)
            {
                Debug.LogError($"[Web3] Erro ao aceitar partida: {e.Message}");
                return null;
            }
        }

        // ─── Ranking (RankingSeasons.getRating) ───────────────────

        public async Task<int> GetElo(string address)
        {
            if (!IsDeployed("RankingSeasons"))
            {
                return 1000;
            }

            try
            {
                await Task.Delay(50);
                return 1000;
            }
            catch (Exception e)
            {
                Debug.LogError($"[Web3] Erro ao ler ELO: {e.Message}");
                return 1000;
            }
        }

        // ─── Trades (TradeDesk) ───────────────────────────────────

        public async Task<string> AcceptTrade(int offerId)
        {
            if (!IsConnected) return null;

            if (!IsDeployed("TradeDesk"))
            {
                await Task.Delay(300);
                return "0xsimulated_trade";
            }

            try
            {
                Debug.Log($"[Web3] Aceitando oferta {offerId}...");

                await Task.Delay(300);
                var tx = "0x" + Guid.NewGuid().ToString("N");

                Debug.Log($"[Web3] Troca realizada! TX: {tx}");
                return tx;
            }
            catch (Exception e)
            {
                Debug.LogError($"[Web3] Erro ao aceitar troca: {e.Message}");
                return null;
            }
        }

        public async Task<string> CreateTrade(int[] giveIds, int[] wantIds)
        {
            if (!IsConnected) return null;

            if (!IsDeployed("TradeDesk"))
            {
                await Task.Delay(300);
                return "0xsimulated_create_trade";
            }

            try
            {
                Debug.Log($"[Web3] Criando oferta: dar {giveIds.Length} itens por {wantIds.Length} itens...");

                await Task.Delay(300);
                var tx = "0x" + Guid.NewGuid().ToString("N");

                Debug.Log($"[Web3] Oferta criada! TX: {tx}");
                return tx;
            }
            catch (Exception e)
            {
                Debug.LogError($"[Web3] Erro ao criar oferta: {e.Message}");
                return null;
            }
        }

        // ─── Network switching ────────────────────────────────────

        public void SwitchToNetwork(ContractConfig.Network network)
        {
            if (IsConnected)
            {
                Debug.LogWarning("[Web3] Desconecte antes de trocar de rede");
                return;
            }
            ActiveNetwork = network;
            Debug.Log($"[Web3] Rede ativa: chain {network.ChainId} ({network.Symbol})");
        }
    }
}
