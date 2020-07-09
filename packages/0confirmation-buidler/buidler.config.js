const url = require('url');
const bip39 = require('bip39');
const path = require('path');
const { InfuraProvider } = require('@ethersproject/providers');

const modifyEnvironmentIfMonorepo = require('./internal/monorepo');

const unhook = modifyEnvironmentIfMonorepo();

usePlugin("@nomiclabs/buidler-solhint");
usePlugin("@nomiclabs/buidler-etherscan");
usePlugin("@nomiclabs/buidler-ethers");
usePlugin("@nomiclabs/buidler-waffle");
usePlugin("buidler-gas-reporter");
usePlugin("buidler-deploy");
usePlugin("solidity-coverage");

unhook();

/*
const crypto = require("crypto");
const ethers = require("ethers");
const ETHERSCAN_API_KEY =
    process.env.ETHERSCAN_API_KEY || crypto.randomBytes(20).toString("base64");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const bip39 = require("bip39");
const rinkeby =
    process.env.RINKEBY ||
    new ethers.providers.InfuraProvider("rinkeby").connection.url;
const mainnet =
    process.env.MAINNET ||
    new ethers.providers.InfuraProvider("mainnet").connection.url;
const mnemonic = process.env.TEST_MNEMONIC || bip39.generateMnemonic();
const live = process.env.MNEMONIC || mnemonic;
*/

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log((await account.getAddress()));
  }
});

Object.assign(module.exports, {
  paths: {
    artifacts: "./artifacts",
  },
  networks: {
    local: {
      url: url.format({
        protocol: "http:",
        port: 8545,
        hostname: "localhost",
      }),
      gas: 5e5,
      timeout: 1000000,
    },
    live: {
      url: new InfuraProvider("mainnet", process.env.INFURA_PROJECT_ID)
        .connection.url,
      accounts: {
        mnemonic: process.env.MNEMONIC || bip39.generateMnemonic(),
      },
      chainId: 1,
    },
    rinkeby: {
      url: new InfuraProvider("rinkeby", process.env.INFURA_PROJECT_ID)
        .connection.url,
      accounts: {
        mnemonic: process.env.MNEMONIC || bip39.generateMnemonic(),
      },
      chainId: 4,
    },
  },
  mocha: {
    timeout: 0,
    useColors: true,
  },
  etherscan: {
    url: "https://etherscan.io/api",
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    currency: "USD",
    showTimeSpent: true,
    enabled: true,
    currency: "USD",
  },
  namedAccounts: {
    deployer: {
      default: 0
    }
  },
  solc: {
    version: "0.6.10",
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  paths: {
    sources: path.join(__dirname, 'contracts'),
    tests: path.join(__dirname, 'test'),
    cache: path.join(__dirname, 'cache'),
    artifacts: path.join(__dirname, 'build'),
    deploy: path.join(__dirname, "deploy"),
    deployments: path.join(__dirname, "deployments")
  },
});
