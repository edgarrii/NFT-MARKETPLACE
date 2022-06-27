import { useState } from "react";

import { Spinner } from "react-bootstrap";
import { ethers } from "ethers";

import Navigation from "./Navbar";
import MarketplaceAbi from "../contractsData/Marketplace.json";
import MarketplaceAddress from "../contractsData/Marketplace-address.json";
import NFTAbi from "../contractsData/NFT.json";
import NFTAddress from "../contractsData/NFT-address.json";
import Navigator from "../navigation/Navigator";

function App() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [nft, setNFT] = useState({});
  const [marketplace, setMarketplace] = useState({});

  // Metamask login/connect
  const web3Handler = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    accounts && setAccount(accounts[0]);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    loadContracts(signer);
  };

  const loadContracts = async (signer) => {
    // Get deployed copies of contracts
    const marketplace = new ethers.Contract(
      MarketplaceAddress.address,
      MarketplaceAbi.abi,
      signer
    );
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer);

    marketplace && setMarketplace(marketplace);
    nft && setNFT(nft);
    setLoading(false);
  };

  return (
    <>
      <Navigation web3Handler={web3Handler} account={account} />
      <div className="container-fluid mt-5">
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "80vh",
            }}
          >
            <Spinner animation="border" style={{ display: "flex" }} />
            <p className="mx-3 my-0">Awaiting Metamask Connection...</p>
          </div>
        ) : (
          <Navigator nft={nft} marketplace={marketplace} account={account} />
        )}
      </div>
    </>
  );
}

export default App;
