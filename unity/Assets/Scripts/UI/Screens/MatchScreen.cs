using System.Collections.Generic;
using System.Numerics;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using CryptoAlbumCopa.Data;
using CryptoAlbumCopa.Battle;
using CryptoAlbumCopa.Game;
using CryptoAlbumCopa.Services;

namespace CryptoAlbumCopa.UI.Screens
{
    public class MatchScreen : MonoBehaviour
    {
        [Header("Refs")]
        public BattleController battle;

        [Header("Slots de escalação (11 jogadores)")]
        public CardSlot[] playerSlots = new CardSlot[11];
        public CardSlot coachSlot;

        [Header("Modo de Jogo")]
        public Button rankedModeButton;
        public Button stakedModeButton;
        public GameObject rankedModeHighlight;
        public GameObject stakedModeHighlight;
        public TMP_Text modeDescriptionText;

        [Header("Aposta (modo Staked)")]
        public GameObject stakedOptionsPanel;
        public TMP_Text stakeText;
        public Button[] stakeButtons;
        public int[] stakeValues = { 5, 10, 25, 50 };
        private int _stake = 0;
        private bool _isStakedMode = false;

        [Header("Modal de Confirmação (Staked)")]
        public GameObject stakedConfirmModal;
        public TMP_Text confirmStakeValueText;
        public TMP_Text confirmWarningText;
        public Button confirmStakeButton;
        public Button cancelStakeButton;

        [Header("Controles")]
        public Button startButton;
        public TMP_Text startButtonText;
        public TMP_Text teamOvrText;

        [Header("Seletor de carta")]
        public GameObject pickerPanel;
        public Transform pickerGrid;
        public GameObject pickerCardPrefab;
        private int _pickingSlot = -1;
        private bool _pickingCoach = false;

        [Header("Batalha")]
        public GameObject battlePanel;
        public TMP_Text battleStatus;
        public TMP_Text scoreText;
        public Transform clashContainer;
        public GameObject clashRowPrefab;
        public GameObject resultPanel;
        public TMP_Text resultText;
        public TMP_Text resultDetail;

