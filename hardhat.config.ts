import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import { config as dotenvConfig } from "dotenv";

// Load environment variables
dotenvConfig({ path: ".env" });
const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin, hardhatViem, hardhatMocha],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
  },
};

export default config;
