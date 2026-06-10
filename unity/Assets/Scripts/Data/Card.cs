using System;

namespace CryptoAlbumCopa.Data
{
    /// <summary>
    /// Tipos de figurinha (espelha generate_catalog.py).
    /// </summary>
    public enum CardType
    {
        Jogador = 0,
        Tecnico = 1,
        Bandeira = 2,
        Brasao = 3,
        Mascote = 4,
        Estadio = 5,
        Curiosidade = 6
    }

    /// <summary>
    /// Raridade -> faixa de OVR. Espelha o CardStats.sol e o gerador.
    /// </summary>
    public enum Rarity
    {
        Comum = 0,
        Rara = 1,
        Epica = 2,
        Lendaria = 3,
        Mitica = 4
    }

    public enum Position
    {
        GOL = 0, ZAG = 1, LD = 2, LE = 3, VOL = 4,
        MEI = 5, PD = 6, PE = 7, CAM = 8, ATA = 9, TEC = 10
    }

    /// <summary>
    /// Atributos estilo FIFA (1-99). Imutáveis depois da cunhagem.
    /// </summary>
    [Serializable]
    public struct Attributes
    {
        public int PAC; // ritmo
        public int SHO; // finalização
        public int PAS; // passe
        public int DRI; // drible
        public int DEF; // defesa
        public int PHY; // físico
        public int OVR; // overall

        public Attributes(int pac, int sho, int pas, int dri, int def, int phy, int ovr)
        {
            PAC = pac; SHO = sho; PAS = pas; DRI = dri; DEF = def; PHY = phy; OVR = ovr;
        }

        /// <summary>
        /// Empacota os atributos em ulong, no mesmo layout do CardStats.sol.
        /// </summary>
        /// <summary>
        /// Empacota TODOS os campos como BigInteger, exatamente no layout do
        /// CardStats.sol (uint256). Raridade (bit 64) e seleção (bit 72) ficam
        /// além dos 64 bits de um ulong, por isso usamos BigInteger.
        /// </summary>
        public System.Numerics.BigInteger PackFull(Position pos, Rarity rar, int selecao)
        {
            System.Numerics.BigInteger p = PAC;
            p |= (System.Numerics.BigInteger)SHO << 8;
            p |= (System.Numerics.BigInteger)PAS << 16;
            p |= (System.Numerics.BigInteger)DRI << 24;
            p |= (System.Numerics.BigInteger)DEF << 32;
            p |= (System.Numerics.BigInteger)PHY << 40;
            p |= (System.Numerics.BigInteger)OVR << 48;
            p |= (System.Numerics.BigInteger)(int)pos << 56;
            p |= (System.Numerics.BigInteger)(int)rar << 64;
            p |= (System.Numerics.BigInteger)selecao << 72;
            return p;
        }

        /// <summary>
        /// Empacota apenas os 64 primeiros bits (atributos + OVR + posição) em ulong.
        /// Útil para comparações locais rápidas; a versão on-chain é PackFull.
        /// </summary>
        public ulong PackLow(Position pos)
        {
            return (ulong)PAC
                | ((ulong)SHO << 8)
                | ((ulong)PAS << 16)
                | ((ulong)DRI << 24)
                | ((ulong)DEF << 32)
                | ((ulong)PHY << 40)
                | ((ulong)OVR << 48)
                | ((ulong)(int)pos << 56);
        }

        /// <summary>
        /// Desempacota um BigInteger no layout do contrato (campos completos).
        /// </summary>
        public static (Attributes attrs, Position pos, Rarity rar, int selecao) UnpackFull(System.Numerics.BigInteger packed)
        {
            int B(int shift) => (int)((packed >> shift) & 0xFF);
            var a = new Attributes(B(0), B(8), B(16), B(24), B(32), B(40), B(48));
            return (a, (Position)B(56), (Rarity)B(64), B(72));
        }

        /// <summary>
        /// Desempacota de um ulong (só os 56 primeiros bits: atributos+ovr+pos).
        /// </summary>
        public static Attributes Unpack(ulong packed)
        {
            byte B(int shift) => (byte)((packed >> shift) & 0xFF);
            return new Attributes(B(0), B(8), B(16), B(24), B(32), B(40), B(48));
        }
    }

    /// <summary>
    /// Representação de uma carta/figurinha no cliente Unity.
    /// O tokenId é a chave que liga ao NFT ERC-1155 on-chain.
    /// </summary>
    [Serializable]
    public class Card
    {
        public int TokenId;
        public CardType Type;
        public string Name;
        public string CountryCode;    // "BRA", "ARG"...
        public string CountryName;
        public int CountryIndex;      // 0-47 (selecao no contrato)
        public Position Position;
        public Rarity Rarity;
        public Attributes Attrs;      // só para Jogador
        public int Shirt;             // número da camisa
        public int CoachBonus;        // só para Técnico: bônus de força ao time
        public string Text;           // curiosidade / descrição de estádio
        public string ColorPrimary;   // hex
        public string ColorSecondary; // hex

        public bool IsPlayer => Type == CardType.Jogador;
        public bool IsCoach => Type == CardType.Tecnico;
        public int Ovr => Attrs.OVR;

        public string RarityName => Rarity switch
        {
            Rarity.Comum => "Comum",
            Rarity.Rara => "Rara",
            Rarity.Epica => "Épica",
            Rarity.Lendaria => "Lendária",
            Rarity.Mitica => "Mítica",
            _ => "?"
        };

        /// <summary>
        /// Atributo decisivo na batalha conforme a posição (espelha MatchEscrow._forcaCarta).
        /// </summary>
        public int BattleAttr()
        {
            switch (Position)
            {
                case Position.GOL:
                case Position.ZAG:
                case Position.LD:
                case Position.LE:
                    return Attrs.DEF;
                case Position.PD:
                case Position.PE:
                case Position.CAM:
                case Position.ATA:
                    return Attrs.SHO;
                default:
                    return Attrs.PAS;
            }
        }
    }
}
