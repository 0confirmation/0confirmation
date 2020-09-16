const bre = require("@nomiclabs/buidler/config");
const ShifterPool = require("../deployments/live_1/ShifterPool");
const ShifterBorrowProxyFactoryLib = require("../deployments/live_1/ShifterBorrowProxyFactoryLib");
const { ethers } = require("@nomiclabs/buidler");

const verifyContract = async (
  fullName,
  address,
  constructorArgs,
  libraries
) => {
  await run("verify", {
    contractName: fullName,
    address: address,
    constructorArguments: constructorArgs,
    libraries: JSON.stringify(libraries),
  });
};

async function main() {
  const mainnet = new ethers.providers.InfuraProvider("mainnet").connection.url;
  // verify registry, factories, trader, and implementations
  try {
    await verifyContract("ShifterPool", ShifterPool.address, ShifterPool.args, {
      ShifterBorrowProxyFactoryLib: ShifterBorrowProxyFactoryLib.address,
    });
  } catch (err) {
    console.error(err);
    console.log("continuing");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
