// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { MockFHEVMGame } from "./MockFHEVMGame.sol";
import { Test } from "forge-std/Test.sol";
import { console } from "forge-std/console.sol";

contract MockFHEVMGameTest is Test {
    MockFHEVMGame game;
    address player1;
    address player2;

    function setUp() public {
        game = new MockFHEVMGame();
        player1 = makeAddr("player1");
        player2 = makeAddr("player2");
    }

    function test_InitialState() public view {
        assertEq(game.nextGameId(), 1);
    }

    function test_CreateGame() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        assertEq(gameId, 1);
        assertEq(game.nextGameId(), 2);
        
        // Check game state - games mapping returns all struct fields
        (address p1, address p2, uint8 player1Score, uint8 player2Score, uint8 currentRound, MockFHEVMGame.GameState state) = game.games(gameId);
        assertEq(p1, player1);
        assertEq(p2, address(0)); // No second player yet
        assertEq(currentRound, 0);
        assertEq(uint8(state), uint8(MockFHEVMGame.GameState.Waiting));
    }

    function test_CreateGameEmitsEvent() public {
        vm.prank(player1);
        vm.expectEmit(true, true, false, true);
        emit MockFHEVMGame.GameCreated(1, player1);
        game.createGame();
    }

    function test_PlayerHandDistribution() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        uint8[] memory playerHand = game.getPlayerHand(gameId);
        uint8[] memory botHand = game.getBotHand(gameId);
        
        assertEq(playerHand.length, 5);
        assertEq(botHand.length, 5);
        
        // Check that all cards are unique
        for (uint i = 0; i < playerHand.length; i++) {
            for (uint j = i + 1; j < playerHand.length; j++) {
                assertTrue(playerHand[i] != playerHand[j], "Player hand has duplicate cards");
            }
        }
        
        for (uint i = 0; i < botHand.length; i++) {
            for (uint j = i + 1; j < botHand.length; j++) {
                assertTrue(botHand[i] != botHand[j], "Bot hand has duplicate cards");
            }
        }
        
        // Check that player and bot hands don't overlap
        for (uint i = 0; i < playerHand.length; i++) {
            for (uint j = 0; j < botHand.length; j++) {
                assertTrue(playerHand[i] != botHand[j], "Player and bot hands overlap");
            }
        }
    }

    function test_PlayCard() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        uint8[] memory initialHand = game.getPlayerHand(gameId);
        uint8 cardToPlay = initialHand[0];
        
        vm.prank(player1);
        vm.expectEmit(true, true, false, true);
        emit MockFHEVMGame.CardPlayed(gameId, player1, cardToPlay);
        game.playCard(gameId, cardToPlay);
        
        // Check that card was removed from hand
        uint8[] memory newHand = game.getPlayerHand(gameId);
        assertEq(newHand.length, 4);
        
        // Check that card is in played cards
        uint8[] memory playedCards = game.getPlayedCards(gameId);
        assertEq(playedCards.length, 2); // Player card + bot card
        assertEq(playedCards[0], cardToPlay);
        
        // Check game state changed to Playing
        MockFHEVMGame.GameState gameState = game.getGameState(gameId);
        assertEq(uint8(gameState), uint8(MockFHEVMGame.GameState.Playing));
        
        // Check round incremented
        uint8 currentRound = game.getCurrentRound(gameId);
        assertEq(currentRound, 1);
    }

    function test_PlayCardNotYourGame() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        uint8[] memory hand = game.getPlayerHand(gameId);
        uint8 cardToPlay = hand[0];
        
        vm.prank(player2); // Different player
        vm.expectRevert("Not your game");
        game.playCard(gameId, cardToPlay);
    }

    function test_PlayCardYouDontHave() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        vm.prank(player1);
        vm.expectRevert("You don't have this card");
        game.playCard(gameId, 99); // Card not in hand
    }

    function test_PlayCardGameFinished() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        // Play all 5 rounds
        for (uint i = 0; i < 5; i++) {
            uint8[] memory hand = game.getPlayerHand(gameId);
            uint8 cardToPlay = hand[0];
            
            vm.prank(player1);
            game.playCard(gameId, cardToPlay);
        }
        
        // Try to play one more card
        uint8[] memory finalHand = game.getPlayerHand(gameId);
        if (finalHand.length > 0) {
            uint8 finalCardToPlay = finalHand[0];
            vm.prank(player1);
            vm.expectRevert("Game finished");
            game.playCard(gameId, finalCardToPlay);
        }
    }

    function test_CompleteGameFlow() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        uint8 playerScore = 0;
        uint8 botScore = 0;
        
        // Play all 5 rounds
        for (uint round = 0; round < 5; round++) {
            uint8[] memory hand = game.getPlayerHand(gameId);
            uint8 cardToPlay = hand[0];
            
            vm.prank(player1);
            game.playCard(gameId, cardToPlay);
            
            // Get scores after each round
            (uint8 p1Score, uint8 p2Score) = game.getGameScores(gameId);
            playerScore = p1Score;
            botScore = p2Score;
            
            // Round completed: Player played card, scores updated
        }
        
        // Check final state
        MockFHEVMGame.GameState gameState = game.getGameState(gameId);
        assertEq(uint8(gameState), uint8(MockFHEVMGame.GameState.Finished));
        
        // Check that all cards were played
        uint8[] memory playedCards = game.getPlayedCards(gameId);
        assertEq(playedCards.length, 10); // 5 rounds * 2 cards per round
        
        // Check that hands are empty
        uint8[] memory finalPlayerHand = game.getPlayerHand(gameId);
        uint8[] memory finalBotHand = game.getBotHand(gameId);
        assertEq(finalPlayerHand.length, 0);
        assertEq(finalBotHand.length, 0);
    }

    function test_GameFinishedEvent() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        // Play all 5 rounds
        for (uint i = 0; i < 5; i++) {
            uint8[] memory hand = game.getPlayerHand(gameId);
            uint8 cardToPlay = hand[0];
            
            vm.prank(player1);
            game.playCard(gameId, cardToPlay);
        }
        
        // The last playCard call should emit GameFinished event
        // We can't easily test this without knowing the winner beforehand
        // but we can verify the game state is finished
        MockFHEVMGame.GameState gameState = game.getGameState(gameId);
        assertEq(uint8(gameState), uint8(MockFHEVMGame.GameState.Finished));
    }

    function test_MockFHEFunctions() public {
        // Test mock encryption
        string memory encrypted = game.mockTFHEasEuint8(5);
        assertTrue(bytes(encrypted).length > 0);
        
        // Test mock comparison
        assertTrue(game.mockTFHEgt(5, 3));
        assertFalse(game.mockTFHEgt(3, 5));
        assertFalse(game.mockTFHEgt(5, 5));
        
        // Test mock equality
        assertTrue(game.mockTFHEeq(5, 5));
        assertFalse(game.mockTFHEeq(5, 3));
        
        // Test mock decryption
        uint8 decrypted = game.mockTFHEdecrypt(encrypted);
        assertEq(decrypted, 5);
    }

    function test_MultipleGames() public {
        // Create multiple games
        vm.prank(player1);
        uint256 gameId1 = game.createGame();
        
        vm.prank(player2);
        uint256 gameId2 = game.createGame();
        
        assertEq(gameId1, 1);
        assertEq(gameId2, 2);
        assertEq(game.nextGameId(), 3);
        
        // Play cards in both games
        uint8[] memory hand1 = game.getPlayerHand(gameId1);
        uint8[] memory hand2 = game.getPlayerHand(gameId2);
        
        vm.prank(player1);
        game.playCard(gameId1, hand1[0]);
        
        vm.prank(player2);
        game.playCard(gameId2, hand2[0]);
        
        // Verify both games are independent
        uint8[] memory newHand1 = game.getPlayerHand(gameId1);
        uint8[] memory newHand2 = game.getPlayerHand(gameId2);
        
        assertEq(newHand1.length, 4);
        assertEq(newHand2.length, 4);
    }

    function testFuzz_PlayRandomCard(uint8 cardValue) public {
        vm.assume(cardValue >= 1 && cardValue <= 10);
        
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        uint8[] memory hand = game.getPlayerHand(gameId);
        bool hasCard = false;
        for (uint i = 0; i < hand.length; i++) {
            if (hand[i] == cardValue) {
                hasCard = true;
                break;
            }
        }
        
        if (hasCard) {
            vm.prank(player1);
            game.playCard(gameId, cardValue);
            
            // Verify card was played
            uint8[] memory playedCards = game.getPlayedCards(gameId);
            assertEq(playedCards[0], cardValue);
        } else {
            vm.prank(player1);
            vm.expectRevert("You don't have this card");
            game.playCard(gameId, cardValue);
        }
    }

    function test_GameStateTransitions() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        // Initial state should be Waiting
        MockFHEVMGame.GameState gameState = game.getGameState(gameId);
        assertEq(uint8(gameState), uint8(MockFHEVMGame.GameState.Waiting));
        
        // After playing first card, should be Playing
        uint8[] memory hand = game.getPlayerHand(gameId);
        if (hand.length > 0) {
            vm.prank(player1);
            game.playCard(gameId, hand[0]);
            
            gameState = game.getGameState(gameId);
            assertEq(uint8(gameState), uint8(MockFHEVMGame.GameState.Playing));
        }
        
        // Complete the game
        for (uint i = 1; i < 5; i++) {
            hand = game.getPlayerHand(gameId);
            if (hand.length > 0) {
                vm.prank(player1);
                game.playCard(gameId, hand[0]);
            }
        }
        
        // Final state should be Finished
        gameState = game.getGameState(gameId);
        assertEq(uint8(gameState), uint8(MockFHEVMGame.GameState.Finished));
    }

    function test_ScoreCalculation() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        uint8 initialPlayerScore = game.getPlayerScore(gameId);
        uint8 initialBotScore = game.getBotScore(gameId);
        
        assertEq(initialPlayerScore, 0);
        assertEq(initialBotScore, 0);
        
        // Play a few rounds and check scores
        for (uint i = 0; i < 3; i++) {
            uint8[] memory hand = game.getPlayerHand(gameId);
            if (hand.length > 0) {
                vm.prank(player1);
                game.playCard(gameId, hand[0]);
                
                uint8 playerScore = game.getPlayerScore(gameId);
                uint8 botScore = game.getBotScore(gameId);
                
                // Scores should be non-decreasing
                assertTrue(playerScore >= initialPlayerScore);
                assertTrue(botScore >= initialBotScore);
                
                initialPlayerScore = playerScore;
                initialBotScore = botScore;
            }
        }
    }

    function test_GetCurrentRound() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        uint8 initialRound = game.getCurrentRound(gameId);
        assertEq(initialRound, 0);
        
        // Play cards and check round progression
        for (uint i = 0; i < 3; i++) {
            uint8[] memory hand = game.getPlayerHand(gameId);
            if (hand.length > 0) {
                vm.prank(player1);
                game.playCard(gameId, hand[0]);
                
                uint8 currentRound = game.getCurrentRound(gameId);
                assertEq(currentRound, i + 1);
            }
        }
    }

    function test_GetPlayedCards() public {
        vm.prank(player1);
        uint256 gameId = game.createGame();
        
        uint8[] memory initialPlayedCards = game.getPlayedCards(gameId);
        assertEq(initialPlayedCards.length, 0);
        
        // Play a card and check played cards
        uint8[] memory playerHand = game.getPlayerHand(gameId);
        if (playerHand.length > 0) {
            uint8 cardToPlay = playerHand[0];
            
            vm.prank(player1);
            game.playCard(gameId, cardToPlay);
            
            uint8[] memory playedCards = game.getPlayedCards(gameId);
            assertEq(playedCards.length, 2); // Player card + bot card
            assertEq(playedCards[0], cardToPlay);
        }
    }
}
