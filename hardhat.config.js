require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  solidity: "0.8.4",
  networks: {
    mumbai: {
      url: process.env.REACT_APP_RINKEBY_RPC_URL,
      accounts: [process.env.REACT_APP_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.REACT_APP_POLYGONSCAN_KEY,
  },
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test",
  },
};
