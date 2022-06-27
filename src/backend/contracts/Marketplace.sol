// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard {
    address payable public immutable feeAccount; // account that receives fees
    uint256 public immutable feePercent; // fee percentage on sales
    uint256 public nftCount;

    struct NFT {
        uint256 nftId;
        IERC721 nft;
        uint256 tokenId;
        uint256 price;
        address payable seller;
        bool isSold;
    }

    // nftId -> NFT
    mapping(uint256 => NFT) public nfts;

    // indexed - allows us to filter the events by field with this "indexed"
    event Offered(
        uint256 nftId,
        address indexed nft,
        uint256 tokenId,
        uint256 price,
        address indexed seller
    );

    event Bought(
        uint256 nftId,
        address indexed nft,
        uint256 tokenId,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );

    constructor(uint256 _feePercent) {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    // nonReentrant - prevents bad guys from calling this function
    function createNft(
        IERC721 _nft,
        uint256 _tokenId,
        uint256 _price
    ) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        nftCount++;

        // transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);

        // add  new nft to nfts mapping
        nfts[nftCount] = NFT(
            nftCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false
        );

        emit Offered(nftCount, address(_nft), _tokenId, _price, msg.sender);
    }

    function purchaseNft(uint256 _nftId) external payable nonReentrant {
        uint256 _totalPrice = getTotalPrice(_nftId);

        // This variable reading directly from storage mapping, it's not creating a memory copy of the nft
        NFT storage nft = nfts[_nftId];

        require(_nftId > 0 && _nftId <= nftCount, "nft doesn't exist");
        require(
            msg.value >= _totalPrice,
            "not enough ether to cover nft price and market fee"
        );
        require(!nft.isSold, "nft already sold");

        // Pay seller and feeAccount
        nft.seller.transfer(nft.price);
        feeAccount.transfer(_totalPrice - nft.price);

        nft.isSold = true;

        // Transfer nft to buyer
        nft.nft.transferFrom(address(this), msg.sender, nft.tokenId);

        emit Bought(
            _nftId,
            address(nft.nft),
            nft.tokenId,
            nft.price,
            nft.seller,
            msg.sender
        );
    }

    function getTotalPrice(uint256 _nftId) public view returns (uint256) {
        return ((nfts[_nftId].price * (100 + feePercent)) / 100);
    }
}
