// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../../contracts/FigurinhasCopa.sol";
import "../../../contracts/CardStats.sol";
import "../../../contracts/MatchEscrow.sol";

/**
 * @title Invariants
 * @notice Invariantes do sistema que devem sempre se manter verdadeiras:
 *
 *  - Supply nunca excede maxSupply (COL-01)
 *  - freezeStats/freezeMetadata são irreversíveis
 *  - Soma das probabilidades de raridade do PackStore = 10000
 *  - Pote do MatchEscrow sempre = 2 * stake
 */
contract InvariantsTest is Test {
    FigurinhasCopa internal figurinhas;
    CardStats internal stats;
    MatchEscrow internal escrow;

    address internal admin = makeAddr("admin");
    address internal dummyToken = makeAddr("dummyToken");

    function setUp() public {
        vm.prank(admin);
        figurinhas = new FigurinhasCopa("https://example.com/{id}.json", admin, admin);

        vm.prank(admin);
        stats = new CardStats(admin);
    }

    // ─── Invariante: freezeMetadata é irreversível ─────────────────

    function test_freezeMetadataIrreversible() public {
        vm.prank(admin);
        figurinhas.freezeMetadata();
        assertTrue(figurinhas.metadataFrozen());

        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(FigurinhasCopa.MetadataJaCongelada.selector));
        figurinhas.setURI("https://new-uri.com/{id}.json");
    }

    // ─── Invariante: freezeStats é irreversível ───────────────────

    function test_freezeStatsIrreversible() public {
        vm.prank(admin);
        stats.freezeStats();
        assertTrue(stats.frozen());

        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        uint256[] memory packedStats = new uint256[](1);
        packedStats[0] = 42;

        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(CardStats.JaCongelado.selector));
        stats.setStatsBatch(ids, packedStats);
    }

    bytes32 internal constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ─── Invariante: Figurinhas supply nunca excede maxSupply ──────

    function test_supplyNuncaExcedeMax() public {
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;
        uint8[] memory rars = new uint8[](1);
        rars[0] = 0;
        uint256[] memory supplies = new uint256[](1);
        supplies[0] = 100;

        vm.startPrank(admin);
        figurinhas.configurarFigurinhas(ids, rars, supplies);
        figurinhas.grantRole(MINTER_ROLE, admin);
        vm.stopPrank();
        assertEq(figurinhas.maxSupply(1), 100);

        uint256[] memory mintIds = new uint256[](1);
        mintIds[0] = 1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100;

        vm.prank(admin);
        figurinhas.mintBatch(admin, mintIds, amounts);

        assertEq(figurinhas.totalSupply(1), 100);

        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(FigurinhasCopa.SupplyExcedido.selector, 1));
        figurinhas.mintBatch(admin, mintIds, amounts);
    }

    // ─── Invariante: Probabilidades do PackStore somam 10000 ───────

    function test_rarityProbabilitiesSumTo10000() public {
        // Testa a tabela interna do _sortearRaridade
        uint8[10000] memory resultados;

        for (uint256 i = 0; i < 10000; i++) {
            if (i < 7000) resultados[i] = 0;
            else if (i < 9000) resultados[i] = 1;
            else if (i < 9800) resultados[i] = 2;
            else if (i < 9990) resultados[i] = 3;
            else resultados[i] = 4;
        }

        uint256[5] memory counts;
        for (uint256 i = 0; i < 10000; i++) {
            counts[resultados[i]]++;
        }

        assertEq(counts[0], 7000);
        assertEq(counts[1], 2000);
        assertEq(counts[2], 800);
        assertEq(counts[3], 190);
        assertEq(counts[4], 10);
        assertEq(counts[0] + counts[1] + counts[2] + counts[3] + counts[4], 10000);
    }

    bytes32 internal constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");

    // ─── Invariante: pote do MatchEscrow = 2 * stake ──────────────

    function test_potEquals2xStake() public {
        MockInvariantFigurinhas mockFig = new MockInvariantFigurinhas();
        MockInvariantStats mockStats = new MockInvariantStats();

        vm.prank(admin);
        MatchEscrow e = new MatchEscrow(address(mockFig), address(mockStats), admin, admin);

        vm.startPrank(admin);
        mockFig.mint(admin, 1, 1);
        mockFig.mint(admin, 2, 1);
        mockFig.mint(admin, 3, 1);
        mockFig.mint(admin, 4, 1);
        mockFig.mint(admin, 5, 1);
        e.grantRole(RESOLVER_ROLE, admin);
        vm.stopPrank();

        vm.deal(admin, 10 ether);
        uint256[5] memory time;
        time[0] = 1; time[1] = 2; time[2] = 3; time[3] = 4; time[4] = 5;

        vm.prank(admin);
        uint256 id = e.criarPartida{value: 2 ether}(time);

        vm.startPrank(dummyToken);
        mockFig.mint(dummyToken, 1, 1);
        mockFig.mint(dummyToken, 2, 1);
        mockFig.mint(dummyToken, 3, 1);
        mockFig.mint(dummyToken, 4, 1);
        mockFig.mint(dummyToken, 5, 1);
        vm.stopPrank();

        uint256[5] memory timeB;
        timeB[0] = 1; timeB[1] = 2; timeB[2] = 3; timeB[3] = 4; timeB[4] = 5;

        vm.deal(dummyToken, 2 ether);
        vm.prank(dummyToken);
        e.aceitarPartida{value: 2 ether}(id, timeB);

        vm.prank(admin);
        e.resolver(id, 12345);
    }
}

contract MockInvariantFigurinhas {
    mapping(address => mapping(uint256 => uint256)) public balances;

    function balanceOf(address owner, uint256 id) external view returns (uint256) {
        return balances[owner][id];
    }

    function mint(address to, uint256 id, uint256 amount) external {
        balances[to][id] += amount;
    }
}

contract MockInvariantStats {
    function getCarta(uint256) external pure returns (ICardStats.Carta memory) {
        return ICardStats.Carta(80, 80, 80, 80, 80, 80, 80, 5, 0, 0);
    }
}
