using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using CryptoAlbumCopa.Data;
using CryptoAlbumCopa.Game;
using CryptoAlbumCopa.Web3Net;

namespace CryptoAlbumCopa.UI.Screens
{
    /// <summary>
    /// Tela de Trocas P2P: criar oferta (dou repetida / quero faltante) e aceitar
    /// ofertas de outros. Swap atômico via TradeDesk.sol — sem dinheiro envolvido.
    /// </summary>
    public class TradeScreen : MonoBehaviour
    {
        [System.Serializable]
        public class Offer
        {
            public string User;
            public int GiveId;  // o que o criador oferece
            public int WantId;  // o que ele quer em troca
            public bool Mine;
        }

        [Header("Mural")]
        public Transform offerContainer;
        public GameObject offerRowPrefab; // 2 CardViews + TMP + Button aceitar

        [Header("Criar oferta")]
        public GameObject createPanel;
        public Button createToggleButton;
        public Transform givePickerGrid;  // minhas repetidas
        public Transform wantPickerGrid;  // faltantes
        public GameObject pickerCardPrefab;
        public Button publishButton;
        public TMP_Text createHint;

        private readonly List<Offer> _offers = new()
        {
            new Offer{ User="leo.eth",    GiveId=11, WantId=1 },
            new Offer{ User="marta.eth",  GiveId=53, WantId=25 },
            new Offer{ User="0x7aF3..c2", GiveId=240, WantId=96 },
        };

        private int _selGive = 0;
        private int _selWant = 0;

        void Start()
        {
            if (createPanel != null) createPanel.SetActive(false);
            if (createToggleButton != null) createToggleButton.onClick.AddListener(ToggleCreate);
            if (publishButton != null) publishButton.onClick.AddListener(Publish);
            if (PlayerInventory.Instance != null)
                PlayerInventory.Instance.OnInventoryChanged += RenderOffers;
            RenderOffers();
        }

        void OnDestroy()
        {
            if (PlayerInventory.Instance != null)
                PlayerInventory.Instance.OnInventoryChanged -= RenderOffers;
        }

        // ─── Mural de ofertas ─────────────────────────────────────
        private void RenderOffers()
        {
            if (offerContainer == null || offerRowPrefab == null) return;
            foreach (Transform t in offerContainer) Destroy(t.gameObject);

            var inv = PlayerInventory.Instance;
            foreach (var offer in _offers)
            {
                var give = CardCatalog.Get(offer.GiveId);
                var want = CardCatalog.Get(offer.WantId);
                if (give == null || want == null) continue;

                var row = Instantiate(offerRowPrefab, offerContainer);
                var views = row.GetComponentsInChildren<CardView>();
                if (views.Length >= 2) { views[0].Bind(give); views[1].Bind(want); }

                bool iHaveWanted = inv != null && inv.CountOf(offer.WantId) > 0;
                bool isDupe = inv != null && inv.CountOf(offer.WantId) > 1;

                var label = row.GetComponentInChildren<TMP_Text>();
                if (label != null)
                {
                    if (offer.Mine) label.text = "🟢 Sua oferta · aguardando";
                    else
                    {
                        string status = !iHaveWanted ? "você não tem"
                            : isDupe ? "você tem repetida! ✓" : "você tem só 1";
                        label.text = $"{offer.User} quer: {want.Name}\n({status})";
                    }
                }

                var btn = row.GetComponentInChildren<Button>();
                if (btn != null)
                {
                    btn.interactable = !offer.Mine && iHaveWanted;
                    var btnTxt = btn.GetComponentInChildren<TMP_Text>();
                    if (btnTxt != null) btnTxt.text = offer.Mine ? "Sua oferta" : (iHaveWanted ? "Aceitar troca" : "Indisponível");
                    var captured = offer;
                    btn.onClick.RemoveAllListeners();
                    btn.onClick.AddListener(() => AcceptOffer(captured));
                }
            }
        }

        private async void AcceptOffer(Offer offer)
        {
            var inv = PlayerInventory.Instance;
            if (inv == null || inv.CountOf(offer.WantId) == 0) return;

            // swap atômico on-chain (TradeDesk.aceitarOferta)
            if (Web3Service.Instance != null && Web3Service.Instance.IsConnected)
            {
                // await Web3Service.Instance.AcceptTrade(offer.Id);  // método a adicionar
                await System.Threading.Tasks.Task.Delay(300);
            }

            // efeito local após confirmação
            inv.RemoveCard(offer.WantId);
            inv.AddCard(offer.GiveId);
            _offers.Remove(offer);
            RenderOffers();
        }

        // ─── Criar oferta ─────────────────────────────────────────
        private void ToggleCreate()
        {
            if (createPanel == null) return;
            bool on = !createPanel.activeSelf;
            createPanel.SetActive(on);
            if (on) BuildCreatePickers();
        }

        private void BuildCreatePickers()
        {
            var inv = PlayerInventory.Instance;
            if (inv == null) return;

            // dou: minhas repetidas
            foreach (Transform t in givePickerGrid) Destroy(t.gameObject);
            foreach (var card in CardCatalog.All)
            {
                if (inv.CountOf(card.TokenId) > 1)
                    SpawnPicker(givePickerGrid, card, () => { _selGive = card.TokenId; UpdateHint(); });
            }

            // quero: faltantes (jogadores)
            foreach (Transform t in wantPickerGrid) Destroy(t.gameObject);
            foreach (var card in CardCatalog.All)
            {
                if (card.IsPlayer && inv.CountOf(card.TokenId) == 0)
                    SpawnPicker(wantPickerGrid, card, () => { _selWant = card.TokenId; UpdateHint(); });
            }
            UpdateHint();
        }

        private void SpawnPicker(Transform grid, Card card, UnityEngine.Events.UnityAction onClick)
        {
            var go = Instantiate(pickerCardPrefab, grid);
            var view = go.GetComponent<CardView>();
            if (view != null) view.Bind(card, PlayerInventory.Instance.CountOf(card.TokenId));
            var btn = go.GetComponent<Button>();
            if (btn != null) btn.onClick.AddListener(onClick);
        }

        private void UpdateHint()
        {
            if (createHint == null) return;
            string g = _selGive > 0 ? CardCatalog.Get(_selGive)?.Name : "—";
            string w = _selWant > 0 ? CardCatalog.Get(_selWant)?.Name : "—";
            createHint.text = $"Dou: {g}   ⇄   Quero: {w}";
            if (publishButton != null) publishButton.interactable = _selGive > 0 && _selWant > 0;
        }

        private void Publish()
        {
            if (_selGive == 0 || _selWant == 0) return;
            _offers.Insert(0, new Offer { User = "você", GiveId = _selGive, WantId = _selWant, Mine = true });
            _selGive = 0; _selWant = 0;
            if (createPanel != null) createPanel.SetActive(false);
            RenderOffers();
        }
    }
}
