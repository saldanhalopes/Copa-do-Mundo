// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICardStats} from "../../../contracts/MatchEscrow.sol";

contract MockCardStats is ICardStats {
    mapping(uint256 => Carta) private _cartas;

    function setCarta(uint256 tokenId, Carta memory c) external {
        _cartas[tokenId] = c;
    }

    function getCarta(uint256 tokenId) external view override returns (Carta memory) {
        return _cartas[tokenId];
    }
}
