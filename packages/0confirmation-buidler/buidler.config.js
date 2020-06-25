usePlugin("@nomiclabs/buidler-waffle");
usePlugin('@nomiclabs/buidler-ethers');

const dotenv = require('dotenv');
dotenv.config();
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  // This is a sample solc configuration that specifies which version of solc to use
  solc: {
    version: "0.6.8",
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
  gasReporter: {
    currency: "USD",
    showTimeSpent: true,
    enabled: true,
    currency: "USD",
  },
  mocha: {
    timeout: 0,
    useColors: true,
  }
  etherscan: {
    url: "https://etherscan.io/api",
    apiKey: ETHERSCAN_APY_KEY,
  },
};
