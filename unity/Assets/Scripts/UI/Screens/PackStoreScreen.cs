using System;
using System.Collections;
using System.Collections.Generic;
using System.Numerics;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using CryptoAlbumCopa.Data;
using CryptoAlbumCopa.Game;
using CryptoAlbumCopa.Web3Net;

namespace CryptoAlbumCopa.UI.Screens
{
    /// <summary>
    /// Tela de Pacotes: lista os 4 tipos (Básico, Premium, Lendário, Mítico),
    /// faz a compra (PackStore on-chain), simula o VRF e revela as figurinhas.
    /// </summary>
    public class PackStoreScreen : MonoBehaviour
    {
        [Serializable]
        public struct PackType
        {
            public string Name;
            public int PriceUnits;       // preço em POL/BNB (inteiro p/ demo)
            public int Count;            // qtd de figurinhas
            public int MinRarity;        // garantia (0=nenhuma,1=Rara,2=Épica,3=Lendária)
            public bool AllowMythic;     // só o pacote mítico
            public string Desc;
        }

        public static readonly PackType[] Packs =
        {
            new PackType{ Name="Pacote Básico",   PriceUnits=4,   Count=5,  MinRarity=0, AllowMythic=false, Desc="5 figurinhas aleatórias" },
            new PackType{ Name="Pacote Premium",  PriceUnits=16,  Count=5,  MinRarity=1, AllowMythic=false, Desc="5 figurinhas · ≥1 Rara" },
            new PackType{ Name="Pacote Lendário", PriceUnits=50,  Count=10, MinRarity=2, AllowMythic=false, Desc="10 figurinhas · ≥1 Épica" },
            new PackType{ Name="Pacote Mítico",   PriceUnits=150, Count=10, MinRarity=3, AllowMythic=true,  Desc="10 figurinhas · ≥1 Lendária · chance de Mítica" },
        };

        [Header("Lista de pacotes")]
        public Transform packListContainer;
        public GameObject packButtonPrefab; // TMP nome/preço/desc + Button

        [Header("Modal de abertura")]
        public GameObject openModal;
        public TMP_Text openStatusText;
        public Transform revealContainer;   // onde as cartas reveladas aparecem
        public GameObject cardViewPrefab;   // CardView
        public Button collectButton;

        private readonly List<GameObject> _revealed = new();

        void Start()
        {
            BuildPackList();
            if (openModal != null) openModal.SetActive(false);
            if (collectButton != null) collectButton.onClick.AddListener(CloseModal);
        }

        private void BuildPackList()
        {
            for (int i = 0; i < Packs.Length; i++)
            {
                int idx = i;
                var go = Instantiate(packButtonPrefab, packListContainer);
                var texts = go.GetComponentsInChildren<TMP_Text>();
                // espera 3 TMP: [0]=nome, [1]=desc, [2]=preço
                if (texts.Length >= 1) texts[0].text = Packs[i].Name;
                if (texts.Length >= 2) texts[1].text = Packs[i].Desc;
                if (texts.Length >= 3)
                {
                    string sym = Web3Service.Instance != null ? Web3Service.Instance.ActiveNetwork.Symbol : "POL";
                    texts[2].text = $"{Packs[i].PriceUnits} {sym}";
                }
                var btn = go.GetComponent<Button>();
                if (btn != null) btn.onClick.AddListener(() => BuyPack(idx));
            }
        }

        public async void BuyPack(int packIndex)
        {
            var pack = Packs[packIndex];

            // 1) pagar on-chain (PackStore.comprarPacote)
            if (Web3Service.Instance != null && Web3Service.Instance.IsConnected)
            {
                BigInteger priceWei = (BigInteger)pack.PriceUnits * BigInteger.Pow(10, 18);
                await Web3Service.Instance.BuyPack(packIndex, priceWei);
            }

            // 2) animação + sorteio (no real, espera o callback VRF)
            StartCoroutine(OpenSequence(pack));
        }

        private IEnumerator OpenSequence(PackType pack)
        {
            if (openModal != null) openModal.SetActive(true);
            foreach (var g in _revealed) Destroy(g);
            _revealed.Clear();
            if (collectButton != null) collectButton.gameObject.SetActive(false);

            SetStatus("Enviando transação…");
            yield return new WaitForSeconds(0.9f);

            string vrf = Web3Service.Instance != null ? Web3Service.Instance.ActiveNetwork.Symbol : "VRF";
            SetStatus("Chainlink VRF gerando aleatoriedade…");
            yield return new WaitForSeconds(1.6f);

            SetStatus("Rasgue o pacote! ✨");
            var ids = DrawPack(pack);

            foreach (var id in ids)
            {
                var card = CardCatalog.Get(id);
                var go = Instantiate(cardViewPrefab, revealContainer);
                var view = go.GetComponent<CardView>();
                bool isNew = PlayerInventory.Instance != null && !PlayerInventory.Instance.Owns(id);
                if (view != null) view.Bind(card, 1, isNew);
                _revealed.Add(go);

                // entrega ao inventário (após confirmação on-chain do mintBatch)
                PlayerInventory.Instance?.AddCard(id);
                yield return new WaitForSeconds(0.45f);
            }

            if (collectButton != null) collectButton.gameObject.SetActive(true);
        }

        private void SetStatus(string s) { if (openStatusText != null) openStatusText.text = s; }
        private void CloseModal() { if (openModal != null) openModal.SetActive(false); }

        // ─── Sorteio (espelha PackStore._sortearRaridade) ─────────
        private static System.Random _rng = new System.Random();

        private static int RollRarity(int roll, bool allowMythic)
        {
            if (roll < 7000) return 0;
            if (roll < 9000) return 1;
            if (roll < 9800) return 2;
            if (allowMythic && roll < 9990) return 3;
            if (allowMythic) return 4;
            return 3;
        }

        public static List<int> DrawPack(PackType pack)
        {
            var ids = new List<int>();
            bool ok = pack.MinRarity == 0;

            // pools de jogadores por raridade
            var pools = new List<int>[5];
            for (int r = 0; r < 5; r++) pools[r] = new List<int>();
            foreach (var c in CardCatalog.All)
                if (c.IsPlayer) pools[(int)c.Rarity].Add(c.TokenId);

            for (int i = 0; i < pack.Count; i++)
            {
                int rar;
                if (i == pack.Count - 1 && !ok) rar = pack.MinRarity;
                else rar = RollRarity(_rng.Next(10000), pack.AllowMythic);
                if (rar >= pack.MinRarity) ok = true;

                var pool = pools[rar].Count > 0 ? pools[rar] : pools[0];
                ids.Add(pool[_rng.Next(pool.Count)]);
            }
            return ids;
        }
    }
}
