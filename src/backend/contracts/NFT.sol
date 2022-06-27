// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    uint256 public tokenCounter;

    constructor() ERC721("My nft", "MN") {}

    function mint(string memory _tokenURI) external returns (uint256) {
        tokenCounter++;
        _safeMint(msg.sender, tokenCounter);
        _setTokenURI(tokenCounter, _tokenURI);

        return (tokenCounter);
    }
}
