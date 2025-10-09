import { ethers } from 'ethers';
import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config({ path: `.env` })

async function main() {

  console.log("CAUTION: At the time we unaviable to deploy to Zama testnet.")

  // Get the private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in environment variables");
  }

  // Get RPC URL from environment
  const RPC = process.env.ZAMA_RPC_URL;
  if (!RPC) {
    throw new Error("ZAMA_RPC_URL not found in environment variables. Please uncomment and configure ZAMA_RPC_URL in your .env file when Zama testnet becomes available.");
  }

  // Create provider for Zama testnet
  const provider = new ethers.JsonRpcProvider(RPC);
  
  // Create wallet from private key
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("Deploying from address:", wallet.address);
  
  // Get contract artifact
  const artifact = await hre.artifacts.readArtifact("FHECardGame");
  
  // Create contract factory
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  console.log("Deploying FHECardGame contract...");
  
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