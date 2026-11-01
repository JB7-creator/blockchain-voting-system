require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY.replace(/^0x/, "")] : [];
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    ...(SEPOLIA_RPC_URL && PRIVATE_KEY.length > 0 && PRIVATE_KEY[0] !== "PLACEHOLDER"
      ? {
          sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: PRIVATE_KEY,
            chainId: 11155111,
          },
        }
      : {}),
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