        void Start()
        {
            SetModeRanked();
            HookModeButtons();
            HookStakeButtons();
            if (startButton != null) startButton.onClick.AddListener(OnStartClicked);
            if (pickerPanel != null) pickerPanel.SetActive(false);
            if (battlePanel != null) battlePanel.SetActive(false);
            if (stakedConfirmModal != null) stakedConfirmModal.SetActive(false);
            if (stakedOptionsPanel != null) stakedOptionsPanel.SetActive(false);

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

        private void HookModeButtons()
        {
            if (rankedModeButton != null)
                rankedModeButton.onClick.AddListener(SetModeRanked);
            if (stakedModeButton != null)
                stakedModeButton.onClick.AddListener(SetModeStaked);
        }

        private void SetModeRanked()
        {
            _isStakedMode = false;
            _stake = 0;
            if (rankedModeHighlight != null) rankedModeHighlight.SetActive(true);
            if (stakedModeHighlight != null) stakedModeHighlight.SetActive(false);
            if (stakedOptionsPanel != null) stakedOptionsPanel.SetActive(false);
            if (modeDescriptionText != null)
                modeDescriptionText.text = "Partida ranqueada · Sem valor financeiro · Sobe no ranking";
            RefreshLineup();
        }

        private void SetModeStaked()
        {
            if (GeofenceService.Instance != null && GeofenceService.Instance.isReady && !GeofenceService.Instance.stakingAllowed)
            {
                string country = string.IsNullOrEmpty(GeofenceService.Instance.countryName)
                    ? "sua região" : GeofenceService.Instance.countryName;
                if (modeDescriptionText != null)
                    modeDescriptionText.text = $"⚠️ Partidas com aposta indisponíveis em {country}. Apenas modo ranqueado disponível.";
                return;
            }

            _isStakedMode = true;
            _stake = stakeValues.Length > 0 ? stakeValues[0] : 5;
            if (rankedModeHighlight != null) rankedModeHighlight.SetActive(false);
            if (stakedModeHighlight != null) stakedModeHighlight.SetActive(true);
            if (stakedOptionsPanel != null) stakedOptionsPanel.SetActive(true);
            if (modeDescriptionText != null)
                modeDescriptionText.text = "Partida com aposta financeira · Verifique os riscos";
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

            if (teamOvrText != null)
                teamOvrText.text = $"OVR do time: {lineup.TeamOvr()}  ·  Téc +{lineup.CoachBonus()}";

            if (_isStakedMode)
            {
                if (stakeText != null)
                    stakeText.text = $"Aposta: {_stake}  ·  vencedor leva {(int)(_stake * 2 * 0.95f)}";
                if (startButtonText != null && startButton != null)
                    startButtonText.text = complete
                        ? $"⚔️ Buscar oponente — apostar {_stake}"
                        : $"Escale {(11 - filled)} jog. {(hasCoach ? "" : "+ técnico")}";
            }
            else
            {
                if (stakeText != null)
                    stakeText.text = "Modo Ranqueada · Sem aposta financeira";
                if (startButtonText != null && startButton != null)
                    startButtonText.text = complete
                        ? "⚔️ Buscar partida ranqueada"
                        : $"Escale {(11 - filled)} jog. {(hasCoach ? "" : "+ técnico")}";
            }

            if (startButton != null) startButton.interactable = complete;
        }

        private void OnStartClicked()
        {
            if (_isStakedMode && _stake > 0)
            {
                ShowStakedConfirmModal();
            }
            else
            {
                StartMatchInternal();
            }
        }

        private void ShowStakedConfirmModal()
        {
            if (GeofenceService.Instance != null && GeofenceService.Instance.isReady && !GeofenceService.Instance.stakingAllowed)
            {
                SetModeRanked();
                return;
            }

            if (stakedConfirmModal != null) stakedConfirmModal.SetActive(true);
            if (confirmStakeValueText != null)
                confirmStakeValueText.text = $"Aposta: {_stake} {Web3Service.Instance?.ActiveChainSymbol ?? "POL"}";
            if (confirmWarningText != null)
                confirmWarningText.text = $"Valor total: {_stake * 2} (você + oponente). "
                    + "Você só recupera se vencer. A casa retém 5% do pote.";

            if (cancelStakeButton != null)
            {
                cancelStakeButton.onClick.RemoveAllListeners();
                cancelStakeButton.onClick.AddListener(() => {
                    if (stakedConfirmModal != null) stakedConfirmModal.SetActive(false);
                });
            }

            if (confirmStakeButton != null)
            {
                confirmStakeButton.onClick.RemoveAllListeners();
                confirmStakeButton.onClick.AddListener(() => {
                    if (stakedConfirmModal != null) stakedConfirmModal.SetActive(false);
                    StartMatchInternal();
                });
            }
        }

        private void StartMatchInternal()
        {
            if (battle == null) return;
            battle.MyLineup = BuildLineup();
            if (battlePanel != null) battlePanel.SetActive(true);
            if (resultPanel != null) resultPanel.SetActive(false);
            foreach (Transform t in clashContainer) Destroy(t.gameObject);

            BigInteger stakeWei = (BigInteger)_stake * BigInteger.Pow(10, 18);
            battle.StartMatch(stakeWei);
        }

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
                if (_isStakedMode && _stake > 0)
                {
                    int premio = (int)(_stake * 2 * 0.95f);
                    string eloSign = eloDelta >= 0 ? "+" : "";
                    resultDetail.text = victory
                        ? $"Você levou {premio}!  ELO {eloSign}{eloDelta}"
                        : $"Você perdeu {_stake}.  ELO {eloDelta}";
                }
                else
                {
                    string eloSign = eloDelta >= 0 ? "+" : "";
                    resultDetail.text = victory
                        ? $"Vitória!  ELO {eloSign}{eloDelta}"
                        : $"Derrota.  ELO {eloDelta}";
                }
            }
        }

        private void SetBattleStatus(string s) { if (battleStatus != null) battleStatus.text = s; }
    }
}
