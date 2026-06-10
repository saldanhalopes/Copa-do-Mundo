using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Threading.Tasks;
using CryptoAlbumCopa.Web3Net;
using CryptoAlbumCopa.Game;

namespace CryptoAlbumCopa.UI
{
    /// <summary>
    /// Navegação principal por abas: alterna entre os 6 painéis de tela
    /// e gerencia o header (conectar carteira, saldo, rede).
    ///
    /// Setup: ligar os 6 painéis e 6 botões na ordem:
    /// Álbum, Pacotes, Partida, Ranking, Trocas, Vender.
    /// </summary>
    public class TabNavigator : MonoBehaviour
    {
        [Header("Painéis (6)")]
        public GameObject[] panels;

        [Header("Botões de aba (6)")]
        public Button[] tabButtons;

        [Header("Header")]
        public Button connectButton;
        public TMP_Text connectButtonText;
        public TMP_Text balanceText;
        public TMP_Text progressText;

        [Header("Progresso")]
        public Slider progressBar;

        private int _active = 0;

        void Start()
        {
            for (int i = 0; i < tabButtons.Length; i++)
            {
                int idx = i;
                tabButtons[i].onClick.AddListener(() => Show(idx));
            }
            if (connectButton != null) connectButton.onClick.AddListener(OnConnect);
            if (PlayerInventory.Instance != null)
                PlayerInventory.Instance.OnInventoryChanged += RefreshHeader;

            Show(0);
            RefreshHeader();
        }

        public void Show(int index)
        {
            _active = index;
            for (int i = 0; i < panels.Length; i++)
                if (panels[i] != null) panels[i].SetActive(i == index);

            for (int i = 0; i < tabButtons.Length; i++)
            {
                var img = tabButtons[i].GetComponent<Image>();
                if (img != null)
                    img.color = i == index ? new Color(0.95f, 0.91f, 0.82f)
                                           : new Color(0.95f, 0.91f, 0.82f, 0.08f);
            }
        }

        private async void OnConnect()
        {
            if (Web3Service.Instance == null) return;
            if (connectButtonText != null) connectButtonText.text = "Conectando…";
            bool ok = await Web3Service.Instance.ConnectWallet();
            if (ok)
            {
                await PlayerInventory.Instance.SyncFromChain();
                // se não veio nada da chain (stub), semeia demo
                if (PlayerInventory.Instance.UniqueCount() == 0)
                    PlayerInventory.Instance.SeedDemo();
            }
            RefreshHeader();
        }

        private void RefreshHeader()
        {
            bool connected = Web3Service.Instance != null && Web3Service.Instance.IsConnected;
            string sym = Web3Service.Instance != null ? Web3Service.Instance.ActiveNetwork.Symbol : "POL";

            if (connectButtonText != null)
                connectButtonText.text = connected
                    ? $"{(Web3Service.Instance.ConnectedAddress.Length > 8 ? Web3Service.Instance.ConnectedAddress.Substring(0, 6) + "…" : "carteira")}"
                    : "Conectar";

            if (balanceText != null) balanceText.gameObject.SetActive(connected);

            var inv = PlayerInventory.Instance;
            if (inv != null)
            {
                int total = Data.CardCatalog.Total;
                int owned = inv.UniqueCount();
                if (progressText != null) progressText.text = $"{owned}/{total}";
                if (progressBar != null) progressBar.value = total > 0 ? (float)owned / total : 0;
            }
        }
    }
}
