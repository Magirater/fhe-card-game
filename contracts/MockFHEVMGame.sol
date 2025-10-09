// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockFHEVMGame {
    enum GameState {
        Waiting,
        Playing,
        Finished
    }

    struct Game {
        address player1;
        address player2;
        uint8[] player1Hand;
        uint8[] player2Hand;
        uint8[] playedCards;
        uint8 player1Score;
        uint8 player2Score;
        uint8 currentRound;
        GameState state;
    }

    mapping(uint256 => Game) public games;
    uint256 public nextGameId = 1;

    event GameCreated(uint256 indexed gameId, address indexed player);
    event CardPlayed(uint256 indexed gameId, address indexed player, uint8 card);
    event GameFinished(uint256 indexed gameId, address indexed winner);

    function createGame() external returns (uint256) {
        uint256 gameId = nextGameId++;
        
        // Shuffle all 10 cards and distribute evenly
        uint8[] memory allCards = new uint8[](10);
        for (uint8 i = 0; i < 10; i++) {
            allCards[i] = i + 1;
        }
        
        // Simple shuffle (in real implementation, use proper randomness)
        for (uint i = 0; i < allCards.length; i++) {
            uint j = uint(keccak256(abi.encodePacked(block.timestamp, i))) % allCards.length;
            (allCards[i], allCards[j]) = (allCards[j], allCards[i]);
        }
        
        // Distribute cards
        uint8[] memory player1Hand = new uint8[](5);
        uint8[] memory player2Hand = new uint8[](5);
        
        for (uint i = 0; i < 5; i++) {
            player1Hand[i] = allCards[i];
            player2Hand[i] = allCards[i + 5];
        }
        
        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            player1Hand: player1Hand,
            player2Hand: player2Hand,
            playedCards: new uint8[](0),
            player1Score: 0,
            player2Score: 0,
            currentRound: 0,
            state: GameState.Waiting
        });

        emit GameCreated(gameId, msg.sender);
        return gameId;
    }

    function playCard(uint256 gameId, uint8 card) external {
        require(games[gameId].player1 == msg.sender, "Not your game");
        require(games[gameId].state == GameState.Waiting || games[gameId].state == GameState.Playing, "Game not in waiting or playing state");
        require(games[gameId].currentRound < 5, "Game finished");
        
        // Check if player has the card
        bool hasCard = false;
        for (uint i = 0; i < games[gameId].player1Hand.length; i++) {
            if (games[gameId].player1Hand[i] == card) {
                hasCard = true;
                break;
            }
        }
        require(hasCard, "You don't have this card");

        // Remove card from player's hand
        _removeCardFromPlayerHand(gameId, card);
        
        // Bot plays automatically
        uint8 botCard = _getBotCard(gameId);
        _removeCardFromBotHand(gameId, botCard);
        
        // Add to played cards
        games[gameId].playedCards.push(card);
        games[gameId].playedCards.push(botCard);
        
        // Determine winner
        if (card > botCard) {
            games[gameId].player1Score++;
        } else if (botCard > card) {
            games[gameId].player2Score++;
        }
        
        games[gameId].currentRound++;
        games[gameId].state = GameState.Playing;
        
        emit CardPlayed(gameId, msg.sender, card);
        
        // Check if game is finished
        if (games[gameId].currentRound >= 5) {
            games[gameId].state = GameState.Finished;
            address winner = games[gameId].player1Score > games[gameId].player2Score ? 
                games[gameId].player1 : games[gameId].player2;
            emit GameFinished(gameId, winner);
        }
    }

    function _removeCardFromPlayerHand(uint256 gameId, uint8 card) internal {
        uint8[] storage hand = games[gameId].player1Hand;
        for (uint i = 0; i < hand.length; i++) {
            if (hand[i] == card) {
                hand[i] = hand[hand.length - 1];
                hand.pop();
                break;
            }
        }
    }

    function _removeCardFromBotHand(uint256 gameId, uint8 card) internal {
        uint8[] storage hand = games[gameId].player2Hand;
        for (uint i = 0; i < hand.length; i++) {
            if (hand[i] == card) {
                hand[i] = hand[hand.length - 1];
                hand.pop();
                break;
            }
        }
    }

    function _getBotCard(uint256 gameId) internal view returns (uint8) {
        uint8[] memory hand = games[gameId].player2Hand;
        if (hand.length == 0) return 1;
        
        // Simple bot strategy: play random card
        uint index = uint(keccak256(abi.encodePacked(block.timestamp, gameId))) % hand.length;
        return hand[index];
    }

    function getPlayerHand(uint256 gameId) external view returns (uint8[] memory) {
        return games[gameId].player1Hand;
    }

    function getBotHand(uint256 gameId) external view returns (uint8[] memory) {
        return games[gameId].player2Hand;
    }

    function getPlayedCards(uint256 gameId) external view returns (uint8[] memory) {
        return games[gameId].playedCards;
    }

    function getGameState(uint256 gameId) external view returns (GameState) {
        return games[gameId].state;
    }

    function getGameScores(uint256 gameId) external view returns (uint8, uint8) {
        return (games[gameId].player1Score, games[gameId].player2Score);
    }

    function getPlayerScore(uint256 gameId) external view returns (uint8) {
        return games[gameId].player1Score;
    }

    function getBotScore(uint256 gameId) external view returns (uint8) {
        return games[gameId].player2Score;
    }

    function getCurrentRound(uint256 gameId) external view returns (uint8) {
        return games[gameId].currentRound;
    }

    // Mock FHE functions
    function mockTFHEasEuint8(uint8 value) external pure returns (string memory) {
        return string(abi.encodePacked("encrypted_", uint2str(value)));
    }

    function mockTFHEgt(uint8 a, uint8 b) external pure returns (bool) {
        return a > b;
    }

    function mockTFHEeq(uint8 a, uint8 b) external pure returns (bool) {
        return a == b;
    }

    function mockTFHEdecrypt(string memory encrypted) external pure returns (uint8) {
        // Simple mock decryption - extract number from "encrypted_X" format
        bytes memory data = bytes(encrypted);
        if (data.length > 10) {
            // Find the last digit in the string
            for (uint i = data.length - 1; i >= 0; i--) {
                if (data[i] >= 0x30 && data[i] <= 0x39) { // ASCII digits 0-9
                    return uint8(uint8(data[i]) - 0x30);
                }
            }
        }
        return 1;
    }

    function uint2str(uint _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
