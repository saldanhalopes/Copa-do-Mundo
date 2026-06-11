#if UNITY_EDITOR
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using TMPro;
using CryptoAlbumCopa.UI;
using CryptoAlbumCopa.UI.Screens;
using CryptoAlbumCopa.Game;
using CryptoAlbumCopa.Web3Net;

namespace CryptoAlbumCopa.EditorTools
{
    /// <summary>
    /// Gera a cena principal, prefabs de carta e os 3 ecrãs (Álbum, Pacotes, Partida)
    /// programaticamente. Evita montar tudo manualmente no editor.
    ///
    /// Uso: menu  CryptoÁlbum ▸ Construir Cena de Demo
    /// </summary>
    public static class SceneBuilder
    {
        [MenuItem("CryptoÁlbum/Construir UI Completa (6 abas)")]
        public static void BuildFullUI()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);

            var managers = new GameObject("Managers");
            managers.AddComponent<Web3Service>();
            managers.AddComponent<PlayerInventory>();
            managers.AddComponent<DemoSeeder>();

            var canvasGO = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasGO.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasGO.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);

            if (Object.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
                new GameObject("EventSystem",
                    typeof(UnityEngine.EventSystems.EventSystem),
                    typeof(UnityEngine.EventSystems.StandaloneInputModule));

            var bg = NewUI("Background", canvasGO.transform);
            Stretch(bg.GetComponent<RectTransform>());
            bg.AddComponent<Image>().color = new Color(0.04f, 0.18f, 0.13f);

            var header = NewUI("Header", canvasGO.transform);
            var headerRt = header.GetComponent<RectTransform>();
            headerRt.anchorMin = new Vector2(0, 1); headerRt.anchorMax = new Vector2(1, 1);
            headerRt.pivot = new Vector2(0.5f, 1); headerRt.sizeDelta = new Vector2(0, 140);
            header.AddComponent<Image>().color = new Color(0.04f, 0.18f, 0.13f, 0.95f);

            var title = MakeText("Title", header.transform, "CRYPTOÁLBUM COPA", 40, new Vector2(0, -50), TextAlignmentOptions.Center);
            title.color = new Color(1f, 0.87f, 0f);

            var connectBtn = MakeButton("ConnectButton", header.transform, "Conectar", new Vector2(380, -50), new Vector2(200, 70));

            string[] names = { "AlbumPanel", "PacotesPanel", "PartidaPanel", "RankingPanel", "TrocasPanel", "VenderPanel" };
            var panels = new GameObject[6];
            for (int i = 0; i < 6; i++)
            {
                panels[i] = NewUI(names[i], canvasGO.transform);
                var rt = panels[i].GetComponent<RectTransform>();
                rt.anchorMin = new Vector2(0, 0); rt.anchorMax = new Vector2(1, 1);
                rt.offsetMin = new Vector2(0, 160); rt.offsetMax = new Vector2(0, -150);

                if (i == 2)
                {
                    // PartidaPanel: wire full MatchScreen hierarchy
                    BuildMatchScreenInPlace(panels[i]);
                }
                else
                {
                    var ph = MakeText("Placeholder", panels[i].transform, names[i] + "\n(adicione o screen aqui)", 32, Vector2.zero, TextAlignmentOptions.Center);
                    ph.color = new Color(0.95f, 0.91f, 0.82f, 0.7f);
                }
                panels[i].SetActive(i == 0);
            }

            var tabBar = NewUI("TabBar", canvasGO.transform);
            var tabRt = tabBar.GetComponent<RectTransform>();
            tabRt.anchorMin = new Vector2(0, 0); tabRt.anchorMax = new Vector2(1, 0);
            tabRt.pivot = new Vector2(0.5f, 0); tabRt.sizeDelta = new Vector2(0, 150);
            var hlg = tabBar.AddComponent<HorizontalLayoutGroup>();
            hlg.childControlWidth = true; hlg.childForceExpandWidth = true; hlg.spacing = 4; hlg.padding = new RectOffset(8, 8, 8, 8);

            string[] tabLabels = { "Album", "Pacotes", "Partida", "Ranking", "Trocas", "Vender" };
            var tabButtons = new Button[6];
            for (int i = 0; i < 6; i++)
                tabButtons[i] = MakeButton($"Tab{i}", tabBar.transform, tabLabels[i], Vector2.zero, new Vector2(160, 120)).GetComponent<Button>();

            var nav = header.AddComponent<TabNavigator>();
            nav.panels = panels;
            nav.tabButtons = tabButtons;
            nav.connectButton = connectBtn.GetComponent<Button>();
            nav.connectButtonText = connectBtn.GetComponentInChildren<TMP_Text>();

            System.IO.Directory.CreateDirectory("Assets/Scenes");
            EditorSceneManager.SaveScene(scene, "Assets/Scenes/Main.unity");
            Debug.Log("[SceneBuilder] UI completa criada em Assets/Scenes/Main.unity — PartidaPanel já está totalmente wireado. Adicione AlbumScreen, PackStoreScreen, RankingScreen e TradeScreen aos demais painéis.");
        }

        static GameObject MakeButton(string name, Transform parent, string label, Vector2 pos, Vector2 size)
        {
            var go = NewUI(name, parent);
            var img = go.AddComponent<Image>();
            img.color = new Color(1f, 0.87f, 0f);
            go.AddComponent<Button>();
            var rt = go.GetComponent<RectTransform>();
            rt.anchoredPosition = pos; rt.sizeDelta = size;
            var t = MakeText("Label", go.transform, label, 28, Vector2.zero, TextAlignmentOptions.Center);
            t.color = new Color(0.04f, 0.18f, 0.13f);
            Stretch(t.GetComponent<RectTransform>());
            return go;
        }

        [MenuItem("CryptoÁlbum/Construir Cena de Demo")]
        public static void BuildDemoScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);

            // ── Managers (singletons) ──
            var managers = new GameObject("Managers");
            managers.AddComponent<Web3Service>();
            var inv = managers.AddComponent<PlayerInventory>();

            // ── Canvas ──
            var canvasGO = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasGO.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasGO.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920); // retrato mobile

            // EventSystem
            if (Object.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
                new GameObject("EventSystem",
                    typeof(UnityEngine.EventSystems.EventSystem),
                    typeof(UnityEngine.EventSystems.StandaloneInputModule));

            // Fundo
            var bg = NewUI("Background", canvasGO.transform);
            Stretch(bg.GetComponent<RectTransform>());
            var bgImg = bg.AddComponent<Image>();
            bgImg.color = new Color(0.04f, 0.18f, 0.13f);

            // Container com tabs (placeholder; as telas seriam ativadas por tab)
            var info = NewUI("InfoText", canvasGO.transform);
            var infoTxt = info.AddComponent<TextMeshProUGUI>();
            infoTxt.text = "CryptoÁlbum Copa\n\nCena de demo gerada.\n\nAdicione AlbumScreen, PackStoreScreen e\nMatchScreen aos painéis e ligue os prefabs.\n\nUse 'CryptoÁlbum ▸ Criar Prefab de Carta'.";
            infoTxt.alignment = TextAlignmentOptions.Center;
            infoTxt.fontSize = 36;
            infoTxt.color = new Color(0.95f, 0.91f, 0.82f);
            var infoRt = info.GetComponent<RectTransform>();
            Stretch(infoRt);

            // semeia inventário de demo no play
            inv.gameObject.AddComponent<DemoSeeder>();

            EditorSceneManager.SaveScene(scene, "Assets/Scenes/Demo.unity");
            Debug.Log("[SceneBuilder] Cena de demo criada em Assets/Scenes/Demo.unity");
        }

        [MenuItem("CryptoÁlbum/Criar Prefab de Carta")]
        public static void CreateCardPrefab()
        {
            // Carta base 300x420
            var root = new GameObject("CardView", typeof(RectTransform), typeof(Image));
            var rt = root.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(300, 420);
            var bg = root.GetComponent<Image>();
            bg.color = new Color(0.5f, 0.4f, 0.25f);

            var view = root.AddComponent<CardView>();
            view.background = bg;

            // Moldura
            var frame = NewUI("Frame", root.transform);
            Stretch(frame.GetComponent<RectTransform>());
            var frameImg = frame.AddComponent<Image>();
            frameImg.color = Color.white;
            frameImg.type = Image.Type.Sliced;
            view.frame = frameImg;

            // OVR
            view.ovrText = MakeText("OvrText", root.transform, "99", 72, new Vector2(-110, 160), TextAlignmentOptions.Left);
            view.posText = MakeText("PosText", root.transform, "CAM", 32, new Vector2(-110, 110), TextAlignmentOptions.Left);
            view.flagText = MakeText("FlagText", root.transform, "BRA", 30, new Vector2(110, 160), TextAlignmentOptions.Right);
            view.nameText = MakeText("NameText", root.transform, "NOME", 34, new Vector2(0, -40), TextAlignmentOptions.Center);
            view.rarityText = MakeText("RarityText", root.transform, "#0001 · Comum", 20, new Vector2(0, -190), TextAlignmentOptions.Center);

            // atributos
            view.pacText = MakeText("PAC", root.transform, "99 PAC", 26, new Vector2(-70, -90), TextAlignmentOptions.Left);
            view.shoText = MakeText("SHO", root.transform, "99 SHO", 26, new Vector2(-70, -120), TextAlignmentOptions.Left);
            view.pasText = MakeText("PAS", root.transform, "99 PAS", 26, new Vector2(-70, -150), TextAlignmentOptions.Left);
            view.driText = MakeText("DRI", root.transform, "99 DRI", 26, new Vector2(70, -90), TextAlignmentOptions.Left);
            view.defText = MakeText("DEF", root.transform, "99 DEF", 26, new Vector2(70, -120), TextAlignmentOptions.Left);
            view.phyText = MakeText("PHY", root.transform, "99 PHY", 26, new Vector2(70, -150), TextAlignmentOptions.Left);

            // contador
            var countGO = NewUI("CountBadge", root.transform);
            var countImg = countGO.AddComponent<Image>();
            countImg.color = new Color(0.23f, 0.18f, 0.12f);
            var countRt = countGO.GetComponent<RectTransform>();
            countRt.sizeDelta = new Vector2(50, 30);
            countRt.anchoredPosition = new Vector2(120, 180);
            view.countBadge = countGO;
            view.countText = MakeText("CountText", countGO.transform, "×2", 22, Vector2.zero, TextAlignmentOptions.Center);

            // salva prefab
            System.IO.Directory.CreateDirectory("Assets/Prefabs");
            var path = "Assets/Prefabs/CardView.prefab";
            PrefabUtility.SaveAsPrefabAsset(root, path);
            Object.DestroyImmediate(root);
            Debug.Log($"[SceneBuilder] Prefab de carta criado em {path}");
            EditorUtility.FocusProjectWindow();
            Selection.activeObject = AssetDatabase.LoadAssetAtPath<GameObject>(path);
        }

        /// <summary>
        /// Constrói a hierarquia completa da MatchScreen dentro de um GameObject existente.
        /// Usado tanto pelo Criar Prefab quanto pelo Construir UI Completa.
        /// </summary>
        private static MatchScreen BuildMatchScreenInPlace(GameObject root)
        {
            var panel = root.AddComponent<MatchScreen>();

            // ── Mode Selector ──
            var modeSel = NewUI("ModeSelector", root.transform);
            var modeRt = modeSel.GetComponent<RectTransform>();
            modeRt.anchorMin = new Vector2(0, 1); modeRt.anchorMax = new Vector2(1, 1);
            modeRt.pivot = new Vector2(0.5f, 1); modeRt.sizeDelta = new Vector2(0, 120);

            var hlg = modeSel.AddComponent<HorizontalLayoutGroup>();
            hlg.childControlWidth = true; hlg.childForceExpandWidth = true; hlg.spacing = 8;
            hlg.padding = new RectOffset(16, 16, 16, 8);

            // ranked button
            var rankedBtn = MakeButtonInPanel("RankedModeButton", modeSel.transform, "Ranqueada", Vector2.zero, Vector2.zero);
            panel.rankedModeButton = rankedBtn.GetComponent<Button>();
            var rankedHighlight = NewUI("RankedModeHighlight", rankedBtn.transform);
            var rhRt = rankedHighlight.GetComponent<RectTransform>();
            rhRt.anchorMin = Vector2.zero; rhRt.anchorMax = new Vector2(1, 0);
            rhRt.pivot = new Vector2(0.5f, 0); rhRt.sizeDelta = new Vector2(0, 4);
            rankedHighlight.AddComponent<Image>().color = new Color(1f, 0.87f, 0f);
            panel.rankedModeHighlight = rankedHighlight;

            var stakedBtn = MakeButtonInPanel("StakedModeButton", modeSel.transform, "Aposta", Vector2.zero, Vector2.zero);
            panel.stakedModeButton = stakedBtn.GetComponent<Button>();
            var stakedHighlight = NewUI("StakedModeHighlight", stakedBtn.transform);
            var shRt = stakedHighlight.GetComponent<RectTransform>();
            shRt.anchorMin = Vector2.zero; shRt.anchorMax = new Vector2(1, 0);
            shRt.pivot = new Vector2(0.5f, 0); shRt.sizeDelta = new Vector2(0, 4);
            stakedHighlight.AddComponent<Image>().color = new Color(1f, 0.87f, 0f);
            stakedHighlight.SetActive(false);
            panel.stakedModeHighlight = stakedHighlight;

            // mode description
            var desc = MakeText("ModeDescriptionText", root.transform, "Partida ranqueada · Sem valor financeiro · Sobe no ranking",
                22, new Vector2(0, -60), TextAlignmentOptions.Center);
            var descRt = desc.GetComponent<RectTransform>();
            descRt.anchorMin = new Vector2(0, 1); descRt.anchorMax = new Vector2(1, 1);
            descRt.pivot = new Vector2(0.5f, 1); descRt.anchoredPosition = new Vector2(0, -80);
            descRt.sizeDelta = new Vector2(0, 40);
            panel.modeDescriptionText = desc;

            // ── Staked Options ──
            var stakePanel = NewUI("StakedOptionsPanel", root.transform);
            var spRt = stakePanel.GetComponent<RectTransform>();
            spRt.anchorMin = new Vector2(0, 1); spRt.anchorMax = new Vector2(1, 1);
            spRt.pivot = new Vector2(0.5f, 1); spRt.sizeDelta = new Vector2(0, 140);
            spRt.anchoredPosition = new Vector2(0, -140);
            stakePanel.SetActive(false);
            panel.stakedOptionsPanel = stakePanel;

            var stakeText = MakeText("StakeText", stakePanel.transform, "Aposta: 5  ·  vencedor leva 9",
                24, new Vector2(0, -20), TextAlignmentOptions.Center);
            var stRt = stakeText.GetComponent<RectTransform>();
            stRt.anchorMin = new Vector2(0, 1); stRt.anchorMax = new Vector2(1, 1);
            stRt.pivot = new Vector2(0.5f, 1); stRt.anchoredPosition = new Vector2(0, -20);
            stRt.sizeDelta = new Vector2(0, 50);
            panel.stakeText = stakeText;

            var stakeBtnRow = NewUI("StakeButtons", stakePanel.transform);
            var sbrRt = stakeBtnRow.GetComponent<RectTransform>();
            sbrRt.anchorMin = Vector2.zero; sbrRt.anchorMax = Vector2.one;
            sbrRt.offsetMin = new Vector2(0, 0); sbrRt.offsetMax = new Vector2(0, -50);
            var sbrLg = stakeBtnRow.AddComponent<HorizontalLayoutGroup>();
            sbrLg.childControlWidth = true; sbrLg.childForceExpandWidth = true; sbrLg.spacing = 8;
            sbrLg.padding = new RectOffset(24, 24, 0, 0);

            int[] vals = { 5, 10, 25, 50 };
            panel.stakeButtons = new Button[4];
            panel.stakeValues = vals;
            for (int i = 0; i < 4; i++)
            {
                var b = MakeButtonInPanel($"Btn{vals[i]}", stakeBtnRow.transform, $"{vals[i]} POL", Vector2.zero, Vector2.zero);
                panel.stakeButtons[i] = b.GetComponent<Button>();
            }

            // ── Lineup Grid (ScrollRect) ──
            var scroll = NewUI("LineupScroll", root.transform);
            var scrollRt = scroll.GetComponent<RectTransform>();
            scrollRt.anchorMin = new Vector2(0, 0); scrollRt.anchorMax = new Vector2(1, 1);
            scrollRt.offsetMin = new Vector2(0, 220); scrollRt.offsetMax = new Vector2(0, -300);
            var scrollRect = scroll.AddComponent<ScrollRect>();
            scrollRect.horizontal = false; scrollRect.vertical = true;

            var grid = NewUI("LineupGrid", scroll.transform);
            var gridRt = grid.GetComponent<RectTransform>();
            gridRt.anchorMin = Vector2.zero; gridRt.anchorMax = Vector2.one;
            gridRt.pivot = new Vector2(0.5f, 1);
            gridRt.anchoredPosition = new Vector2(0, 0);
            var gridLg = grid.AddComponent<GridLayoutGroup>();
            gridLg.cellSize = new Vector2(240, 300);
            gridLg.spacing = new Vector2(8, 8);
            gridLg.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            gridLg.constraintCount = 4;
            gridLg.padding = new RectOffset(12, 12, 12, 12);
            scrollRect.content = gridRt;

            string[] positions = { "GOL", "LAT", "LAT", "ZAG", "ZAG", "ZAG", "MEI", "MEI", "MEI", "ATA", "ATA" };
            panel.playerSlots = new CardSlot[11];
            for (int i = 0; i < 11; i++)
            {
                panel.playerSlots[i] = MakeCardSlot(grid.transform, $"PlayerSlot_{i}", positions[i]);
            }
            panel.coachSlot = MakeCardSlot(grid.transform, "CoachSlot", "TÉC");

            // ── Footer Info ──
            var footer = NewUI("FooterInfo", root.transform);
            var fRt = footer.GetComponent<RectTransform>();
            fRt.anchorMin = new Vector2(0, 0); fRt.anchorMax = new Vector2(1, 0);
            fRt.pivot = new Vector2(0.5f, 0); fRt.sizeDelta = new Vector2(0, 200);

            var ovrTxt = MakeText("TeamOvrText", footer.transform, "OVR do time: —  ·  Téc +0",
                24, new Vector2(0, 50), TextAlignmentOptions.Center);
            var ovrRt = ovrTxt.GetComponent<RectTransform>();
            ovrRt.anchorMin = new Vector2(0, 0); ovrRt.anchorMax = new Vector2(1, 0);
            ovrRt.pivot = new Vector2(0.5f, 0);
            ovrRt.anchoredPosition = new Vector2(0, 100);
            ovrRt.sizeDelta = new Vector2(0, 60);
            panel.teamOvrText = ovrTxt;

            var startBtn = MakeButtonInPanel("StartButton", footer.transform, "Escale 11 jog. + técnico", Vector2.zero, new Vector2(400, 100));
            var sbRt = startBtn.GetComponent<RectTransform>();
            sbRt.anchorMin = new Vector2(0.5f, 0); sbRt.anchorMax = new Vector2(0.5f, 0);
            sbRt.pivot = new Vector2(0.5f, 0); sbRt.anchoredPosition = new Vector2(0, 20);
            sbRt.sizeDelta = new Vector2(400, 100);
            panel.startButton = startBtn.GetComponent<Button>();
            panel.startButton.interactable = false;
            panel.startButtonText = startBtn.GetComponentInChildren<TMP_Text>();

            // ── Picker Panel (overlay) ──
            var picker = NewUI("PickerPanel", root.transform);
            var pkRt = picker.GetComponent<RectTransform>();
            Stretch(pkRt);
            picker.SetActive(false);
            panel.pickerPanel = picker;

            var pkBackdrop = NewUI("Backdrop", picker.transform);
            Stretch(pkBackdrop.GetComponent<RectTransform>());
            var pkImg = pkBackdrop.AddComponent<Image>();
            pkImg.color = new Color(0, 0, 0, 0.7f);
            var pkBtn = pkBackdrop.AddComponent<Button>();
            pkBtn.onClick.AddListener(() => picker.SetActive(false));

            var pkGrid = NewUI("PickerGrid", picker.transform);
            var pgRt = pkGrid.GetComponent<RectTransform>();
            pgRt.anchorMin = new Vector2(0, 0); pgRt.anchorMax = new Vector2(1, 1);
            pgRt.offsetMin = new Vector2(40, 200); pgRt.offsetMax = new Vector2(-40, -200);
            var pgLg = pkGrid.AddComponent<GridLayoutGroup>();
            pgLg.cellSize = new Vector2(240, 300);
            pgLg.spacing = new Vector2(8, 8);
            pgLg.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            pgLg.constraintCount = 3;
            panel.pickerGrid = pkGrid.transform;

            // dummy pickerCardPrefab: will need a real CardView prefab assigned in editor
            var dummyCard = NewUI("PickerCardPrefab_Dummy", pkGrid.transform);
            dummyCard.AddComponent<Image>().color = Color.gray;
            dummyCard.AddComponent<Button>();
            panel.pickerCardPrefab = PrefabUtility.SaveAsPrefabAsset(dummyCard, "Assets/Prefabs/PickerCard.prefab");
            dummyCard.SetActive(false);

            // ── Staked Confirm Modal ──
            var confirm = NewUI("StakedConfirmModal", root.transform);
            Stretch(confirm.GetComponent<RectTransform>());
            confirm.SetActive(false);
            panel.stakedConfirmModal = confirm;

            var cfBackdrop = NewUI("Backdrop", confirm.transform);
            Stretch(cfBackdrop.GetComponent<RectTransform>());
            cfBackdrop.AddComponent<Image>().color = new Color(0, 0, 0, 0.7f);

            var cfContent = NewUI("Content", confirm.transform);
            var cfCRt = cfContent.GetComponent<RectTransform>();
            cfCRt.anchorMin = new Vector2(0.5f, 0.5f); cfCRt.anchorMax = new Vector2(0.5f, 0.5f);
            cfCRt.pivot = new Vector2(0.5f, 0.5f); cfCRt.sizeDelta = new Vector2(600, 400);

            panel.confirmStakeValueText = MakeText("ConfirmStakeValueText", cfContent.transform, "Aposta: 25 POL",
                32, new Vector2(0, 100), TextAlignmentOptions.Center);
            panel.confirmWarningText = MakeText("ConfirmWarningText", cfContent.transform,
                "Valor total: 50 (você + oponente). Você só recupera se vencer. A casa retém 5% do pote.",
                22, new Vector2(0, -20), TextAlignmentOptions.Center);
            var warnRt = panel.confirmWarningText.GetComponent<RectTransform>();
            warnRt.sizeDelta = new Vector2(500, 100);

            var confirmBtn = MakeButtonInPanel("ConfirmStakeButton", cfContent.transform, "Confirmar aposta", Vector2.zero, new Vector2(260, 80));
            var confirmBtnRt = confirmBtn.GetComponent<RectTransform>();
            confirmBtnRt.anchoredPosition = new Vector2(-140, -120);
            panel.confirmStakeButton = confirmBtn.GetComponent<Button>();

            var cancelBtn = MakeButtonInPanel("CancelStakeButton", cfContent.transform, "Cancelar", Vector2.zero, new Vector2(260, 80));
            var cancelBtnRt = cancelBtn.GetComponent<RectTransform>();
            cancelBtnRt.anchoredPosition = new Vector2(140, -120);
            panel.cancelStakeButton = cancelBtn.GetComponent<Button>();

            // ── Battle Panel ──
            var battle = NewUI("BattlePanel", root.transform);
            Stretch(battle.GetComponent<RectTransform>());
            battle.SetActive(false);
            panel.battlePanel = battle;

            panel.battleStatus = MakeText("BattleStatus", battle.transform, "Preparando batalha…",
                32, new Vector2(0, 300), TextAlignmentOptions.Center);
            panel.scoreText = MakeText("ScoreText", battle.transform, "0 — 0",
                48, new Vector2(0, 200), TextAlignmentOptions.Center);

            var clashCont = NewUI("ClashContainer", battle.transform);
            var ccRt = clashCont.GetComponent<RectTransform>();
            ccRt.anchorMin = new Vector2(0, 0); ccRt.anchorMax = new Vector2(1, 1);
            ccRt.offsetMin = new Vector2(0, 200); ccRt.offsetMax = new Vector2(0, -200);
            clashCont.AddComponent<VerticalLayoutGroup>().spacing = 8;
            panel.clashContainer = clashCont.transform;

            var dummyClash = NewUI("ClashRowPrefab_Dummy", clashCont.transform);
            dummyClash.AddComponent<Image>().color = new Color(0.08f, 0.24f, 0.18f);
            var dummyClashRt = dummyClash.GetComponent<RectTransform>();
            dummyClashRt.sizeDelta = new Vector2(0, 120);
            panel.clashRowPrefab = PrefabUtility.SaveAsPrefabAsset(dummyClash, "Assets/Prefabs/ClashRow.prefab");
            dummyClash.SetActive(false);

            // result sub-panel
            var result = NewUI("ResultPanel", battle.transform);
            var resRt = result.GetComponent<RectTransform>();
            resRt.anchorMin = new Vector2(0.5f, 0); resRt.anchorMax = new Vector2(0.5f, 0);
            resRt.pivot = new Vector2(0.5f, 0); resRt.anchoredPosition = new Vector2(0, 40);
            resRt.sizeDelta = new Vector2(600, 200);
            result.SetActive(false);
            panel.resultPanel = result;

            panel.resultText = MakeText("ResultText", result.transform, "🏆 VITÓRIA!",
                56, new Vector2(0, 60), TextAlignmentOptions.Center);
            panel.resultDetail = MakeText("ResultDetail", result.transform, "Você levou 23! ELO +12",
                26, new Vector2(0, -20), TextAlignmentOptions.Center);

            // ── BattleController ──
            var bcGo = NewUI("BattleController", root.transform);
            var bc = bcGo.AddComponent<BattleController>();
            panel.battle = bc;

            return panel;
        }

        [MenuItem("CryptoÁlbum/Criar Prefab da Partida")]
        public static void CreateMatchScreenPrefab()
        {
            var root = new GameObject("PartidaPanel", typeof(RectTransform));
            BuildMatchScreenInPlace(root);

            System.IO.Directory.CreateDirectory("Assets/Prefabs");
            var path = "Assets/Prefabs/PartidaPanel.prefab";
            PrefabUtility.SaveAsPrefabAsset(root, path);
            Object.DestroyImmediate(root);
            Debug.Log($"[SceneBuilder] MatchScreen prefab criado em {path}");
            EditorUtility.FocusProjectWindow();
            Selection.activeObject = AssetDatabase.LoadAssetAtPath<GameObject>(path);
        }

        /// <summary>
        /// Cria um CardSlot prefab com CardView + EmptyState internos.
        /// </summary>
        private static CardSlot MakeCardSlot(Transform parent, string name, string position)
        {
            var go = NewUI(name, parent);
            var slot = go.AddComponent<CardSlot>();
            var rt = go.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(240, 300);

            var btn = go.AddComponent<Button>();
            slot.button = btn;

            // CardView child (hidden when empty)
            var cv = NewUI("CardView", go.transform);
            Stretch(cv.GetComponent<RectTransform>());
            cv.AddComponent<Image>().color = new Color(0.5f, 0.4f, 0.25f);
            var view = cv.AddComponent<CardView>();
            view.background = cv.GetComponent<Image>();
            view.ovrText = MakeText("OvrText", cv.transform, "99", 52, new Vector2(-80, 120), TextAlignmentOptions.Left);
            view.posText = MakeText("PosText", cv.transform, position, 24, new Vector2(-80, 80), TextAlignmentOptions.Left);
            view.nameText = MakeText("NameText", cv.transform, "NOME", 28, new Vector2(0, -20), TextAlignmentOptions.Center);
            view.rarityText = MakeText("RarityText", cv.transform, "#0001 · Comum", 16, new Vector2(0, -130), TextAlignmentOptions.Center);
            view.flagText = MakeText("FlagText", cv.transform, "BRA", 22, new Vector2(80, 120), TextAlignmentOptions.Right);
            cv.SetActive(false);
            slot.cardView = view;

            // EmptyState child
            var empty = NewUI("EmptyState", go.transform);
            Stretch(empty.GetComponent<RectTransform>());
            var emptyImg = empty.AddComponent<Image>();
            emptyImg.color = new Color(0.08f, 0.32f, 0.24f, 0.5f);
            slot.emptyState = empty;

            var label = MakeText("EmptyLabel", empty.transform, position, 32, Vector2.zero, TextAlignmentOptions.Center);
            label.color = new Color(0.96f, 0.91f, 0.82f, 0.5f);
            slot.emptyLabel = label;

            slot.expectedPosition = position;
            return slot;
        }

        /// <summary>
        /// Cria botão com fundo e texto, sem posicionamento especial (usado dentro de layouts).
        /// </summary>
        private static GameObject MakeButtonInPanel(string name, Transform parent, string label, Vector2 pos, Vector2 size)
        {
            var go = NewUI(name, parent);
            if (size != Vector2.zero)
            {
                var rt = go.GetComponent<RectTransform>();
                rt.sizeDelta = size;
                rt.anchoredPosition = pos;
            }
            var img = go.AddComponent<Image>();
            img.color = new Color(1f, 0.87f, 0f);
            img.type = Image.Type.Sliced;
            go.AddComponent<Button>();
            var t = MakeText("Label", go.transform, label, 28, Vector2.zero, TextAlignmentOptions.Center);
            t.color = new Color(0.04f, 0.18f, 0.13f);
            Stretch(t.GetComponent<RectTransform>());
            return go;
        }

        static GameObject NewUI(string name, Transform parent)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            return go;
        }

        static TextMeshProUGUI MakeText(string name, Transform parent, string text, float size, Vector2 pos, TextAlignmentOptions align)
        {
            var go = NewUI(name, parent);
            var t = go.AddComponent<TextMeshProUGUI>();
            t.text = text; t.fontSize = size; t.alignment = align;
            t.color = Color.white;
            var rt = go.GetComponent<RectTransform>();
            rt.anchoredPosition = pos;
            rt.sizeDelta = new Vector2(220, 50);
            return t;
        }

        static void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero; rt.offsetMax = Vector2.zero;
        }
    }
}
#endif
