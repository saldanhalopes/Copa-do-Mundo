// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../contracts/MatchEscrow.sol";
import "./mocks/MockERC1155.sol";
import "./mocks/MockCardStats.sol";

contract MatchEscrowTest is Test {
    MockERC1155 internal figurinhas;
    MockCardStats internal stats;
    MatchEscrow internal escrow;
    address internal admin = makeAddr("admin");
    address internal tesouro = makeAddr("tesouro");
    address internal jogadorA = makeAddr("jogadorA");
    address internal jogadorB = makeAddr("jogadorB");
    address internal resolver = makeAddr("resolver");

    uint256 internal tokenGoleiro = 1;
    uint256 internal tokenZagueiro = 2;
    uint256 internal tokenMeia = 3;
    uint256 internal tokenAtacante = 4;
    uint256 internal tokenAtacante2 = 5;

    function setUp() public {
        vm.startPrank(admin);

        figurinhas = new MockERC1155();
        stats = new MockCardStats();
        escrow = new MatchEscrow(address(figurinhas), address(stats), tesouro, admin);
        escrow.grantRole(escrow.RESOLVER_ROLE(), resolver);

        figurinhas.mint(jogadorA, tokenGoleiro, 1);
        figurinhas.mint(jogadorA, tokenZagueiro, 1);
        figurinhas.mint(jogadorA, tokenMeia, 1);
        figurinhas.mint(jogadorA, tokenAtacante, 1);
        figurinhas.mint(jogadorA, tokenAtacante2, 1);

        figurinhas.mint(jogadorB, tokenGoleiro, 1);
        figurinhas.mint(jogadorB, tokenZagueiro, 1);
        figurinhas.mint(jogadorB, tokenMeia, 1);
        figurinhas.mint(jogadorB, tokenAtacante, 1);
        figurinhas.mint(jogadorB, tokenAtacante2, 1);

        stats.setCarta(tokenGoleiro, ICardStats.Carta(50, 40, 55, 45, 80, 75, 70, 0, 0, 0));
        stats.setCarta(tokenZagueiro, ICardStats.Carta(60, 35, 60, 50, 85, 80, 75, 1, 0, 0));
        stats.setCarta(tokenMeia, ICardStats.Carta(75, 70, 85, 80, 60, 65, 78, 5, 0, 0));
        stats.setCarta(tokenAtacante, ICardStats.Carta(90, 88, 75, 82, 30, 70, 82, 8, 0, 0));
        stats.setCarta(tokenAtacante2, ICardStats.Carta(95, 92, 70, 85, 25, 65, 85, 6, 0, 0));

        vm.stopPrank();
    }

    function _timeA() internal view returns (uint256[5] memory) {
        return [tokenGoleiro, tokenZagueiro, tokenMeia, tokenAtacante, tokenAtacante2];
    }

    function _timeB() internal view returns (uint256[5] memory) {
        return [tokenAtacante, tokenMeia, tokenZagueiro, tokenAtacante2, tokenGoleiro];
    }

    // ─── Criar partida ─────────────────────────────────────────────

    function testCriarPartida() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        MatchEscrow.Partida memory p = escrow.getPartida(id);
        assertEq(uint256(p.estado), uint256(MatchEscrow.Estado.Aberta));
        assertEq(p.jogadorA, jogadorA);
        assertEq(p.stake, 1 ether);
        assertEq(p.jogadorB, address(0));
    }

    function testCriarPartidaStakeZero() public {
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 0}(_timeA());

        MatchEscrow.Partida memory p = escrow.getPartida(id);
        assertEq(uint256(p.estado), uint256(MatchEscrow.Estado.Aberta));
        assertEq(p.jogadorA, jogadorA);
        assertEq(p.stake, 0);
        assertEq(p.jogadorB, address(0));
    }

    function testCriarPartidaSemCarta() public {
        address jogadorSemCarta = makeAddr("semCarta");
        vm.deal(jogadorSemCarta, 1 ether);
        vm.prank(jogadorSemCarta);
        vm.expectRevert(abi.encodeWithSelector(MatchEscrow.NaoPossuiCarta.selector, tokenGoleiro));
        escrow.criarPartida{value: 1 ether}(_timeA());
    }

    // ─── Aceitar partida ───────────────────────────────────────────

    function testAceitarPartida() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        vm.deal(jogadorB, 1 ether);
        vm.prank(jogadorB);
        escrow.aceitarPartida{value: 1 ether}(id, _timeB());

        MatchEscrow.Partida memory p = escrow.getPartida(id);
        assertEq(uint256(p.estado), uint256(MatchEscrow.Estado.Pronta));
        assertEq(p.jogadorB, jogadorB);
    }

    function testAceitarPartidaStakeIncorreto() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        vm.deal(jogadorB, 2 ether);
        vm.prank(jogadorB);
        vm.expectRevert(abi.encodeWithSelector(MatchEscrow.StakeIncorreto.selector));
        escrow.aceitarPartida{value: 2 ether}(id, _timeB());
    }

    function testAceitarPartidaContraSi() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        vm.expectRevert("nao pode jogar contra si");
        escrow.aceitarPartida{value: 1 ether}(id, _timeB());
    }

    function testAceitarPartidaEstadoInvalido() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        vm.deal(jogadorB, 1 ether);
        vm.prank(jogadorB);
        escrow.aceitarPartida{value: 1 ether}(id, _timeB());

        vm.deal(jogadorB, 1 ether);
        vm.prank(jogadorB);
        vm.expectRevert(abi.encodeWithSelector(MatchEscrow.EstadoInvalido.selector));
        escrow.aceitarPartida{value: 1 ether}(id, _timeB());
    }

    // ─── Resolver partida ──────────────────────────────────────────

    function testResolver() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        vm.deal(jogadorB, 1 ether);
        vm.prank(jogadorB);
        escrow.aceitarPartida{value: 1 ether}(id, _timeB());

        uint256 tesouroSaldoBefore = tesouro.balance;
        uint256 jogadorASaldoBefore = jogadorA.balance;
        uint256 jogadorBSaldoBefore = jogadorB.balance;

        vm.prank(resolver);
        escrow.resolver(id, 12345);

        MatchEscrow.Partida memory p = escrow.getPartida(id);
        assertEq(uint256(p.estado), uint256(MatchEscrow.Estado.Resolvida));
        assertTrue(p.vencedor == jogadorA || p.vencedor == jogadorB);

        uint256 pote = 2 ether;
        uint256 taxa = (pote * 500) / 10000;
        uint256 premio = pote - taxa;

        assertEq(tesouro.balance - tesouroSaldoBefore, taxa);
        assertEq(p.vencedor.balance - (p.vencedor == jogadorA ? jogadorASaldoBefore : jogadorBSaldoBefore), premio);
    }

    function testResolverEstadoInvalido() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        vm.prank(resolver);
        vm.expectRevert(abi.encodeWithSelector(MatchEscrow.EstadoInvalido.selector));
        escrow.resolver(id, 12345);
    }

    function testResolverSomenteRole() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        vm.deal(jogadorB, 1 ether);
        vm.prank(jogadorB);
        escrow.aceitarPartida{value: 1 ether}(id, _timeB());

        vm.prank(jogadorA);
        vm.expectRevert();
        escrow.resolver(id, 12345);
    }

    // ─── Cancelar por timeout ──────────────────────────────────────

    function testCancelarTimeout() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        uint256 saldoAntes = jogadorA.balance;

        vm.warp(block.timestamp + 2 hours);
        vm.prank(jogadorA);
        escrow.cancelar(id);

        MatchEscrow.Partida memory p = escrow.getPartida(id);
        assertEq(uint256(p.estado), uint256(MatchEscrow.Estado.Cancelada));
        assertEq(jogadorA.balance - saldoAntes, 1 ether);
    }

    function testCancelarAntesDoTimeout() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        vm.warp(block.timestamp + 30 minutes);
        vm.prank(jogadorA);
        vm.expectRevert("aguarde timeout");
        escrow.cancelar(id);
    }

    function testCancelarNaoCriador() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        vm.warp(block.timestamp + 2 hours);
        vm.prank(jogadorB);
        vm.expectRevert("so o criador");
        escrow.cancelar(id);
    }

    function testCancelarEstadoInvalido() public {
        vm.deal(jogadorA, 1 ether);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 1 ether}(_timeA());

        vm.deal(jogadorB, 1 ether);
        vm.prank(jogadorB);
        escrow.aceitarPartida{value: 1 ether}(id, _timeB());

        vm.warp(block.timestamp + 2 hours);
        vm.prank(jogadorA);
        vm.expectRevert(abi.encodeWithSelector(MatchEscrow.EstadoInvalido.selector));
        escrow.cancelar(id);
    }

    // ─── Partida casual (stake = 0) ─────────────────────────────────

    function testPartidaCasualStakeZero() public {
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 0}(_timeA());

        vm.prank(jogadorB);
        escrow.aceitarPartida{value: 0}(id, _timeB());

        uint256 tesouroSaldoBefore = tesouro.balance;
        uint256 jogadorASaldoBefore = jogadorA.balance;
        uint256 jogadorBSaldoBefore = jogadorB.balance;

        vm.prank(resolver);
        escrow.resolver(id, 54321);

        MatchEscrow.Partida memory p = escrow.getPartida(id);
        assertEq(uint256(p.estado), uint256(MatchEscrow.Estado.Resolvida));
        assertTrue(p.vencedor == jogadorA || p.vencedor == jogadorB);
        assertEq(p.stake, 0);

        // Nenhum fundo foi movido (stake = 0)
        assertEq(tesouro.balance, tesouroSaldoBefore);
        assertEq(jogadorA.balance, jogadorASaldoBefore);
        assertEq(jogadorB.balance, jogadorBSaldoBefore);
    }

    function testAceitarPartidaCasualComStake() public {
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 0}(_timeA());

        vm.deal(jogadorB, 1 ether);
        vm.prank(jogadorB);
        vm.expectRevert(abi.encodeWithSelector(MatchEscrow.StakeIncorreto.selector));
        escrow.aceitarPartida{value: 1 ether}(id, _timeB());
    }

    function testCancelarCasualStakeZero() public {
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: 0}(_timeA());

        uint256 saldoAntes = jogadorA.balance;
        vm.warp(block.timestamp + 2 hours);
        vm.prank(jogadorA);
        escrow.cancelar(id);

        MatchEscrow.Partida memory p = escrow.getPartida(id);
        assertEq(uint256(p.estado), uint256(MatchEscrow.Estado.Cancelada));
        assertEq(jogadorA.balance, saldoAntes); // sem reembolso (não havia stake)
    }

    // ─── Fuzz: distribuição do pote ────────────────────────────────

    /// @dev O pote = 2 * stake (quando stake > 0). Premio + taxa = pote.
    function testFuzz_potDistribution(uint96 stakeWei) public {
        vm.assume(stakeWei > 0);
        vm.assume(stakeWei <= 1000 ether);

        vm.deal(jogadorA, stakeWei);
        vm.prank(jogadorA);
        uint256 id = escrow.criarPartida{value: stakeWei}(_timeA());

        vm.deal(jogadorB, stakeWei);
        vm.prank(jogadorB);
        escrow.aceitarPartida{value: stakeWei}(id, _timeB());

        uint256 saldoTesouroBefore = tesouro.balance;
        uint256 saldoVencedorBeforeA = jogadorA.balance;
        uint256 saldoVencedorBeforeB = jogadorB.balance;

        vm.prank(resolver);
        escrow.resolver(id, uint256(keccak256(abi.encode(stakeWei))));

        uint256 pote = uint256(stakeWei) * 2;
        uint256 taxa = (pote * 500) / 10000;
        uint256 premio = pote - taxa;

        assertEq(tesouro.balance - saldoTesouroBefore, taxa);

        MatchEscrow.Partida memory p = escrow.getPartida(id);
        if (p.vencedor == jogadorA) {
            assertEq(jogadorA.balance - saldoVencedorBeforeA, premio);
        } else {
            assertEq(jogadorB.balance - saldoVencedorBeforeB, premio);
        }
    }

    // ─── Fuzz: múltiplas partidas com stakes variados ──────────────

    function testFuzz_multiplasPartidas(uint96 stakeA, uint96 stakeB) public {
        vm.assume(stakeA <= 100 ether);
        vm.assume(stakeB <= 100 ether);

        vm.deal(jogadorA, stakeA);
        vm.prank(jogadorA);
        uint256 id1 = escrow.criarPartida{value: stakeA}(_timeA());

        vm.deal(jogadorB, stakeB);
        vm.prank(jogadorB);
        if (stakeB != stakeA) {
            vm.expectRevert(abi.encodeWithSelector(MatchEscrow.StakeIncorreto.selector));
            escrow.aceitarPartida{value: stakeB}(id1, _timeB());
        } else {
            escrow.aceitarPartida{value: stakeB}(id1, _timeB());
            vm.prank(resolver);
            escrow.resolver(id1, 999);
        }
    }

    // ─── Testar admin: setTaxa ────────────────────────────────────

    function testSetTaxa() public {
        vm.prank(admin);
        escrow.setTaxa(300);
        assertEq(escrow.taxaCasaBps(), 300);
    }

    function testSetTaxaMax() public {
        vm.prank(admin);
        escrow.setTaxa(1000);
        assertEq(escrow.taxaCasaBps(), 1000);
    }

    function testSetTaxaAcimaDe10() public {
        vm.prank(admin);
        vm.expectRevert("max 10%");
        escrow.setTaxa(1001);
    }

    function testSetTaxaNaoAdmin() public {
        vm.prank(jogadorA);
        vm.expectRevert();
        escrow.setTaxa(300);
    }
}
