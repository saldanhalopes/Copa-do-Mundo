using System.Collections;
using System.Numerics;
using System.Threading.Tasks;
using UnityEngine;
using CryptoAlbumCopa.Data;
using CryptoAlbumCopa.Battle;
using CryptoAlbumCopa.Web3Net;
using CryptoAlbumCopa.Game;

namespace CryptoAlbumCopa.Game
{
    /// <summary>
    /// Orquestra uma partida PvP do início ao fim:
    /// 1) valida escalação (11 + técnico)
    /// 2) deposita stake no MatchEscrow (on-chain)
    /// 3) faz matchmaking por ELO
    /// 4) resolve a batalha com a seed do VRF
    /// 5) anima os 5 confrontos e mostra o resultado
    ///
    /// Anexar a um GameObject na cena de Partida. Ligar eventos à UI.
    /// </summary>
    public class BattleController : MonoBehaviour
    {
        [Header("Config")]
        public float clashRevealDelay = 0.8f;

        public Lineup MyLineup = new();

        // eventos para a UI assinar
        public event System.Action OnMatchmaking;
        public event System.Action<Clash, int, int> OnClashRevealed; // clash, placarMine, placarTheirs
        public event System.Action<BattleResult, bool, int> OnBattleEnd; // result, victory, eloDelta

        private BattleResult _pending;
        private bool _victory;
        private int _eloDelta;

        /// <summary>
        /// Inicia uma partida apostando `stake` (em unidade da moeda da rede).
        /// </summary>
        public async void StartMatch(BigInteger stakeWei)
        {
            if (!MyLineup.IsComplete())
            {
                Debug.LogWarning("[Battle] Escale 11 jogadores + 1 técnico.");
                return;
            }

            OnMatchmaking?.Invoke();

            // 1) deposita stake on-chain (MatchEscrow.criarPartida)
            if (Web3Service.Instance != null && Web3Service.Instance.IsConnected)
            {
                var team = MyLineup.PlayerTokenIds; // 11 ids (o contrato pode receber 11+coach)
                await Web3Service.Instance.CreateMatch(team, stakeWei);
            }

            // 2) matchmaking por ELO (no jogo real: servidor de matchmaking pareia)
            var opponent = await Matchmake();

            // 3) seed do VRF (no jogo real vem do callback Chainlink/Binance Oracle)
            ulong vrfSeed = (ulong)System.DateTime.UtcNow.Ticks;

            // 4) resolve
            _pending = BattleEngine.Resolve(MyLineup, opponent, vrfSeed);
            _victory = _pending.Victory;

            int myElo = PlayerInventory.Instance != null ? PlayerInventory.Instance.Elo : 1000;
            _eloDelta = ComputeEloDelta(myElo, _opponentElo, _victory);

            // 5) anima
            StartCoroutine(RevealClashes());
        }

        private int _opponentElo = 1000;

        private async Task<Lineup> Matchmake()
        {
            // pareia adversário com ELO próximo (±150). No demo, monta um bot.
            int myElo = PlayerInventory.Instance != null ? PlayerInventory.Instance.Elo : 1000;
            _opponentElo = Mathf.Max(600, myElo + Random.Range(-150, 151));
            await Task.Delay(800);
            return BuildBotLineup();
        }

        private IEnumerator RevealClashes()
        {
            int pm = 0, pt = 0;
            yield return new WaitForSeconds(0.5f);
            foreach (var clash in _pending.Clashes)
            {
                if (clash.Won) pm++; else pt++;
                OnClashRevealed?.Invoke(clash, pm, pt);
                yield return new WaitForSeconds(clashRevealDelay);
            }
            yield return new WaitForSeconds(0.3f);

            // atualiza inventário/ELO localmente (após confirmação on-chain)
            PlayerInventory.Instance?.RecordMatch(_victory, _eloDelta);
            OnBattleEnd?.Invoke(_pending, _victory, _eloDelta);
        }

        // ELO (espelha RankingSeasons._expectativa)
        public static int ComputeEloDelta(int myElo, int oppElo, bool won)
        {
            float exp;
            if (myElo >= oppElo)
            {
                float e = 5000 + ((myElo - oppElo) * 4500f) / 400f;
                exp = e > 9500 ? 9500 : e;
            }
            else
            {
                float e = ((oppElo - myElo) * 4500f) / 400f;
                exp = e > 4500 ? 500 : 5000 - e;
            }
            return Mathf.FloorToInt((32f * ((won ? 10000f : 0f) - exp)) / 10000f);
        }

        // monta um time-bot a partir de um país aleatório (demo)
        private Lineup BuildBotLineup()
        {
            var lineup = new Lineup();
            int country = Random.Range(0, 48);
            int baseId = country * 28 + 1;
            int filled = 0;
            for (int i = 0; i < 23 && filled < 11; i++)
            {
                var c = CardCatalog.Get(baseId + i);
                if (c != null && c.IsPlayer) lineup.PlayerTokenIds[filled++] = c.TokenId;
            }
            var coach = CardCatalog.Get(baseId + 23);
            lineup.CoachTokenId = coach != null && coach.IsCoach ? coach.TokenId : 0;
            return lineup;
        }
    }
}
