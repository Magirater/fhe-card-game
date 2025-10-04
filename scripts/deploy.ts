import { ethers } from 'ethers';
import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config({ path: `.env.local` })

async function main() {
  // Get the private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in environment variables");
  }

  // Create provider for Sepolia testnet
  const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia.rpc.subquery.network/public');
  
  // Create wallet from private key
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("Deploying from address:", wallet.address);
  
  // Get contract artifact
  const artifact = await hre.artifacts.readArtifact("MockFHEVMGame");
  
  // Create contract factory
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  console.log("Deploying MockFHEVMGame contract...");
  
  // Deploy contract
  const contract = await factory.deploy();
  
  console.log("Contract deployed! Transaction hash:", contract.deploymentTransaction()?.hash);
  console.log("Waiting for deployment confirmation...");
  
  // Wait for deployment
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("Contract deployed to:", contractAddress);
  
  // Save deployment info
  const deploymentInfo = {
    address: contractAddress,
    network: "sepolia",
    deployedAt: new Date().toISOString()
  };
  
  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
.catch((error) => {
  console.error(error);
  process.exitCode = 1;
});