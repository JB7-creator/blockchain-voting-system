// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🗳️  Deploying DeVote Voting System...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  // Wait for deployment (Hardhat 3 uses waitForDeployment)
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();

  console.log("✅ Voting contract deployed to:", contractAddress);
  console.log("\n📋 Next steps:");
  console.log("1. Copy this address into devote-ui/src/App.js → CONTRACT_ADDRESS");
  console.log("2. Run: npx hardhat verify --network sepolia", contractAddress);
  console.log("3. cd devote-ui && npm start");

  // Save address to a file for easy reference
  const fs = require("fs");
  const deployInfo = {
    network: hre.network.name,
    contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deployInfo, null, 2)
  );

  console.log("\n📄 Deployment info saved to deployment.json");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});