using System.Collections.Generic;
using System.Numerics;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using CryptoAlbumCopa.Data;
using CryptoAlbumCopa.Battle;
using CryptoAlbumCopa.Game;

namespace CryptoAlbumCopa.UI.Screens
{
    /// <summary>
    /// Tela de Partida PvP: escala 11 jogadores + 1 técnico, escolhe a aposta,
    /// e dispara a batalha via BattleController. Anima os 5 confrontos.
    /// </summary>
    public class MatchScreen : MonoBehaviour
    {
        [Header("Refs")]
        public BattleController battle;

        [Header("Slots de escalação (11 jogadores)")]
        public CardSlot[] playerSlots = new CardSlot[11];
        public CardSlot coachSlot; // 1 técnico

        [Header("Aposta")]
        public TMP_Text stakeText;
        public Button[] stakeButtons;       // 5,10,25,50
        public int[] stakeValues = { 5, 10, 25, 50 };
        private int _stake = 5;

        [Header("Controles")]
        public Button startButton;
        public TMP_Text startButtonText;
        public TMP_Text teamOvrText;

        [Header("Seletor de carta")]
        public GameObject pickerPanel;
        public Transform pickerGrid;
        public GameObject pickerCardPrefab; // CardView + Button
        private int _pickingSlot = -1;
        private bool _pickingCoach = false;

        [Header("Batalha")]
        public GameObject battlePanel;
        public TMP_Text battleStatus;
        public TMP_Text scoreText;
        public Transform clashContainer;
        public GameObject clashRowPrefab;   // 2 CardViews + força + resultado
        public GameObject resultPanel;
        public TMP_Text resultText;
        public TMP_Text resultDetail;

        void Start()
        {
            HookStakeButtons();
            if (startButton != null) startButton.onClick.AddListener(OnStart);
            if (pickerPanel != null) pickerPanel.SetActive(false);
            if (battlePanel != null) battlePanel.SetActive(false);

            for (int i = 0; i < playerSlots.Length; i++)
            {
                int idx = i;
                if (playerSlots[i] != null) playerSlots[i].OnClick = () => OpenPicker(idx, false);
            }
            if (coachSlot != null) coachSlot.OnClick = () => OpenPicker(-1, true);

            if (battle != null)
            {
                battle.OnMatchmaking += () => SetBattleStatus("Pareando oponente equilibrado…");
                battle.OnClashRevealed += OnClashRevealed;
                battle.OnBattleEnd += OnBattleEnd;
            }
            RefreshLineup();
        }

        private void HookStakeButtons()
        {
            for (int i = 0; i < stakeButtons.Length && i < stakeValues.Length; i++)
            {
                int v = stakeValues[i];
                stakeButtons[i].onClick.AddListener(() => { _stake = v; RefreshLineup(); });
            }
        }

        // ─── Escalação ────────────────────────────────────────────
        private void OpenPicker(int slot, bool coach)
        {
            _pickingSlot = slot;
            _pickingCoach = coach;
            if (pickerPanel != null) pickerPanel.SetActive(true);

            foreach (Transform t in pickerGrid) Destroy(t.gameObject);

            var inv = PlayerInventory.Instance;
            if (inv == null) return;

            var options = coach ? inv.OwnedCoaches() : inv.OwnedPlayers();
            foreach (var card in options)
            {
                // não repetir carta já escalada
                if (!coach && IsPlayerUsed(card.TokenId)) continue;

                var go = Instantiate(pickerCardPrefab, pickerGrid);
                var view = go.GetComponent<CardView>();
                if (view != null) view.Bind(card, inv.CountOf(card.TokenId));
                var btn = go.GetComponent<Button>();
                if (btn != null) btn.onClick.AddListener(() => PickCard(card.TokenId));
            }
        }

        private bool IsPlayerUsed(int tokenId)
        {
            foreach (var s in playerSlots) if (s != null && s.TokenId == tokenId) return true;
            return false;
        }

        private void PickCard(int tokenId)
        {
            if (_pickingCoach)
            {
                if (coachSlot != null) coachSlot.SetCard(tokenId);
            }
            else if (_pickingSlot >= 0)
            {
                playerSlots[_pickingSlot].SetCard(tokenId);
            }
            if (pickerPanel != null) pickerPanel.SetActive(false);
            RefreshLineup();
        }

        private Lineup BuildLineup()
        {
            var lineup = new Lineup();
            for (int i = 0; i < 11; i++)
                lineup.PlayerTokenIds[i] = playerSlots[i] != null ? playerSlots[i].TokenId : 0;
            lineup.CoachTokenId = coachSlot != null ? coachSlot.TokenId : 0;
            return lineup;
        }

        private void RefreshLineup()
        {
            var lineup = BuildLineup();
            int filled = 0;
            foreach (var id in lineup.PlayerTokenIds) if (id != 0) filled++;
            bool hasCoach = lineup.CoachTokenId != 0;
            bool complete = filled == 11 && hasCoach;

            if (teamOvrText != null) teamOvrText.text = $"OVR do time: {lineup.TeamOvr()}  ·  Téc +{lineup.CoachBonus()}";
            if (stakeText != null) stakeText.text = $"Aposta: {_stake}  ·  vencedor leva {(int)(_stake * 2 * 0.95f)}";
            if (startButton != null) startButton.interactable = complete;
            if (startButtonText != null)
                startButtonText.text = complete ? $"⚔️ Buscar oponente — apostar {_stake}"
                                                : $"Escale {(11 - filled)} jog. {(hasCoach ? "" : "+ técnico")}";
        }

        private void OnStart()
        {
            if (battle == null) return;
            battle.MyLineup = BuildLineup();
            if (battlePanel != null) battlePanel.SetActive(true);
            if (resultPanel != null) resultPanel.SetActive(false);
            foreach (Transform t in clashContainer) Destroy(t.gameObject);

            BigInteger stakeWei = (BigInteger)_stake * BigInteger.Pow(10, 18);
            battle.StartMatch(stakeWei);
        }

        // ─── Callbacks da batalha ─────────────────────────────────
        private void OnClashRevealed(Clash clash, int pm, int pt)
        {
            if (scoreText != null) scoreText.text = $"{pm} — {pt}";
            if (clashRowPrefab == null || clashContainer == null) return;

            var row = Instantiate(clashRowPrefab, clashContainer);
            var views = row.GetComponentsInChildren<CardView>();
            if (views.Length >= 2)
            {
                views[0].Bind(clash.Mine);
                views[1].Bind(clash.Theirs);
            }
            var label = row.GetComponentInChildren<TMP_Text>();
            if (label != null)
                label.text = $"{clash.ForceMine} {(clash.Won ? "▶" : "◀")} {clash.ForceTheirs}\n{clash.AttrUsed} · {(clash.Won ? "vitória" : "derrota")}";
        }

        private void OnBattleEnd(BattleResult result, bool victory, int eloDelta)
        {
            if (resultPanel != null) resultPanel.SetActive(true);
            if (resultText != null) resultText.text = victory ? "🏆 VITÓRIA!" : "DERROTA";
            if (resultDetail != null)
            {
                int premio = (int)(_stake * 2 * 0.95f);
                resultDetail.text = victory
                    ? $"Você levou {premio}!  ELO {(eloDelta >= 0 ? "+" : "")}{eloDelta}"
                    : $"Você perdeu {_stake}.  ELO {eloDelta}";
            }
        }

        private void SetBattleStatus(string s) { if (battleStatus != null) battleStatus.text = s; }
    }
}
