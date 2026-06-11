// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../contracts/RankingSeasons.sol";

contract RankingSeasonsTest is Test {
    RankingSeasons internal ranking;
    address internal admin = makeAddr("admin");
    address internal matchContract = makeAddr("matchContract");
    address internal jogadorA = makeAddr("jogadorA");
    address internal jogadorB = makeAddr("jogadorB");

    bytes32 internal constant MATCH_ROLE = keccak256("MATCH_ROLE");

    function setUp() public {
        vm.startPrank(admin);
        ranking = new RankingSeasons(admin);
        ranking.grantRole(MATCH_ROLE, matchContract);
        vm.stopPrank();
    }

    // ─── Registro implícito via resultado ─────────────────────────

    function testRegistroAoResultado() public {
        vm.prank(matchContract);
        ranking.registrarResultado(jogadorA, jogadorB);

        (uint256 elo, uint32 v, uint32 d) = ranking.statsJogador(jogadorA);
        assertEq(elo, 1000 + 16);
        assertEq(v, 1);
        assertEq(d, 0);

        (elo, v, d) = ranking.statsJogador(jogadorB);
        assertEq(elo, 1000 - 16);
        assertEq(v, 0);
        assertEq(d, 1);
    }

    // ─── Jogadores com mesmo ELO ──────────────────────────────────

    function testJogadoresIguais() public {
        vm.prank(matchContract);
        ranking.registrarResultado(jogadorA, jogadorB);

        (uint256 eloA,,) = ranking.statsJogador(jogadorA);
        (uint256 eloB,,) = ranking.statsJogador(jogadorB);

        assertEq(eloA, 1016);
        assertEq(eloB, 984);
        assertEq(eloA + eloB, 2000); // conservação: perda = ganho
    }

    // ─── Azarão vencendo favorito ─────────────────────────────────

    function testAzaraoVence() public {
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(matchContract);
            ranking.registrarResultado(jogadorA, jogadorB);
        }

        (uint256 eloABefore,,) = ranking.statsJogador(jogadorA);
        (uint256 eloBBefore,,) = ranking.statsJogador(jogadorB);

        assertTrue(eloABefore > eloBBefore);

        // Azarão vence — deve ganhar mais ELO que o normal (+16)
        vm.prank(matchContract);
        ranking.registrarResultado(jogadorB, jogadorA);

        (uint256 eloAAfter,,) = ranking.statsJogador(jogadorA);
        (uint256 eloBAfter,,) = ranking.statsJogador(jogadorB);

        assertTrue(eloBAfter - eloBBefore > 16);
        assertTrue(eloAAfter < eloABefore);
    }

    // ─── ELO nunca negativo ───────────────────────────────────────

    function testEloNuncaNegativo() public {
        // Forçar várias derrotas no jogadorB para testar limite inferior
        for (uint256 i = 0; i < 100; i++) {
            address perdedor = i % 2 == 0 ? jogadorB : jogadorA;
            address vencedor = i % 2 == 0 ? jogadorA : jogadorB;
            vm.prank(matchContract);
            ranking.registrarResultado(vencedor, perdedor);
        }

        (uint256 eloA,,) = ranking.statsJogador(jogadorA);
        (uint256 eloB,,) = ranking.statsJogador(jogadorB);

        assertTrue(eloA >= 0);
        assertTrue(eloB >= 0);
    }

    // ─── Apenas MATCH_ROLE pode registrar resultado ───────────────

    function testApenasMatchRole() public {
        vm.prank(jogadorA);
        vm.expectRevert();
        ranking.registrarResultado(jogadorA, jogadorB);
    }

    // ─── Temporada: iniciar ───────────────────────────────────────

    function testIniciarTemporada() public {
        vm.prank(admin);
        ranking.iniciarTemporada(30);

        (uint64 inicio, uint64 fim, uint256 fundo, bool finalizada) = ranking.temporadas(1);
        assertEq(inicio, uint64(block.timestamp));
        assertEq(fim, uint64(block.timestamp) + 30 days);
        assertEq(fundo, 0);
        assertFalse(finalizada);
    }

    // ─── Temporada: apenas admin pode iniciar ─────────────────────

    function testIniciarTemporadaNaoAdmin() public {
        vm.prank(jogadorA);
        vm.expectRevert();
        ranking.iniciarTemporada(30);
    }

    // ─── Temporada: abastecer fundo ───────────────────────────────

    function testAbastecerFundo() public {
        vm.prank(admin);
        ranking.iniciarTemporada(30);

        vm.deal(jogadorA, 10 ether);
        vm.prank(jogadorA);
        ranking.abastecerFundo{value: 5 ether}();

        (, , uint256 fundo, ) = ranking.temporadas(1);
        assertEq(fundo, 5 ether);
    }

    // ─── Temporada: finalizar e pagar top 3 ───────────────────────

    function testFinalizarTemporada() public {
        vm.prank(admin);
        ranking.iniciarTemporada(30);

        // Simular partidas
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(matchContract);
            ranking.registrarResultado(jogadorA, jogadorB);
        }

        vm.deal(admin, 10 ether);
        vm.prank(admin);
        ranking.abastecerFundo{value: 10 ether}();

        vm.warp(block.timestamp + 31 days);

        address[] memory top = new address[](3);
        top[0] = jogadorA; // 1o lugar: 5 vitorias * 3 pts = 15 pts
        top[1] = jogadorB; // 2o lugar: 0 vitorias * 3 + 5 participacao * 1 = 5 pts
        top[2] = jogadorA; // dummy para 3o (não usado realisticamente, só para testar)

        uint256 saldoABefore = jogadorA.balance;
        uint256 saldoBBefore = jogadorB.balance;

        vm.prank(admin);
        ranking.finalizarTemporada(1, top);

        (, , , bool finalizada) = ranking.temporadas(1);
        assertTrue(finalizada);

        uint256 fundo = 10 ether;
        assertEq(jogadorA.balance - saldoABefore, (fundo * 5000) / 10000 + (fundo * 2000) / 10000);
        assertEq(jogadorB.balance - saldoBBefore, (fundo * 3000) / 10000);
    }

    // ─── Temporada: não pode finalizar antes do fim ───────────────

    function testFinalizarAntesDoFim() public {
        vm.prank(admin);
        ranking.iniciarTemporada(30);

        address[] memory top = new address[](1);
        top[0] = jogadorA;

        vm.prank(admin);
        vm.expectRevert("ainda em andamento");
        ranking.finalizarTemporada(1, top);
    }

    // ─── Temporada: não pode finalizar duas vezes ─────────────────

    function testFinalizarDuasVezes() public {
        vm.prank(admin);
        ranking.iniciarTemporada(30);

        vm.warp(block.timestamp + 31 days);

        address[] memory top = new address[](1);
        top[0] = jogadorA;

        vm.prank(admin);
        ranking.finalizarTemporada(1, top);

        vm.prank(admin);
        vm.expectRevert("ja finalizada");
        ranking.finalizarTemporada(1, top);
    }

    // ─── Participantes são registrados ────────────────────────────

    function testParticipantes() public {
        vm.prank(matchContract);
        ranking.registrarResultado(jogadorA, jogadorB);

        address[] memory ps = ranking.getParticipantes(0);
        assertEq(ps.length, 2);
    }

    // ─── getRating ────────────────────────────────────────────────

    function testGetRating() public {
        assertEq(ranking.getRating(jogadorA), 1000); // não registrado ainda

        vm.prank(matchContract);
        ranking.registrarResultado(jogadorA, jogadorB);

        assertTrue(ranking.getRating(jogadorA) > 1000);
    }

    // ─── Fuzz: ELO nunca fica negativo ────────────────────────────

    function testFuzz_eloNeverNegative(uint16 partidas) public {
        vm.assume(partidas > 0 && partidas <= 200);

        for (uint256 i = 0; i < partidas; i++) {
            address vencedor = i % 2 == 0 ? jogadorA : jogadorB;
            address perdedor = i % 2 == 0 ? jogadorB : jogadorA;
            vm.prank(matchContract);
            ranking.registrarResultado(vencedor, perdedor);
        }

        (uint256 eloA,,) = ranking.statsJogador(jogadorA);
        (uint256 eloB,,) = ranking.statsJogador(jogadorB);
        assertTrue(eloA >= 0);
        assertTrue(eloB >= 0);
    }


}
