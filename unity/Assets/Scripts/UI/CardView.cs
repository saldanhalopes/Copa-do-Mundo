using UnityEngine;
using UnityEngine.UI;
using TMPro;
using CryptoAlbumCopa.Data;

namespace CryptoAlbumCopa.UI
{
    /// <summary>
    /// Componente visual de uma carta no estilo FIFA.
    /// Anexar a um prefab com: fundo (Image), OVR (TMP), posição (TMP),
    /// nome (TMP), 6 atributos (TMP), moldura por raridade (Image).
    ///
    /// Estrutura sugerida do prefab "CardView":
    ///   CardView (Image = fundo gradiente)
    ///     ├ Frame (Image = moldura raridade)
    ///     ├ OvrText (TMP)
    ///     ├ PosText (TMP)
    ///     ├ FlagBadge (Image + TMP sigla)
    ///     ├ NameText (TMP)
    ///     ├ AttrsContainer (6x TMP: PAC/SHO/PAS/DRI/DEF/PHY)
    ///     └ RarityText (TMP)
    /// </summary>
    public class CardView : MonoBehaviour
    {
        [Header("Refs")]
        public Image background;
        public Image frame;
        public TMP_Text ovrText;
        public TMP_Text posText;
        public TMP_Text nameText;
        public TMP_Text rarityText;
        public TMP_Text flagText;
        public Image flagBadge;

        [Header("Atributos (6)")]
        public TMP_Text pacText, shoText, pasText, driText, defText, phyText;

        [Header("Extra")]
        public GameObject countBadge;
        public TMP_Text countText;
        public GameObject newBadge;

        // Cores de moldura por raridade
        static readonly Color[] FrameColors =
        {
            new Color(0.78f, 0.55f, 0.28f), // bronze
            new Color(0.70f, 0.75f, 0.80f), // prata
            new Color(0.83f, 0.66f, 0.22f), // ouro
            new Color(0.70f, 0.42f, 0.94f), // lendária
            new Color(1.00f, 0.36f, 0.55f), // mítica
        };

        public Card Current { get; private set; }

        public void Bind(Card card, int count = 1, bool isNew = false)
        {
            Current = card;

            // cores do país
            Color c1 = Hex(card.ColorPrimary);
            Color c2 = Hex(card.ColorSecondary);
            if (background != null) background.color = c1;
            if (frame != null) frame.color = FrameColors[(int)card.Rarity];

            if (nameText != null) nameText.text = card.Name.ToUpper();
            if (rarityText != null) rarityText.text = $"#{card.TokenId:0000} · {card.RarityName}";
            if (flagText != null) flagText.text = card.CountryCode;
            if (flagBadge != null) flagBadge.color = c2;

            bool isPlayer = card.IsPlayer;

            if (ovrText != null) { ovrText.gameObject.SetActive(isPlayer); if (isPlayer) ovrText.text = card.Ovr.ToString(); }
            if (posText != null) { posText.gameObject.SetActive(isPlayer || card.IsCoach); posText.text = card.IsCoach ? "TEC" : card.Position.ToString(); }

            // atributos
            if (isPlayer)
            {
                SetAttr(pacText, "PAC", card.Attrs.PAC);
                SetAttr(shoText, "SHO", card.Attrs.SHO);
                SetAttr(pasText, "PAS", card.Attrs.PAS);
                SetAttr(driText, "DRI", card.Attrs.DRI);
                SetAttr(defText, "DEF", card.Attrs.DEF);
                SetAttr(phyText, "PHY", card.Attrs.PHY);
            }
            else
            {
                ToggleAttrs(false);
                // técnico mostra bônus; outros mostram texto/descrição
                if (card.IsCoach && pacText != null) { pacText.gameObject.SetActive(true); pacText.text = $"Bônus +{card.CoachBonus}"; }
            }

            // contador de cópias
            if (countBadge != null) countBadge.SetActive(count > 1);
            if (countText != null) countText.text = $"×{count}";
            if (newBadge != null) newBadge.SetActive(isNew);
        }

        private void SetAttr(TMP_Text t, string label, int val)
        {
            if (t == null) return;
            t.gameObject.SetActive(true);
            t.text = $"{val,2}  {label}";
        }

        private void ToggleAttrs(bool on)
        {
            foreach (var t in new[] { pacText, shoText, pasText, driText, defText, phyText })
                if (t != null) t.gameObject.SetActive(on);
        }

        public static Color Hex(string hex)
        {
            if (ColorUtility.TryParseHtmlString(hex, out var c)) return c;
            return Color.gray;
        }
    }
}
