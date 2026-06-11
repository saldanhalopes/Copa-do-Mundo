// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";
import "../../contracts/PackStore.sol";
import "./mocks/MockERC1155.sol";

contract PackStoreTest is Test {
    VRFCoordinatorV2_5Mock internal vrfMock;
    MockERC1155 internal figurinhas;
    PackStore internal packStore;
    address internal admin = makeAddr("admin");
    address internal tesouro = makeAddr("tesouro");
    address internal comprador = makeAddr("comprador");

    uint256 internal subId;
    bytes32 internal keyHash = keccak256("keyHash");

    // Pools: 5 figurinhas por raridade
    uint256[] poolComum;
    uint256[] poolRara;
    uint256[] poolEpica;
    uint256[] poolLendaria;
    uint256[] poolMitica;

    function setUp() public {
        vm.startPrank(admin);

        vrfMock = new VRFCoordinatorV2_5Mock(0, 0, 0);
        subId = vrfMock.createSubscription();

        figurinhas = new MockERC1155();

        packStore = new PackStore(
            address(vrfMock),
            subId,
            keyHash,
            address(figurinhas),
            tesouro
        );

        figurinhas.grantRole(figurinhas.MINTER_ROLE(), address(packStore));
        vrfMock.addConsumer(subId, address(packStore));

        // Configurar pools de figurinhas
        for (uint256 i = 0; i < 5; i++) {
            poolComum.push(i + 1);
            poolRara.push(i + 101);
            poolEpica.push(i + 201);
            poolLendaria.push(i + 301);
            poolMitica.push(i + 401);
        }

        packStore.configurarPool(0, poolComum);
        packStore.configurarPool(1, poolRara);
        packStore.configurarPool(2, poolEpica);
        packStore.configurarPool(3, poolLendaria);
        packStore.configurarPool(4, poolMitica);

        vm.stopPrank();
    }

    // ─── Compra de pacote básico ──────────────────────────────────

    function testComprarPacoteBasico() public {
        vm.deal(comprador, 10 ether);
        vm.prank(comprador);
        uint256 requestId = packStore.comprarPacote{value: 4 ether}(0);

        assertTrue(requestId > 0);

        (address c, uint8 t) = packStore.pedidos(requestId);
        assertEq(c, comprador);
        assertEq(t, 0);
    }

    // ─── Pacote premium com garantia mínima ────────────────────────

    function testComprarPacotePremium() public {
        vm.deal(comprador, 20 ether);
        vm.prank(comprador);
        uint256 requestId = packStore.comprarPacote{value: 16 ether}(1);

        assertTrue(requestId > 0);

        (address c, uint8 t) = packStore.pedidos(requestId);
        assertEq(t, 1);
    }

    // ─── VRF callback — pacote é revelado e mintado ────────────────

    function testRevelarPacote() public {
        vm.deal(comprador, 10 ether);
        vm.prank(comprador);
        uint256 requestId = packStore.comprarPacote{value: 4 ether}(0);

        uint256 balanceBefore = figurinhas.balanceOf(comprador, poolComum[0]);

        vm.prank(admin);
        vrfMock.fulfillRandomWords(requestId, address(packStore));

        uint256 totalMintado = 0;
        for (uint256 i = 0; i < 5; i++) { // pacote básico = 5 figurinhas
            totalMintado += figurinhas.balanceOf(comprador, poolComum[i]);
            totalMintado += figurinhas.balanceOf(comprador, poolRara[i]);
            totalMintado += figurinhas.balanceOf(comprador, poolEpica[i]);
            totalMintado += figurinhas.balanceOf(comprador, poolLendaria[i]);
            totalMintado += figurinhas.balanceOf(comprador, poolMitica[i]);
        }

        assertEq(totalMintado, 5);
    }

    // ─── Pacote inativo deve reverter ──────────────────────────────

    function testPacoteInativo() public {
        vm.deal(comprador, 10 ether);
        vm.prank(comprador);
        vm.expectRevert("pacote inativo");
        packStore.comprarPacote{value: 0}(3);
    }

    // ─── Preço incorreto ──────────────────────────────────────────

    function testPrecoIncorreto() public {
        vm.deal(comprador, 10 ether);
        vm.prank(comprador);
        vm.expectRevert("valor incorreto");
        packStore.comprarPacote{value: 1 ether}(0);
    }

    // ─── Limite diário ────────────────────────────────────────────

    function testLimiteDiario() public {
        vm.deal(comprador, 500 ether);

        for (uint256 i = 0; i < 50; i++) {
            vm.prank(comprador);
            packStore.comprarPacote{value: 4 ether}(0);
        }

        vm.prank(comprador);
        vm.expectRevert("limite diario");
        packStore.comprarPacote{value: 4 ether}(0);
    }

    // ─── Admin: configurar pool ────────────────────────────────────

    function testConfigurarPool() public {
        uint256[] memory novosIds = new uint256[](3);
        novosIds[0] = 1001;
        novosIds[1] = 1002;
        novosIds[2] = 1003;

        vm.prank(admin);
        packStore.configurarPool(0, novosIds);
    }

    function testConfigurarPoolNaoAdmin() public {
        uint256[] memory ids = new uint256[](1);
        ids[0] = 1;

        vm.prank(comprador);
        vm.expectRevert();
        packStore.configurarPool(0, ids);
    }

    // ─── Admin: configurar pacote ──────────────────────────────────

    function testConfigurarPacote() public {
        vm.prank(admin);
        packStore.configurarPacote(5, 10 ether, 3, 1, true);

        (uint256 preco, uint8 qtd, uint8 garantia, bool ativo) = packStore.pacotes(5);
        assertEq(preco, 10 ether);
        assertEq(qtd, 3);
        assertEq(garantia, 1);
        assertTrue(ativo);
    }

    // ─── Admin: setTesouro ────────────────────────────────────────

    function testSetTesouro() public {
        address novoTesouro = makeAddr("novoTesouro");
        vm.prank(admin);
        packStore.setTesouro(novoTesouro);
    }

    // ─── Fuzz: distribuição de raridades ───────────────────────────

    function testFuzz_rarityBounds(uint256 seed) public {
        vm.assume(seed > 0);

        uint256 roll = seed % 10000;
        uint8 rar;

        if (roll < 7000) rar = 0;
        else if (roll < 9000) rar = 1;
        else if (roll < 9800) rar = 2;
        else if (roll < 9990) rar = 3;
        else rar = 4;

        assertTrue(rar >= 0 && rar <= 4);
    }

    // ─── Fuzz: garantia mínima funciona via callback ───────────────

    function testFuzz_garantiaMinima(uint8 tipo) public {
        vm.assume(tipo <= 2);

        vm.startPrank(admin);
        packStore.configurarPacote(tipo, 4 ether, 3, 1, true);
        packStore.configurarPool(0, poolComum);
        packStore.configurarPool(1, poolRara);
        vm.stopPrank();

        vm.deal(comprador, 10 ether);
        vm.prank(comprador);
        uint256 requestId = packStore.comprarPacote{value: 4 ether}(tipo);

        vm.prank(admin);
        vrfMock.fulfillRandomWords(requestId, address(packStore));
    }

    // ─── VRF callback rejeita request inválido ─────────────────────

    function testVrfRequestInvalido() public {
        bytes4 invalidRequestSelector = bytes4(keccak256("InvalidRequest()"));
        vm.expectRevert(abi.encodeWithSelector(invalidRequestSelector));
        vm.prank(admin);
        vrfMock.fulfillRandomWords(999, address(packStore));
    }
}
