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
        public ulong Pack(Position pos, Rarity rar, int selecao)
        {
            return (ulong)PAC
                | ((ulong)SHO << 8)
                | ((ulong)PAS << 16)
                | ((ulong)DRI << 24)
                | ((ulong)DEF << 32)
                | ((ulong)PHY << 40)
                | ((ulong)OVR << 48)
                | ((ulong)(int)pos << 56)
                | ((ulong)(int)rar << 64 % 64); // nota: posições >63 exigem BigInteger on-chain
        }

        /// <summary>
        /// Desempacota de um ulong (para os 48 primeiros bits — atributos+ovr+pos).
        /// A raridade e seleção (bits 64+) vêm separados via BigInteger no Web3Service.
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
