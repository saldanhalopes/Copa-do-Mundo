using System;
using System.Collections.Generic;

namespace CryptoAlbumCopa.Data
{
    /// <summary>
    /// Constrói o catálogo completo de figurinhas (mesma lógica do generate_catalog.py).
    /// Determinístico: o tokenId N sempre gera a mesma carta em qualquer cliente.
    /// </summary>
    public static class CardCatalog
    {
        private static List<Card> _all;
        private static Dictionary<int, Card> _byId;

        public static IReadOnlyList<Card> All { get { Ensure(); return _all; } }
        public static Card Get(int tokenId) { Ensure(); return _byId.TryGetValue(tokenId, out var c) ? c : null; }
        public static int Total { get { Ensure(); return _all.Count; } }

        static readonly string[] Prenomes = {"Léo","Bruno","Diego","Kael","Niko","Tariq","Yann","Omar","Luca","Eros","Ivo","Aki","Sami","Noé","Tomás","Rui","Jonas","Pavel","Igor","Hugo","Aron","Dário","Caio","Zé","Bira"};
        static readonly string[] Sobres = {"Silva","Costa","Mendez","Kovač","Diallo","Sato","Müller","Rossi","Okafor","Hassan","Park","Nilsson","Vidić","Aguirre","Laval","Bauer","Petrov","Haidar","Cruz","Santos","Lund","Reyes","Adeyemi","Toth","Bjørn"};

        static readonly int[][] OvrRange = { new[]{60,69}, new[]{70,79}, new[]{80,86}, new[]{87,92}, new[]{93,99} };

        // perfis e pesos por posição (PAC,SHO,PAS,DRI,DEF,PHY)
        static readonly Dictionary<Position, float[]> Perfis = new()
        {
            { Position.GOL, new[]{0.6f,0.3f,0.7f,0.5f,1.4f,1.2f} },
            { Position.ZAG, new[]{0.8f,0.4f,0.7f,0.6f,1.5f,1.3f} },
            { Position.LD,  new[]{1.3f,0.6f,1.1f,1.0f,1.2f,1.0f} },
            { Position.LE,  new[]{1.3f,0.6f,1.1f,1.0f,1.2f,1.0f} },
            { Position.VOL, new[]{0.9f,0.7f,1.2f,1.0f,1.3f,1.2f} },
            { Position.MEI, new[]{1.0f,1.1f,1.3f,1.2f,0.7f,0.9f} },
            { Position.PD,  new[]{1.4f,1.1f,1.0f,1.3f,0.5f,0.8f} },
            { Position.PE,  new[]{1.4f,1.1f,1.0f,1.3f,0.5f,0.8f} },
            { Position.CAM, new[]{1.1f,1.3f,1.3f,1.4f,0.5f,0.8f} },
            { Position.ATA, new[]{1.2f,1.4f,0.9f,1.2f,0.4f,0.9f} },
        };
        static readonly Dictionary<Position, float[]> OvrPesos = new()
        {
            { Position.GOL, new[]{.05f,.05f,.10f,.10f,.40f,.30f} },
            { Position.ZAG, new[]{.10f,.05f,.10f,.10f,.40f,.25f} },
            { Position.LD,  new[]{.20f,.10f,.20f,.15f,.25f,.10f} },
            { Position.LE,  new[]{.20f,.10f,.20f,.15f,.25f,.10f} },
            { Position.VOL, new[]{.10f,.10f,.25f,.15f,.25f,.15f} },
            { Position.MEI, new[]{.10f,.20f,.25f,.25f,.10f,.10f} },
            { Position.PD,  new[]{.25f,.20f,.15f,.25f,.05f,.10f} },
            { Position.PE,  new[]{.25f,.20f,.15f,.25f,.05f,.10f} },
            { Position.CAM, new[]{.15f,.25f,.25f,.25f,.05f,.05f} },
            { Position.ATA, new[]{.25f,.30f,.10f,.20f,.05f,.10f} },
        };

        static int Clamp(int v, int lo, int hi) => v < lo ? lo : (v > hi ? hi : v);

        static string NameFrom(int seed)
        {
            var r = new Random(seed);
            return $"{Prenomes[r.Next(Prenomes.Length)]} {Sobres[r.Next(Sobres.Length)]}";
        }

