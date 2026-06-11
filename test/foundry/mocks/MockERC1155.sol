// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MockERC1155 is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public totalSupply;

    constructor() ERC1155("https://example.com/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mintBatch(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) {
        for (uint256 i = 0; i < ids.length; i++) {
            if (maxSupply[ids[i]] > 0) {
                require(totalSupply[ids[i]] + amounts[i] <= maxSupply[ids[i]], "supply exceeded");
            }
            totalSupply[ids[i]] += amounts[i];
        }
        _mintBatch(to, ids, amounts, "");
    }

    function setMaxSupply(uint256 id, uint256 supply) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxSupply[id] = supply;
    }

    function mint(address to, uint256 id, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (maxSupply[id] > 0) {
            require(totalSupply[id] + amount <= maxSupply[id], "supply exceeded");
        }
        totalSupply[id] += amount;
        _mint(to, id, amount, "");
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
