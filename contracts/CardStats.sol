// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CardStats
 * @notice Armazena os atributos (estilo FIFA) de cada figurinha de forma IMUTÁVEL.
 *         Cada carta tem 6 atributos (PAC, SHO, PAS, DRI, DEF, PHY) de 1–99,
 *         empacotados em um único uint256 para economizar gás.
 *
 *  Layout de bits (cada atributo = 8 bits):
 *    bits  0-7   : PAC (ritmo)
 *    bits  8-15  : SHO (finalização)
 *    bits 16-23  : PAS (passe)
 *    bits 24-31  : DRI (drible)
 *    bits 32-39  : DEF (defesa)
 *    bits 40-47  : PHY (físico)
 *    bits 48-55  : OVR (overall calculado)
 *    bits 56-63  : posição (enum)
 *    bits 64-71  : raridade (0-4)
 *    bits 72-79  : seleção (enum)
 *
 *  Após freezeStats(), NADA pode ser alterado — garantia eterna.
 */
contract CardStats is AccessControl {
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    // tokenId => stats empacotados
    mapping(uint256 => uint256) private _packed;

    bool public frozen;

    event StatsDefinidos(uint256 indexed tokenId, uint256 packed);
    event StatsCongelados();

    error JaCongelado();
    error TamanhoInvalido();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SETTER_ROLE, admin);
    }

    // ─── Escrita (apenas antes de congelar) ───────────────────────

    /// @notice Grava os stats de um lote de cartas.
    /// @param tokenIds ids das figurinhas
    /// @param packedStats valores já empacotados (ver layout acima)
    function setStatsBatch(uint256[] calldata tokenIds, uint256[] calldata packedStats)
        external
        onlyRole(SETTER_ROLE)
    {
        if (frozen) revert JaCongelado();
        if (tokenIds.length != packedStats.length) revert TamanhoInvalido();
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _packed[tokenIds[i]] = packedStats[i];
            emit StatsDefinidos(tokenIds[i], packedStats[i]);
        }
    }

    /// @notice Congela os stats para sempre. Irreversível.
    function freezeStats() external onlyRole(DEFAULT_ADMIN_ROLE) {
        frozen = true;
        emit StatsCongelados();
    }

    // ─── Leitura ──────────────────────────────────────────────────

    struct Carta {
        uint8 pac;
        uint8 sho;
        uint8 pas;
        uint8 dri;
        uint8 def;
        uint8 phy;
        uint8 ovr;
        uint8 posicao;
        uint8 raridade;
        uint8 selecao;
    }

    /// @notice Lê e desempacota os atributos de uma carta.
    function getCarta(uint256 tokenId) public view returns (Carta memory c) {
        uint256 p = _packed[tokenId];
        c.pac      = uint8(p);
        c.sho      = uint8(p >> 8);
        c.pas      = uint8(p >> 16);
        c.dri      = uint8(p >> 24);
        c.def      = uint8(p >> 32);
        c.phy      = uint8(p >> 40);
        c.ovr      = uint8(p >> 48);
        c.posicao  = uint8(p >> 56);
        c.raridade = uint8(p >> 64);
        c.selecao  = uint8(p >> 72);
    }

    function getPacked(uint256 tokenId) external view returns (uint256) {
        return _packed[tokenId];
    }

    /// @notice Helper público para empacotar stats (usado off-chain para gerar o input).
    function pack(
        uint8 pac, uint8 sho, uint8 pas, uint8 dri, uint8 def, uint8 phy,
        uint8 ovr, uint8 posicao, uint8 raridade, uint8 selecao
    ) external pure returns (uint256) {
        return uint256(pac)
            | (uint256(sho) << 8)
            | (uint256(pas) << 16)
            | (uint256(dri) << 24)
            | (uint256(def) << 32)
            | (uint256(phy) << 40)
            | (uint256(ovr) << 48)
            | (uint256(posicao) << 56)
            | (uint256(raridade) << 64)
            | (uint256(selecao) << 72);
    }
}
