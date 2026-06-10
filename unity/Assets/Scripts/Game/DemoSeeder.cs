using UnityEngine;
using CryptoAlbumCopa.Game;

namespace CryptoAlbumCopa.Game
{
    /// <summary>
    /// Semeia o inventário de demo ao entrar no Play (para testar sem blockchain).
    /// Componente de runtime (vai no build).
    /// </summary>
    public class DemoSeeder : MonoBehaviour
    {
        public bool seedOnStart = true;

        void Start()
        {
            if (seedOnStart && PlayerInventory.Instance != null)
                PlayerInventory.Instance.SeedDemo();
        }
    }
}