        static Rarity RarJogador(int idx)
        {
            if (idx == 22) return Rarity.Lendaria;
            if (idx == 0) return Rarity.Epica;
            if (idx == 14 || idx == 17 || idx == 21) return Rarity.Rara;
            return Rarity.Comum;
        }

        static Attributes GenAttrs(Position pos, Rarity rar, int seed)
        {
            var r = new Random(seed);
            int omin = OvrRange[(int)rar][0], omax = OvrRange[(int)rar][1];
            int alvo = r.Next(omin, omax + 1);
            var perfil = Perfis[pos];
            int[] vals = new int[6];
            for (int i = 0; i < 6; i++)
            {
                double v = alvo * (0.7 + 0.3 * perfil[i]) + (r.NextDouble() * 12 - 6);
                vals[i] = Clamp((int)Math.Round(v), 30, 99);
            }
            var pesos = OvrPesos[pos];
            double ovrD = 0;
            for (int i = 0; i < 6; i++) ovrD += vals[i] * pesos[i];
            int ovr = Clamp((int)Math.Round(ovrD), omin, omax);
            return new Attributes(vals[0], vals[1], vals[2], vals[3], vals[4], vals[5], ovr);
        }

        static void Ensure()
        {
            if (_all != null) return;
            _all = new List<Card>();
            int n = 1;

            for (int sel = 0; sel < CountryDatabase.Paises.Length; sel++)
            {
                var p = CountryDatabase.Paises[sel];
                string sig = p[0], nome = p[1], c1 = p[2], c2 = p[3], masc = p[4], curio = p[6];

                // 23 jogadores
                for (int i = 0; i < 23; i++)
                {
                    var pos = CountryDatabase.Posicoes23[i];
                    var rar = RarJogador(i);
                    _all.Add(new Card {
                        TokenId = n, Type = CardType.Jogador, Name = NameFrom(n * 13),
                        CountryCode = sig, CountryName = nome, CountryIndex = sel,
                        Position = pos, Rarity = rar, Attrs = GenAttrs(pos, rar, n * 31 + 7),
                        Shirt = i + 1, ColorPrimary = c1, ColorSecondary = c2
                    });
                    n++;
                }
                // técnico (bônus de força ao time)
                var rb = new Random(n * 7);
                _all.Add(new Card {
                    TokenId = n++, Type = CardType.Tecnico, Name = "Téc. " + NameFrom(n * 17),
                    CountryCode = sig, CountryName = nome, CountryIndex = sel,
                    Position = Position.TEC, Rarity = Rarity.Epica, CoachBonus = 3 + rb.Next(6),
                    ColorPrimary = c1, ColorSecondary = c2
                });
                // bandeira, brasão, mascote, curiosidade
                _all.Add(new Card { TokenId = n++, Type = CardType.Bandeira, Name = $"Bandeira {nome}", CountryCode = sig, CountryName = nome, CountryIndex = sel, Rarity = Rarity.Comum, ColorPrimary = c1, ColorSecondary = c2 });
                _all.Add(new Card { TokenId = n++, Type = CardType.Brasao, Name = $"Brasão {nome}", CountryCode = sig, CountryName = nome, CountryIndex = sel, Rarity = Rarity.Rara, ColorPrimary = c1, ColorSecondary = c2 });
                _all.Add(new Card { TokenId = n++, Type = CardType.Mascote, Name = masc, CountryCode = sig, CountryName = nome, CountryIndex = sel, Rarity = Rarity.Epica, ColorPrimary = c1, ColorSecondary = c2 });
                _all.Add(new Card { TokenId = n++, Type = CardType.Curiosidade, Name = "Você sabia?", Text = curio, CountryCode = sig, CountryName = nome, CountryIndex = sel, Rarity = Rarity.Rara, ColorPrimary = c1, ColorSecondary = c2 });
            }

            // estádios
            foreach (var e in CountryDatabase.Estadios)
            {
                _all.Add(new Card {
                    TokenId = n++, Type = CardType.Estadio, Name = e[0], Text = e[2],
                    CountryCode = "FIFA", CountryName = e[1], CountryIndex = 255,
                    Rarity = Rarity.Lendaria, ColorPrimary = "#0A2E22", ColorSecondary = "#FFDF00"
                });
            }

            _byId = new Dictionary<int, Card>();
            foreach (var c in _all) _byId[c.TokenId] = c;
        }
    }
}
