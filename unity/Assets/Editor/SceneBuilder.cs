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

        // ── helpers ──
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
