using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using CryptoAlbumCopa.Data;

namespace CryptoAlbumCopa.UI
{
    /// <summary>
    /// Slot de escalação na tela de Partida. Vazio mostra a posição esperada;
    /// preenchido mostra a CardView. Clicar abre o seletor de cartas.
    /// </summary>
    public class CardSlot : MonoBehaviour
    {
        [Header("Refs")]
        public CardView cardView;
        public GameObject emptyState;     // visual de slot vazio
        public TMP_Text emptyLabel;       // "GOL", "CAM", "TÉC"...
        public Button button;

        [Header("Config")]
        public string expectedPosition = "JOG"; // rótulo do slot vazio

        public int TokenId { get; private set; }
        public Action OnClick;

        void Awake()
        {
            if (button == null) button = GetComponent<Button>();
            if (button != null) button.onClick.AddListener(() => OnClick?.Invoke());
            SetEmptyVisual();
        }

        public void SetCard(int tokenId)
        {
            TokenId = tokenId;
            var card = CardCatalog.Get(tokenId);
            if (card == null) { Clear(); return; }

            if (cardView != null)
            {
                cardView.gameObject.SetActive(true);
                cardView.Bind(card);
            }
            if (emptyState != null) emptyState.SetActive(false);
        }

        public void Clear()
        {
            TokenId = 0;
            SetEmptyVisual();
        }

        private void SetEmptyVisual()
        {
            if (cardView != null) cardView.gameObject.SetActive(false);
            if (emptyState != null) emptyState.SetActive(true);
            if (emptyLabel != null) emptyLabel.text = expectedPosition;
        }
    }
}
