import { expect } from "chai";
import { network } from "hardhat";

/**
 * @title MockFHEVMGame Simple E2E Tests
 * @dev Basic end-to-end tests for the FHE Card Game
 * @author FHE Card Game Team
 */
describe("MockFHEVMGame Simple E2E Tests", function () {
  let game: any;
  let publicClient: any;
  let walletClients: any[];

  before(async function () {
    // Connect to network and get viem helpers
    const { viem } = await network.connect();
    
    // Get public client
    publicClient = await viem.getPublicClient();
    
    // Get wallet clients (one for each account)
    walletClients = await viem.getWalletClients();
    
    // Deploy the game contract
    game = await viem.deployContract("MockFHEVMGame", []);
    
    console.log("Game deployed at:", game.address);
    console.log("Available accounts:", walletClients.length);
  });

  /**
   * @dev Test basic game creation and playing
   */
  it("Should create a game and play one round", async function () {
    console.log("=== Starting Basic Game Test ===");

    // Create game
    const hash = await game.write.createGame({
      account: walletClients[1].account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    console.log("Game created, receipt:", receipt.status);

    // Get the next game ID to verify game was created
    const nextGameId = await game.read.nextGameId();
    console.log("Next game ID:", nextGameId.toString());
    expect(Number(nextGameId)).to.be.at.least(1);

    // Get game data for game ID 1
    const gameData = await game.read.games([1n]);
    console.log("Game data:", gameData);
    expect(gameData[0].toLowerCase()).to.equal(walletClients[1].account.address.toLowerCase());

    // Get player hand
    const playerHand = await game.read.getPlayerHand([1n]);
    console.log("Player hand:", playerHand);
    expect(playerHand.length).to.equal(5);

    // Get bot hand
    const botHand = await game.read.getBotHand([1n]);
    console.log("Bot hand:", botHand);
    expect(botHand.length).to.equal(5);

    // Play first card
    if (playerHand.length > 0) {
      const cardToPlay = playerHand[0];
      console.log("Playing card:", cardToPlay);

      const playHash = await game.write.playCard([1n, cardToPlay], {
        account: walletClients[1].account,
      });
      const playReceipt = await publicClient.waitForTransactionReceipt({ hash: playHash });
      console.log("Card played, receipt:", playReceipt.status);

      // Verify hand is reduced
      const newPlayerHand = await game.read.getPlayerHand([1n]);
      expect(newPlayerHand.length).to.equal(4);

      // Verify round increased
      const currentRound = await game.read.getCurrentRound([1n]);
      expect(currentRound).to.equal(1);

      // Verify game state changed to Playing
      const gameState = await game.read.getGameState([1n]);
      expect(gameState).to.equal(1); // Playing
    }

    console.log("=== Basic Game Test Passed ===");
  });

  /**
   * @dev Test FHE mock functions
   */
  it("Should work with FHE mock functions", async function () {
    console.log("=== Starting FHE Mock Functions Test ===");

    // Test encryption
    const encrypted = await game.read.mockTFHEasEuint8([7]);
    console.log("Encrypted value:", encrypted);
    expect(encrypted).to.not.be.empty;

    // Test decryption
    const decrypted = await game.read.mockTFHEdecrypt([encrypted]);
    console.log("Decrypted value:", decrypted);
    expect(typeof decrypted).to.equal("number");

    // Test comparison functions
    expect(await game.read.mockTFHEgt([5, 3])).to.be.true;
    expect(await game.read.mockTFHEgt([3, 5])).to.be.false;
    expect(await game.read.mockTFHEgt([5, 5])).to.be.false;

    expect(await game.read.mockTFHEeq([5, 5])).to.be.true;
    expect(await game.read.mockTFHEeq([5, 3])).to.be.false;

    console.log("=== FHE Mock Functions Test Passed ===");
  });

  /**
   * @dev Test error handling
   */
  it("Should handle errors correctly", async function () {
    console.log("=== Starting Error Handling Test ===");

    // Test playing card you don't have (expect it to throw)
    try {
      await game.write.playCard([1n, 99], {
        account: walletClients[1].account,
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      console.log("Expected error caught:", error.message);
      expect(error.message).to.include("You don't have this card");
    }

    // Test playing card in someone else's game (expect it to throw)
    try {
      await game.write.playCard([1n, 5], {
        account: walletClients[2].account,
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      console.log("Expected error caught:", error.message);
      expect(error.message).to.include("Not your game");
    }

    console.log("=== Error Handling Test Passed ===");
  });

  /**
   * @dev Test complete game flow
   */
  it("Should complete a full game", async function () {
    console.log("=== Starting Complete Game Test ===");

    // Create a new game
    const hash = await game.write.createGame({
      account: walletClients[1].account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    // Get the game ID (should be 2 since we created one in the first test)
    const nextGameId = await game.read.nextGameId();
    const gameId = nextGameId - 1n;
    
    console.log("Playing complete game with ID:", gameId.toString());

    // Play all 5 rounds
    for (let round = 1; round <= 5; round++) {
      console.log(`=== Round ${round} ===`);
      
      const hand = await game.read.getPlayerHand([gameId]);
      if (hand.length > 0) {
        const cardToPlay = hand[0];
        console.log("Playing card:", cardToPlay);

        await game.write.playCard([gameId, cardToPlay], {
          account: walletClients[1].account,
        });

        // Verify hand is reduced
        const newHand = await game.read.getPlayerHand([gameId]);
        expect(newHand.length).to.equal(5 - round);

        // Verify round increased
        const currentRound = await game.read.getCurrentRound([gameId]);
        expect(currentRound).to.equal(round);
      }
    }

    // Verify game is finished
    const finalState = await game.read.getGameState([gameId]);
    expect(finalState).to.equal(2); // Finished

    // Verify hands are empty
    const finalPlayerHand = await game.read.getPlayerHand([gameId]);
    const finalBotHand = await game.read.getBotHand([gameId]);
    expect(finalPlayerHand.length).to.equal(0);
    expect(finalBotHand.length).to.equal(0);

    // Verify all cards were played
    const finalPlayedCards = await game.read.getPlayedCards([gameId]);
    expect(finalPlayedCards.length).to.equal(10);

    console.log("=== Complete Game Test Passed ===");
  });
});
