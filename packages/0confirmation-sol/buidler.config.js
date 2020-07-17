const url = require('url');
const bip39 = require('bip39');
const path = require('path');
const { InfuraProvider } = require('@ethersproject/providers');
const { fromV3, fromPrivateKey } = require('ethereumjs-wallet');
const { sync: randomBytes } = require('random-bytes');

const wallets = {
  mainnet: require('./private/mainnet'),
  kovan: require('./private/kovan')
};

const modifyEnvironmentIfMonorepo = require('./internal/monorepo');

const unhook = modifyEnvironmentIfMonorepo();

const unlockWalletIfPasswordSet = (wallet) => (process.env.SECRET ? fromV3(wallet, process.env.SECRET) : fromPrivateKey(randomBytes(32))).getPrivateKeyString()

usePlugin("@nomiclabs/buidler-solhint");
usePlugin("@nomiclabs/buidler-etherscan");
usePlugin("@nomiclabs/buidler-ethers");
usePlugin("@nomiclabs/buidler-waffle");
usePlugin("buidler-gas-reporter");
usePlugin("buidler-deploy");
usePlugin("solidity-coverage");

unhook();

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
      accounts: [ unlockWalletIfPasswordSet(wallets.mainnet) ],
      chainId: 1,
    },
    kovan: {
      url: new InfuraProvider("kovan", process.env.INFURA_PROJECT_ID)
        .connection.url,
      accounts: [ unlockWalletIfPasswordSet(wallets.kovan) ],
      chainId: 42,
    },
  },
  mocha: {
    timeout: 0,
    useColors: true,
  },
  etherscan: {
    url: "https://api-kovan.etherscan.io/api",
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
