using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using CryptoAlbumCopa.Data;
using CryptoAlbumCopa.Web3Net;

namespace CryptoAlbumCopa.Game
{
    /// <summary>
    /// Gerencia o inventário do jogador: quais cartas ele possui (lidas da blockchain),
    /// progresso do álbum, e o time escalado para o PvP.
    /// </summary>
    public class PlayerInventory : MonoBehaviour
    {
        public static PlayerInventory Instance { get; private set; }

        // tokenId -> quantidade possuída
        private readonly Dictionary<int, int> _owned = new();

        public int Elo { get; private set; } = 1000;
        public int Wins { get; private set; }
        public int Losses { get; private set; }

        public event System.Action OnInventoryChanged;

        void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        // ─── Sincronização com a blockchain ───────────────────────
        public async Task SyncFromChain()
        {
            if (Web3Service.Instance == null || !Web3Service.Instance.IsConnected) return;
            var chainOwned = await Web3Service.Instance.LoadOwnedCards();
            _owned.Clear();
            foreach (var kv in chainOwned) _owned[kv.Key] = kv.Value;
            Elo = await Web3Service.Instance.GetElo(Web3Service.Instance.ConnectedAddress);
            OnInventoryChanged?.Invoke();
        }

        // ─── Consultas ────────────────────────────────────────────
        public bool Owns(int tokenId) => _owned.TryGetValue(tokenId, out var q) && q > 0;
        public int CountOf(int tokenId) => _owned.TryGetValue(tokenId, out var q) ? q : 0;

        public int UniqueCount()
        {
            int c = 0;
            foreach (var q in _owned.Values) if (q > 0) c++;
            return c;
        }

        public int DuplicateCount()
        {
            int d = 0;
            foreach (var q in _owned.Values) if (q > 1) d += q - 1;
            return d;
        }

        /// <summary>Cartas jogáveis (jogadores) que o usuário possui, para escalação.</summary>
        public List<Card> OwnedPlayers()
        {
            var list = new List<Card>();
            foreach (var kv in _owned)
            {
                if (kv.Value <= 0) continue;
                var c = CardCatalog.Get(kv.Key);
                if (c != null && c.IsPlayer) list.Add(c);
            }
            return list;
        }

        public List<Card> OwnedCoaches()
        {
            var list = new List<Card>();
            foreach (var kv in _owned)
            {
                if (kv.Value <= 0) continue;
                var c = CardCatalog.Get(kv.Key);
                if (c != null && c.IsCoach) list.Add(c);
            }
            return list;
        }

        // ─── Mutações locais (após confirmação on-chain) ──────────
        public void AddCard(int tokenId, int qty = 1)
        {
            _owned[tokenId] = CountOf(tokenId) + qty;
            OnInventoryChanged?.Invoke();
        }

        public void RemoveCard(int tokenId, int qty = 1)
        {
            int n = CountOf(tokenId) - qty;
            if (n <= 0) _owned.Remove(tokenId); else _owned[tokenId] = n;
            OnInventoryChanged?.Invoke();
        }

        public void RecordMatch(bool won, int eloDelta)
        {
            if (won) Wins++; else Losses++;
            Elo = Mathf.Max(0, Elo + eloDelta);
            OnInventoryChanged?.Invoke();
        }

        // Para testes/demo sem blockchain
        public void SeedDemo()
        {
            int[] demo = { 1, 1, 2, 5, 12, 24, 25, 26, 28, 30, 48, 49, 52, 72, 96 };
            foreach (var id in demo) AddCard(id);
        }
    }
}
