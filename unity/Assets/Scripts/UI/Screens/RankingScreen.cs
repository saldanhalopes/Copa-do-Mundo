using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using CryptoAlbumCopa.Game;

namespace CryptoAlbumCopa.UI.Screens
{
    /// <summary>
    /// Tela de Ranking: cartão do jogador (ELO + faixa), info da temporada e
    /// leaderboard. ELO lido do PlayerInventory (que sincroniza com RankingSeasons.sol).
    /// </summary>
    public class RankingScreen : MonoBehaviour
    {
        [Header("Cartão do jogador")]
        public TMP_Text eloText;
        public TMP_Text tierText;
        public TMP_Text recordText;
        public TMP_Text positionText;
        public Image tierBadge;

        [Header("Temporada")]
        public TMP_Text seasonText;
        public TMP_Text prizePoolText;

        [Header("Leaderboard")]
        public Transform leaderboardContainer;
        public GameObject rankRowPrefab; // TMP: posição, nome, V/D, ELO

        // bots de exemplo (no jogo real vem de RankingSeasons.getParticipantes ordenado)
        private struct Entry { public string Name; public int Elo; public int V; public int D; public bool Me; }

        private static readonly Entry[] Bots =
        {
            new Entry{ Name="cracque.bnb", Elo=1480, V=87, D=21 },
            new Entry{ Name="10dipaula",   Elo=1390, V=64, D=30 },
            new Entry{ Name="marta.eth",   Elo=1320, V=51, D=28 },
            new Entry{ Name="leo.eth",     Elo=1240, V=44, D=33 },
            new Entry{ Name="didico.sol",  Elo=1150, V=30, D=29 },
            new Entry{ Name="0x7aF3..c2",  Elo=1080, V=22, D=25 },
        };

        void OnEnable()
        {
            if (PlayerInventory.Instance != null)
                PlayerInventory.Instance.OnInventoryChanged += Refresh;
            Refresh();
        }

        void OnDisable()
        {
            if (PlayerInventory.Instance != null)
                PlayerInventory.Instance.OnInventoryChanged -= Refresh;
        }

        public void Refresh()
        {
            var inv = PlayerInventory.Instance;
            int elo = inv != null ? inv.Elo : 1000;
            int v = inv != null ? inv.Wins : 0;
            int d = inv != null ? inv.Losses : 0;

            var (tierName, tierColor) = Tier(elo);

            if (eloText != null) eloText.text = elo.ToString();
            if (tierText != null) tierText.text = tierName;
            if (tierBadge != null) tierBadge.color = tierColor;
            if (recordText != null)
            {
                int total = v + d;
                string pct = total > 0 ? $" · {Mathf.RoundToInt(v * 100f / total)}% vitórias" : "";
                recordText.text = $"{v}V · {d}D{pct}";
            }

            // monta leaderboard com o jogador inserido
            var table = new List<Entry>(Bots) { new Entry { Name = "VOCÊ", Elo = elo, V = v, D = d, Me = true } };
            table.Sort((a, b) => b.Elo.CompareTo(a.Elo));

            int myPos = table.FindIndex(e => e.Me) + 1;
            if (positionText != null) positionText.text = $"Posição #{myPos}";

            if (seasonText != null) seasonText.text = "Temporada 1 · 12 dias restantes";
            if (prizePoolText != null) prizePoolText.text = "Fundo: 4.850";

            RenderLeaderboard(table);
        }

        private void RenderLeaderboard(List<Entry> table)
        {
            if (leaderboardContainer == null || rankRowPrefab == null) return;
            foreach (Transform t in leaderboardContainer) Destroy(t.gameObject);

            for (int i = 0; i < table.Count; i++)
            {
                var e = table[i];
                var row = Instantiate(rankRowPrefab, leaderboardContainer);
                var texts = row.GetComponentsInChildren<TMP_Text>();
                // espera [0]=posição, [1]=nome, [2]=V/D, [3]=ELO
                if (texts.Length >= 1) texts[0].text = (i + 1).ToString();
                if (texts.Length >= 2) texts[1].text = e.Name + (i == 0 ? " 👑" : "");
                if (texts.Length >= 3) texts[2].text = $"{e.V}V · {e.D}D";
                if (texts.Length >= 4) texts[3].text = e.Elo.ToString();

                var img = row.GetComponent<Image>();
                if (img != null)
                    img.color = e.Me ? new Color(0.92f, 0.96f, 0.92f) : new Color(1f, 0.97f, 0.91f);
            }
        }

        public static (string, Color) Tier(int elo)
        {
            if (elo >= 1400) return ("Lendário", new Color(0.70f, 0.42f, 0.94f));
            if (elo >= 1250) return ("Diamante", new Color(0.30f, 0.65f, 1.00f));
            if (elo >= 1100) return ("Ouro", new Color(0.83f, 0.66f, 0.22f));
            if (elo >= 950) return ("Prata", new Color(0.62f, 0.71f, 0.80f));
            return ("Bronze", new Color(0.71f, 0.47f, 0.23f));
        }
    }
}
