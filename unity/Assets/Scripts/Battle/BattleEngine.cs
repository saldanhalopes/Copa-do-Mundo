using System;
using System.Collections.Generic;
using CryptoAlbumCopa.Data;

namespace CryptoAlbumCopa.Battle
{
    /// <summary>
    /// Resultado de um confronto individual (1 das 5 disputas).
    /// </summary>
    public struct Clash
    {
        public Card Mine;
        public Card Theirs;
        public int ForceMine;
        public int ForceTheirs;
        public bool Won;
        public string AttrUsed;
    }

    /// <summary>
    /// Resultado completo de uma partida.
    /// </summary>
    public class BattleResult
    {
        public List<Clash> Clashes = new();
        public int ScoreMine;
        public int ScoreTheirs;
        public bool Victory => ScoreMine >= ScoreTheirs;
        public int CoachBonusMine;
        public int CoachBonusTheirs;
    }

    /// <summary>
    /// Escalação de um jogador para a partida.
    /// 11 jogadores + 1 técnico. Na batalha, 5 confrontos-chave são sorteados
    /// das posições, mas o time inteiro e o técnico influenciam o resultado.
    /// </summary>
    public class Lineup
    {
        public int[] PlayerTokenIds = new int[11]; // 11 jogadores
        public int CoachTokenId;                    // 1 técnico

        public bool IsComplete()
        {
            if (CoachTokenId == 0) return false;
            foreach (var id in PlayerTokenIds) if (id == 0) return false;
            return true;
        }

        public int TeamOvr()
        {
            int sum = 0;
            foreach (var id in PlayerTokenIds)
            {
                var c = CardCatalog.Get(id);
                if (c != null) sum += c.Ovr;
            }
            return sum;
        }

        public int CoachBonus()
        {
            var coach = CardCatalog.Get(CoachTokenId);
            return coach?.CoachBonus ?? 0;
        }
    }

    /// <summary>
    /// Motor de batalha. Espelha MatchEscrow._forcaCarta e a resolução de confrontos.
    /// O fator aleatório vem do VRF on-chain; aqui aceitamos uma seed para
    /// reprodutibilidade (no jogo real, a seed é o número VRF da partida).
    /// </summary>
    public static class BattleEngine
    {
        // Os 5 confrontos-chave usam os "melhores" jogadores por linha.
        // Cada confronto compara força = OVR*2 + atributo_decisivo + fator_VRF(0-9) + bônus_técnico/11
        private static readonly Position[] ClashPositions =
        {
            Position.GOL, Position.ZAG, Position.MEI, Position.PD, Position.CAM
        };

        public static BattleResult Resolve(Lineup mine, Lineup theirs, ulong vrfSeed)
        {
            var result = new BattleResult
            {
                CoachBonusMine = mine.CoachBonus(),
                CoachBonusTheirs = theirs.CoachBonus()
            };

            // distribui o bônus do técnico por confronto
            int bonusMinePerClash = result.CoachBonusMine;
            int bonusTheirsPerClash = result.CoachBonusTheirs;

            var mineCards = SelectClashCards(mine);
            var theirsCards = SelectClashCards(theirs);

            for (int i = 0; i < 5; i++)
            {
                var cm = mineCards[i];
                var ct = theirsCards[i];

                int rM = (int)(Hash(vrfSeed, i, true) % 10);
                int rT = (int)(Hash(vrfSeed, i, false) % 10);

                int fM = Force(cm, rM) + bonusMinePerClash;
                int fT = Force(ct, rT) + bonusTheirsPerClash;

                bool won = fM >= fT;
                if (won) result.ScoreMine++; else result.ScoreTheirs++;

                result.Clashes.Add(new Clash
                {
                    Mine = cm, Theirs = ct,
                    ForceMine = fM, ForceTheirs = fT,
                    Won = won, AttrUsed = AttrName(cm.Position)
                });
            }

            return result;
        }

        /// <summary>
        /// Seleciona as 5 cartas que entram nos confrontos-chave,
        /// preferindo cartas na posição esperada de cada confronto.
        /// </summary>
        private static List<Card> SelectClashCards(Lineup lineup)
        {
            var cards = new List<Card>();
            var used = new HashSet<int>();

            foreach (var wantPos in ClashPositions)
            {
                Card best = null;
                foreach (var id in lineup.PlayerTokenIds)
                {
                    if (used.Contains(id)) continue;
                    var c = CardCatalog.Get(id);
                    if (c == null) continue;
                    // prioriza posição compatível, senão maior OVR
                    bool match = SamePositionGroup(c.Position, wantPos);
                    if (best == null
                        || (match && !SamePositionGroup(best.Position, wantPos))
                        || (match == SamePositionGroup(best.Position, wantPos) && c.Ovr > best.Ovr))
                    {
                        best = c;
                    }
                }
                if (best != null) { cards.Add(best); used.Add(best.TokenId); }
            }

            // completa se faltou alguém
            foreach (var id in lineup.PlayerTokenIds)
            {
                if (cards.Count >= 5) break;
                if (used.Contains(id)) continue;
                var c = CardCatalog.Get(id);
                if (c != null) { cards.Add(c); used.Add(id); }
            }
            return cards;
        }

        private static bool SamePositionGroup(Position a, Position want)
        {
            bool DefGroup(Position p) => p == Position.GOL || p == Position.ZAG || p == Position.LD || p == Position.LE;
            bool MidGroup(Position p) => p == Position.VOL || p == Position.MEI;
            bool AtkGroup(Position p) => p == Position.PD || p == Position.PE || p == Position.CAM || p == Position.ATA;

            if (want == Position.GOL || want == Position.ZAG) return DefGroup(a);
            if (want == Position.MEI) return MidGroup(a);
            return AtkGroup(a);
        }

        public static int Force(Card c, int rand)
        {
            return c.Ovr * 2 + c.BattleAttr() + rand;
        }

        private static string AttrName(Position pos)
        {
            switch (pos)
            {
                case Position.GOL:
                case Position.ZAG:
                case Position.LD:
                case Position.LE: return "DEF";
                case Position.PD:
                case Position.PE:
                case Position.CAM:
                case Position.ATA: return "SHO";
                default: return "PAS";
            }
        }

        // hash determinístico (substitui keccak do contrato no cliente)
        private static ulong Hash(ulong seed, int idx, bool side)
        {
            unchecked
            {
                ulong h = seed ^ ((ulong)idx * 0x9E3779B97F4A7C15UL) ^ (side ? 0xD1B54A32D192ED03UL : 0UL);
                h ^= h >> 33; h *= 0xFF51AFD7ED558CCDUL; h ^= h >> 33;
                return h;
            }
        }
    }
}
