const { expect } = require("chai");
const hre = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", () => {
  let NFT, deployer, addr1, addr2, nft, Marketplace, marketplace, addrs;
  let feePercent = 1;
  let URI = "Sample URI";

  beforeEach(async () => {
    await hre.network.provider.send("hardhat_reset");
    // Get contracts factories
    NFT = await ethers.getContractFactory("NFT");
    Marketplace = await ethers.getContractFactory("Marketplace");

    // Get signers
    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy contracts
    nft = await NFT.deploy();
    marketplace = await Marketplace.deploy(feePercent);
  });

  describe("Deployment", () => {
    it("Should track name and symbol of the nft collection", async () => {
      const nftName = "My nft";
      const nftSymbol = "MN";

      expect(await nft.name()).to.equal(nftName);
      expect(await nft.symbol()).to.equal(nftSymbol);
    });

    it("Should track feeAccount and feePercent of the nft collection", async () => {
      expect(await marketplace.feeAccount()).to.equal(deployer.address);
      expect(await marketplace.feePercent()).to.equal(feePercent);
    });
  });

  describe("Minting NFTs", () => {
    it("Should track each minted NFT", async () => {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI);
      expect(await nft.tokenCounter()).to.equal(1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(URI);

      // addr2 mints an nft
      await nft.connect(addr2).mint(URI);
      expect(await nft.tokenCounter()).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.tokenURI(2)).to.equal(URI);
    });
  });

  describe("Creating marketplace nfts", () => {
    let price = 1;

    beforeEach(async () => {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI);

      // addr1 approves marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
    });

    it("Should track newly created nft, transfer NFT from seller to marketplace and emit Offered event", async () => {
      // addr1 offers their nft at a price of 1 eth
      await expect(
        marketplace.connect(addr1).createNft(nft.address, 1, toWei(price))
      )
        .to.emit(marketplace, "Offered")
        .withArgs(1, nft.address, 1, toWei(price), addr1.address);

      // Owner of NFT should now be the marketplace
      expect(await nft.ownerOf(1)).to.equal(marketplace.address);

      // Nft count should now equal 1
      expect(await marketplace.nftCount()).to.equal(1);

      // Get nft from nfts mapping then check fields to ensure they are correct
      const item = await marketplace.nfts(1);

      expect(item.nftId).to.equal(1);
      expect(item.nft).to.equal(nft.address);
      expect(item.tokenId).to.equal(1);
      expect(item.price).to.equal(toWei(price));
      expect(item.isSold).to.equal(false);
    });

    it("Should fail if price is set to zero", async () => {
      await expect(
        marketplace.connect(addr1).createNft(nft.address, 1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });
  });

  describe("Purchasing marketplace nfts", () => {
    let price = 2;
    let fee = (feePercent / 100) * price;
    let totalPriceInWei;

    beforeEach(async () => {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI);

      // addr1 approves marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true);

      // addr1 makes their nft a marketplace nft
      await marketplace.connect(addr1).createNft(nft.address, 1, toWei(price));
    });

    it("Should update nft as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event", async () => {
      const sellerInitialEthBalance = await addr1.getBalance();
      const feeAccountInitialEthBalance = await deployer.getBalance();

      // fetch nfts total price (market fees + nft price)
      totalPriceInWei = await marketplace.getTotalPrice(1);

      // addr2 purchases nft
      await expect(
        marketplace.connect(addr2).purchaseNft(1, { value: totalPriceInWei })
      )
        .to.emit(marketplace, "Bought")
        .withArgs(
          1,
          nft.address,
          1,
          toWei(price),
          addr1.address,
          addr2.address
        );

      const sellerFinalEthBalance = await addr1.getBalance();
      const feeAccountFinalEthBalance = await deployer.getBalance();

      expect((await marketplace.nfts(1)).isSold).to.equal(true);

      // Seller should receive payment for the price of the NFT sold
      expect(+fromWei(sellerFinalEthBalance)).to.equal(
        +price + +fromWei(sellerInitialEthBalance)
      );

      // feeAccount should receive fee
      expect(+fromWei(feeAccountFinalEthBalance)).to.equal(
        +fee + +fromWei(feeAccountInitialEthBalance)
      );

      // The buyer should now own the nft
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should fail for invalid nft ids, sold nfts and when not enough eth is paid", async () => {
      const balance = await addr2.getBalance();
      // Fails for invalid nft ids
      await expect(
        marketplace.connect(addr2).purchaseNft(2, { value: totalPriceInWei })
      ).to.be.revertedWith("nft doesn't exist");
      await expect(
        marketplace.connect(addr2).purchaseNft(0, { value: totalPriceInWei })
      ).to.be.revertedWith("nft doesn't exist");

      // addr2 purchases nft 1
      await marketplace
        .connect(addr2)
        .purchaseNft(1, { value: totalPriceInWei });

      const addr3 = addrs[0];

      // addr3 tries purchasing nft 1 after its been sold
      await expect(
        marketplace.connect(addr3).purchaseNft(1, { value: totalPriceInWei })
      ).to.be.revertedWith("nft already sold");
    });
  });
});
