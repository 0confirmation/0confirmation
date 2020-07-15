const bre = require("@nomiclabs/buidler/config");
const ShifterPool = require("../deployments/kovan/ShifterPool");
const ShifterBorrowProxyFactoryLib = require("../deployments/kovan/ShifterBorrowProxyFactoryLib");
const { ethers } = require("@nomiclabs/buidler");

const verifyContract = async (
  fullName,
  address,
  constructorArgs,
  libraries
) => {
  await run("verify-contract", {
    contractName: fullName,
    address: address,
    constructorArguments: constructorArgs,
    libraries: JSON.stringify(libraries),
  });
};

async function main() {
  const kovan = new ethers.providers.InfuraProvider("kovan").connection.url;
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
