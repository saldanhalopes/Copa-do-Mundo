// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FigurinhasCopa
 * @notice Coleção ERC-1155 de figurinhas da Copa.
 *         - 680 tokenIds (1 a 680), cada um é uma figurinha do álbum
 *         - Supply máximo por figurinha fixado conforme raridade (imutável)
 *         - Royalties ERC-2981 de 5%
 *         - Apenas contratos autorizados (PackStore, AlbumRewards) podem mintar
 */
contract FigurinhasCopa is ERC1155, ERC2981, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant TOTAL_FIGURINHAS = 680;

    // Raridade de cada figurinha: 0=Comum, 1=Rara, 2=Épica, 3=Lendária, 4=Mítica
    mapping(uint256 => uint8) public raridade;

    // Supply máximo e atual por figurinha
    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public totalSupply;

    // Queima acumulada por (usuário, figurinha) — usada na mecânica de fusão
    bool public metadataFrozen;
    string private _baseUri;

    event MetadataFrozen(string finalUri);
    event FigurinhaConfigurada(uint256 indexed id, uint8 raridade, uint256 maxSupply);

    error SupplyExcedido(uint256 id);
    error FigurinhaInvalida(uint256 id);
    error MetadataJaCongelada();

    constructor(
        string memory baseUri,
        address admin,
        address royaltyReceiver
    ) ERC1155(baseUri) {
        _baseUri = baseUri;
        _grantRole(DEFAULT_ADMIN_ROLE, admin); // recomenda-se Gnosis Safe multisig
        _grantRole(PAUSER_ROLE, admin);
        _setDefaultRoyalty(royaltyReceiver, 500); // 5% (base 10000)
    }

    // ---------------------------------------------------------------
    // Configuração (apenas antes do lançamento)
    // ---------------------------------------------------------------

    /// @notice Define raridade e supply máximo de um lote de figurinhas.
    ///         Só pode ser chamado enquanto a figurinha ainda não tem supply definido.
    function configurarFigurinhas(
        uint256[] calldata ids,
        uint8[] calldata raridades,
        uint256[] calldata supplies
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(ids.length == raridades.length && ids.length == supplies.length, "tamanhos");
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            if (id == 0 || id > TOTAL_FIGURINHAS) revert FigurinhaInvalida(id);
            require(maxSupply[id] == 0, "ja configurada"); // imutavel apos definida
            raridade[id] = raridades[i];
            maxSupply[id] = supplies[i];
            emit FigurinhaConfigurada(id, raridades[i], supplies[i]);
        }
    }

    /// @notice Congela os metadados para sempre (garantia ao colecionador).
    function freezeMetadata() external onlyRole(DEFAULT_ADMIN_ROLE) {
        metadataFrozen = true;
        emit MetadataFrozen(_baseUri);
    }

    function setURI(string memory newUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (metadataFrozen) revert MetadataJaCongelada();
        _baseUri = newUri;
        _setURI(newUri);
    }

    // ---------------------------------------------------------------
    // Mint (apenas PackStore / AlbumRewards)
    // ---------------------------------------------------------------

    function mintBatch(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            if (id == 0 || id > TOTAL_FIGURINHAS) revert FigurinhaInvalida(id);
            if (totalSupply[id] + amounts[i] > maxSupply[id]) revert SupplyExcedido(id);
            totalSupply[id] += amounts[i];
        }
        _mintBatch(to, ids, amounts, "");
    }

    // ---------------------------------------------------------------
    // Fusão: queima 10 cópias da mesma figurinha Comum -> 1 versão Rara
    // (a versão Rara é o mesmo tokenId + offset de 10000 — coleção espelho)
    // ---------------------------------------------------------------

    uint256 public constant FUSAO_CUSTO = 10;

    function fundir(uint256 id) external whenNotPaused {
        require(raridade[id] == 0, "apenas comuns");
        _burn(msg.sender, id, FUSAO_CUSTO);
        uint256 idRaro = id + 10000;
        _mint(msg.sender, idRaro, 1, "");
    }

    // ---------------------------------------------------------------
    // Pausa de emergência
    // ---------------------------------------------------------------

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override whenNotPaused {
        super._update(from, to, ids, values);
    }

    // ---------------------------------------------------------------
    // Interfaces
    // ---------------------------------------------------------------

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
