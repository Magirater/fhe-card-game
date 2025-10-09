// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint32, externalEuint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FHECardGame is Ownable, ReentrancyGuard {
    enum GameState {
        Waiting,
        Playing,
        Finished
    }

    struct Game {
        address player1;
        address player2;
        euint8[] player1Hand;
        euint8[] player2Hand;
        euint8[] playedCards;
        euint8 player1Score;
        euint8 player2Score;
        euint8 currentRound;
        GameState state;
    }

    mapping(uint256 => Game) public games;
    uint256 public nextGameId = 1;

    event GameCreated(uint256 indexed gameId, address indexed player);
    event CardPlayed(uint256 indexed gameId, address indexed player, uint8 card);
    event GameFinished(uint256 indexed gameId, address indexed winner);

    constructor() Ownable(msg.sender) {
        // Initialize non-FHE variables
        nextGameId = 1;
    }

    /**
     * @dev Initialize FHE state and permissions - call this after deployment
     */
    function initializeFHEState() external onlyOwner {
        // This function can be used to initialize any global FHE state if needed
        // For now, we'll initialize FHE state per game
    }

    function createGame() external returns (uint256) {
        uint256 gameId = nextGameId++;
        
        // Create encrypted cards (1-10) - simplified for now
        euint8[] memory player1Hand = new euint8[](5);
        euint8[] memory player2Hand = new euint8[](5);
        
        // Simple card distribution (in production, use proper FHE randomness)
        for (uint i = 0; i < 5; i++) {
            player1Hand[i] = FHE.asEuint8(uint8(i + 1));
            player2Hand[i] = FHE.asEuint8(uint8(i + 6));
        }
        
        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            player1Hand: player1Hand,
            player2Hand: player2Hand,
            playedCards: new euint8[](0),
            player1Score: FHE.asEuint8(0),
            player2Score: FHE.asEuint8(0),
            currentRound: FHE.asEuint8(0),
            state: GameState.Waiting
        });

        // Allow contract to access encrypted data for future computations
        FHE.allowThis(games[gameId].player1Score);
        FHE.allowThis(games[gameId].player2Score);
        FHE.allowThis(games[gameId].currentRound);

        emit GameCreated(gameId, msg.sender);
        return gameId;
    }

    function playCard(uint256 gameId, uint8 card) external nonReentrant {
        require(games[gameId].player1 == msg.sender, "Not your game");
        require(games[gameId].state == GameState.Waiting || games[gameId].state == GameState.Playing, "Game not in waiting or playing state");
        
        // Bot plays automatically
        uint8 botCard = _getBotCard(gameId);
        
        // Add to played cards (encrypted)
        games[gameId].playedCards.push(FHE.asEuint8(card));
        games[gameId].playedCards.push(FHE.asEuint8(botCard));
        
        // Determine winner using FHE operations
        euint8 encryptedCard = FHE.asEuint8(card);
        euint8 encryptedBotCard = FHE.asEuint8(botCard);
        
        // Compare cards using FHE
        ebool playerWins = FHE.gt(encryptedCard, encryptedBotCard);
        ebool botWins = FHE.gt(encryptedBotCard, encryptedCard);
        
        // Update scores using FHE operations
        euint8 one = FHE.asEuint8(1);
        euint8 zero = FHE.asEuint8(0);
        
        games[gameId].player1Score = FHE.add(
            games[gameId].player1Score,
            FHE.select(playerWins, one, zero)
        );
        
        games[gameId].player2Score = FHE.add(
            games[gameId].player2Score,
            FHE.select(botWins, one, zero)
        );
        
        // Increment round
        games[gameId].currentRound = FHE.add(games[gameId].currentRound, one);
        games[gameId].state = GameState.Playing;
        
        // Allow contract to access updated data
        FHE.allowThis(games[gameId].player1Score);
        FHE.allowThis(games[gameId].player2Score);
        FHE.allowThis(games[gameId].currentRound);
        
        emit CardPlayed(gameId, msg.sender, card);
        
        // For now, we'll end the game after one round for simplicity
        // In a full implementation, you'd check if currentRound >= 5 using FHE
        games[gameId].state = GameState.Finished;
        emit GameFinished(gameId, games[gameId].player1);
    }

    function _getBotCard(uint256 gameId) internal view returns (uint8) {
        // Simplified bot strategy - return a random card from bot's hand
        uint8 cardIndex = uint8(uint(keccak256(abi.encodePacked(block.timestamp, gameId))) % 5);
        return cardIndex + 6; // Bot cards are 6-10
    }

    // View functions that return encrypted data
    function getPlayerHand(uint256 gameId) external view returns (euint8[] memory) {
        return games[gameId].player1Hand;
    }

    function getBotHand(uint256 gameId) external view returns (euint8[] memory) {
        return games[gameId].player2Hand;
    }

    function getPlayedCards(uint256 gameId) external view returns (euint8[] memory) {
        return games[gameId].playedCards;
    }

    function getGameState(uint256 gameId) external view returns (GameState) {
        return games[gameId].state;
    }

    function getGameScores(uint256 gameId) external view returns (euint8, euint8) {
        return (games[gameId].player1Score, games[gameId].player2Score);
    }

    function getCurrentRound(uint256 gameId) external view returns (euint8) {
        return games[gameId].currentRound;
    }

    /**
     * @dev Place a bet with external encrypted card
     * @param gameId Game ID
     * @param encCard External encrypted card from frontend
     */
    function playCardEncrypted(uint256 gameId, externalEuint8 encCard) external nonReentrant {
        require(games[gameId].player1 == msg.sender, "Not your game");
        require(games[gameId].state == GameState.Waiting || games[gameId].state == GameState.Playing, "Game not in waiting or playing state");
        
        // Convert external encrypted input to internal euint8
        euint8 encryptedCard = FHE.fromExternal(encCard, "");
        
        // Bot plays automatically
        uint8 botCard = _getBotCard(gameId);
        euint8 encryptedBotCard = FHE.asEuint8(botCard);
        
        // Add to played cards (encrypted)
        games[gameId].playedCards.push(encryptedCard);
        games[gameId].playedCards.push(encryptedBotCard);
        
        // Determine winner using FHE operations
        ebool playerWins = FHE.gt(encryptedCard, encryptedBotCard);
        ebool botWins = FHE.gt(encryptedBotCard, encryptedCard);
        
        // Update scores using FHE operations
        euint8 one = FHE.asEuint8(1);
        euint8 zero = FHE.asEuint8(0);
        
        games[gameId].player1Score = FHE.add(
            games[gameId].player1Score,
            FHE.select(playerWins, one, zero)
        );
        
        games[gameId].player2Score = FHE.add(
            games[gameId].player2Score,
            FHE.select(botWins, one, zero)
        );
        
        // Increment round
        games[gameId].currentRound = FHE.add(games[gameId].currentRound, one);
        games[gameId].state = GameState.Playing;
        
        // Allow contract to access updated data
        FHE.allowThis(games[gameId].player1Score);
        FHE.allowThis(games[gameId].player2Score);
        FHE.allowThis(games[gameId].currentRound);
        
        emit CardPlayed(gameId, msg.sender, 0); // Card value is 0 for privacy
        
        // For now, we'll end the game after one round for simplicity
        games[gameId].state = GameState.Finished;
        emit GameFinished(gameId, games[gameId].player1);
    }

    /**
     * @dev Make game scores publicly decryptable
     * @param gameId Game ID
     */
    function makeScoresPublic(uint256 gameId) external onlyOwner {
        require(games[gameId].state == GameState.Finished, "Game not finished");
        
        // Make scores publicly decryptable
        FHE.makePubliclyDecryptable(games[gameId].player1Score);
        FHE.makePubliclyDecryptable(games[gameId].player2Score);
    }

    /**
     * @dev Make current round publicly decryptable
     * @param gameId Game ID
     */
    function makeRoundPublic(uint256 gameId) external onlyOwner {
        FHE.makePubliclyDecryptable(games[gameId].currentRound);
    }

    // Helper function to create encrypted card from external input
    function createEncryptedCard(uint8 value) external returns (euint8) {
        return FHE.asEuint8(value);
    }

    // Helper function to add encrypted values
    function addEncrypted(uint8 a, uint8 b) external returns (euint8) {
        return FHE.add(FHE.asEuint8(a), FHE.asEuint8(b));
    }
}
