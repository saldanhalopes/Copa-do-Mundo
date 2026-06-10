// test/CatalogTest.cs
// Teste standalone (sem Unity) para validar a lógica do catálogo e da batalha.
// Compila os arquivos de Data + Battle sem dependência de UnityEngine.
//
// Rodar:
//   csc /nologo /out:test.exe test/CatalogTest.cs \
//       unity/Assets/Scripts/Data/Card.cs \
//       unity/Assets/Scripts/Data/CountryDatabase.cs \
//       unity/Assets/Scripts/Data/CardCatalog.cs \
//       unity/Assets/Scripts/Battle/BattleEngine.cs
//   mono test.exe   (ou dotnet)

using System;
using CryptoAlbumCopa.Data;
using CryptoAlbumCopa.Battle;

class CatalogTest
{
    static int pass = 0, fail = 0;
    static void Check(string name, bool cond)
    {
        if (cond) { pass++; Console.WriteLine("  [OK] " + name); }
        else { fail++; Console.WriteLine("  [X]  FALHOU: " + name); }
    }

    static void Main()
    {
        Console.WriteLine("\n[1] Catálogo de 48 países");
        int total = CardCatalog.Total;
        Console.WriteLine($"      Total de figurinhas: {total}");
        Check("48 países gerados", CountryDatabase.Paises.Length == 48);
        Check("Total esperado (48*28 + 8 estádios = 1352)", total == 48 * 28 + 8);

        // contagem por tipo
        int jog = 0, tec = 0, est = 0, masc = 0;
        foreach (var c in CardCatalog.All)
        {
            if (c.Type == CardType.Jogador) jog++;
            else if (c.Type == CardType.Tecnico) tec++;
            else if (c.Type == CardType.Estadio) est++;
            else if (c.Type == CardType.Mascote) masc++;
        }
        Check("1104 jogadores (48*23)", jog == 1104);
        Check("48 técnicos", tec == 48);
        Check("48 mascotes", masc == 48);
        Check("8 estádios", est == 8);

        Console.WriteLine("\n[2] Determinismo (mesma carta para mesmo tokenId)");
        var c1a = CardCatalog.Get(1);
        var c1b = CardCatalog.Get(1);
        Check("Carta #1 é estável", c1a.Name == c1b.Name && c1a.Ovr == c1b.Ovr);
        Check("Carta #1 é goleiro do Brasil", c1a.CountryCode == "BRA" && c1a.Position == Position.GOL);

        Console.WriteLine("\n[3] Atributos por raridade");
        // o craque (idx 22) de cada país é lendário com OVR 87-92
        var craqueBra = CardCatalog.Get(23); // 23ª carta do Brasil
        Check("Craque do Brasil é Lendário", craqueBra.Rarity == Rarity.Lendaria);
        Check("Craque tem OVR 87-92", craqueBra.Ovr >= 87 && craqueBra.Ovr <= 92);

        Console.WriteLine("\n[4] Atributo decisivo na batalha");
        var gk = CardCatalog.Get(1); // goleiro -> DEF
        Check("Goleiro usa DEF na batalha", gk.BattleAttr() == gk.Attrs.DEF);
        // achar um atacante
        Card atk = null;
        foreach (var c in CardCatalog.All)
            if (c.Position == Position.ATA) { atk = c; break; }
        Check("Atacante usa SHO na batalha", atk != null && atk.BattleAttr() == atk.Attrs.SHO);

        Console.WriteLine("\n[5] Batalha PvP (11 + técnico, bônus do técnico)");
        var mine = MakeLineup(0);   // time do Brasil
        var theirs = MakeLineup(1); // time da Argentina
        Check("Escalação completa (11+téc)", mine.IsComplete() && theirs.IsComplete());

        var result = BattleEngine.Resolve(mine, theirs, 123456789UL);
        Check("5 confrontos resolvidos", result.Clashes.Count == 5);
        Check("Placar soma 5", result.ScoreMine + result.ScoreTheirs == 5);
        Check("Bônus do técnico aplicado", result.CoachBonusMine > 0);
        Console.WriteLine($"      Placar: {result.ScoreMine} x {result.ScoreTheirs} (téc +{result.CoachBonusMine} vs +{result.CoachBonusTheirs})");

        Console.WriteLine("\n[6] Batalha é determinística com mesma seed");
        var r2 = BattleEngine.Resolve(mine, theirs, 123456789UL);
        Check("Mesma seed = mesmo placar", r2.ScoreMine == result.ScoreMine);

        Console.WriteLine("\n[7] Time mais forte tende a vencer");
        int vitoriasForte = 0;
        for (ulong seed = 1; seed <= 50; seed++)
        {
            var forte = MakeLineup(0, onlyBest: true);  // só cartas boas
            var fraco = MakeLineup(20, onlyBest: false);
            var r = BattleEngine.Resolve(forte, fraco, seed * 99 + 1);
            if (r.Victory) vitoriasForte++;
        }
        Console.WriteLine($"      Time forte venceu {vitoriasForte}/50");
        Check("Time forte vence a maioria", vitoriasForte >= 30);

        Console.WriteLine("\n" + new string('-', 50));
        Console.WriteLine($"RESULTADO: {pass} passaram, {fail} falharam");
        Environment.Exit(fail > 0 ? 1 : 0);
    }

    // monta uma escalação a partir do elenco de um país
    static Lineup MakeLineup(int countryIdx, bool onlyBest = false)
    {
        var lineup = new Lineup();
        int baseId = countryIdx * 28 + 1; // primeira carta do país (28 por país)

        // 11 jogadores: pega os 11 primeiros (ou os melhores)
        int filled = 0;
        for (int i = 0; i < 23 && filled < 11; i++)
        {
            var c = CardCatalog.Get(baseId + i);
            if (c == null || !c.IsPlayer) continue;
            if (onlyBest && c.Ovr < 70) continue;
            lineup.PlayerTokenIds[filled++] = c.TokenId;
        }
        // se não encheu (onlyBest muito restritivo), completa com quem tiver
        for (int i = 0; i < 23 && filled < 11; i++)
        {
            var c = CardCatalog.Get(baseId + i);
            if (c != null && c.IsPlayer)
            {
                bool already = false;
                foreach (var id in lineup.PlayerTokenIds) if (id == c.TokenId) already = true;
                if (!already) lineup.PlayerTokenIds[filled++] = c.TokenId;
            }
        }

        // técnico = carta #24 do país (após 23 jogadores)
        var coach = CardCatalog.Get(baseId + 23);
        lineup.CoachTokenId = coach != null && coach.IsCoach ? coach.TokenId : 0;

        return lineup;
    }
}
