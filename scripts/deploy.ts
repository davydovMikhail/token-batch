import { ethers } from "hardhat";

async function main() {
  
  const Distribution = await ethers.getContractFactory("Distribution");
  const distribution = await Distribution.deploy();

  await distribution.deployed();

  console.log(`Distribution contract deployed to ${distribution.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
