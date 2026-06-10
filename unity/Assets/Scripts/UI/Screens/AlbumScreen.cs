using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using CryptoAlbumCopa.Data;
using CryptoAlbumCopa.Game;

namespace CryptoAlbumCopa.UI.Screens
{
    /// <summary>
    /// Tela do Álbum: seletor de 48 países + abas de categoria
    /// (Jogadores, Técnico, Símbolos, Curiosidades, Estádios).
    /// Renderiza um grid de slots; mostra figurinha colada (possuída) ou placeholder.
    ///
    /// Setup na cena:
    ///   - countryButtonPrefab: botão pequeno com TMP (sigla)
    ///   - categoryButtons: 5 botões fixos (ligados via inspector)
    ///   - cardSlotPrefab: prefab com CardView + placeholder "COLE"
    ///   - countryContainer / gridContainer: ScrollRects
    /// </summary>
    public class AlbumScreen : MonoBehaviour
    {
        public enum Category { Jogadores, Tecnico, Simbolos, Curiosidade, Estadios }

        [Header("Seletor de país")]
        public Transform countryContainer;
        public GameObject countryButtonPrefab;

        [Header("Categorias")]
        public Button[] categoryButtons; // 5, na ordem do enum

        [Header("Grid")]
        public Transform gridContainer;
        public GameObject cardSlotPrefab; // tem CardView + objeto "Placeholder"

        [Header("Cabeçalho")]
        public TMP_Text titleText;
        public TMP_Text progressText;

        private int _country = 0;
        private Category _category = Category.Jogadores;
        private readonly List<GameObject> _spawnedCountry = new();
        private readonly List<GameObject> _spawnedSlots = new();

        void Start()
        {
            BuildCountrySelector();
            HookCategoryButtons();
            if (PlayerInventory.Instance != null)
                PlayerInventory.Instance.OnInventoryChanged += Refresh;
            Refresh();
        }

        void OnDestroy()
        {
            if (PlayerInventory.Instance != null)
                PlayerInventory.Instance.OnInventoryChanged -= Refresh;
        }

        private void BuildCountrySelector()
        {
            for (int i = 0; i < CountryDatabase.Paises.Length; i++)
            {
                int idx = i;
                var go = Instantiate(countryButtonPrefab, countryContainer);
                var label = go.GetComponentInChildren<TMP_Text>();
                if (label != null) label.text = CountryDatabase.Paises[i][0];
                var btn = go.GetComponent<Button>();
                if (btn != null) btn.onClick.AddListener(() => { _country = idx; Refresh(); });
                _spawnedCountry.Add(go);
            }
        }

        private void HookCategoryButtons()
        {
            for (int i = 0; i < categoryButtons.Length; i++)
            {
                var cat = (Category)i;
                categoryButtons[i].onClick.AddListener(() => { _category = cat; Refresh(); });
            }
        }

        private List<Card> CurrentCards()
        {
            var list = new List<Card>();
            if (_category == Category.Estadios)
            {
                foreach (var c in CardCatalog.All)
                    if (c.Type == CardType.Estadio) list.Add(c);
                return list;
            }

            foreach (var c in CardCatalog.All)
            {
                if (c.CountryIndex != _country) continue;
                bool include = _category switch
                {
                    Category.Jogadores => c.Type == CardType.Jogador,
                    Category.Tecnico => c.Type == CardType.Tecnico,
                    Category.Simbolos => c.Type == CardType.Bandeira || c.Type == CardType.Brasao || c.Type == CardType.Mascote,
                    Category.Curiosidade => c.Type == CardType.Curiosidade,
                    _ => false
                };
                if (include) list.Add(c);
            }
            return list;
        }

        public void Refresh()
        {
            // limpa grid
            foreach (var g in _spawnedSlots) Destroy(g);
            _spawnedSlots.Clear();

            var inv = PlayerInventory.Instance;
            var cards = CurrentCards();
            int owned = 0;

            foreach (var card in cards)
            {
                var slot = Instantiate(cardSlotPrefab, gridContainer);
                _spawnedSlots.Add(slot);

                int count = inv != null ? inv.CountOf(card.TokenId) : 0;
                bool has = count > 0;
                if (has) owned++;

                var view = slot.GetComponentInChildren<CardView>(true);
                var placeholder = slot.transform.Find("Placeholder");

                if (view != null) view.gameObject.SetActive(has);
                if (placeholder != null)
                {
                    placeholder.gameObject.SetActive(!has);
                    var ph = placeholder.GetComponentInChildren<TMP_Text>();
                    if (ph != null) ph.text = $"{card.TokenId:0000}\nCOLE";
                }
                if (has && view != null) view.Bind(card, count);
            }

            // cabeçalho
            if (titleText != null)
                titleText.text = _category == Category.Estadios ? "Estádios Mundiais" : CountryDatabase.Paises[_country][1];
            if (progressText != null)
                progressText.text = $"{owned}/{cards.Count}";

            // destaca o país e categoria ativos
            HighlightCountry();
            HighlightCategory();
        }

        private void HighlightCountry()
        {
            for (int i = 0; i < _spawnedCountry.Count; i++)
            {
                var img = _spawnedCountry[i].GetComponent<Image>();
                if (img == null) continue;
                bool active = i == _country;
                var p = CountryDatabase.Paises[i];
                img.color = active ? CardView.Hex(p[2]) : new Color(0.23f, 0.18f, 0.12f, 0.08f);
            }
        }

        private void HighlightCategory()
        {
            for (int i = 0; i < categoryButtons.Length; i++)
            {
                var img = categoryButtons[i].GetComponent<Image>();
                if (img == null) continue;
                img.color = (Category)i == _category
                    ? new Color(0.04f, 0.18f, 0.13f)
                    : new Color(0.23f, 0.18f, 0.12f, 0.08f);
            }
        }
    }
}
