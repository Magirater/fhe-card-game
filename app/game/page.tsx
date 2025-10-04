'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWallet } from '@/lib/hooks/useWallet'
import { useMockFHEVMGame } from '@/lib/hooks/useMockFHEVMGame'
import { ArrowLeftIcon, RefreshIcon, GamepadIcon } from '@/components/icons'
import Card from '@/components/Card'
import './page.css'

function GameContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') as 'pve' | 'demo' | null

  const { isConnected, address, connect, isConnecting } = useWallet()
  const {
    contract, 
    isConnected: isContractConnected, 
    error: contractError, 
    createGame,
    playCard,
    getGameData,
    getWinner,
    cleanup
  } = useMockFHEVMGame({ isConnected, address, chainId: 11155111, error: null }) // Sepolia testnet

  // Game state - matching contract GameState enum
  const [gameState, setGameState] = useState<'Waiting' | 'Playing' | 'Finished'>('Waiting')
  const [playerHand, setPlayerHand] = useState<number[]>([])
  const [botHand, setBotHand] = useState<number[]>([])
  const [playedCards, setPlayedCards] = useState<{ player: number; bot: number }[]>([])
  const [playerScore, setPlayerScore] = useState(0)
  const [botScore, setBotScore] = useState(0)
  const [currentRound, setCurrentRound] = useState(0)
  const [gameHistory, setGameHistory] = useState<string[]>([])
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [gameId, setGameId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRules, setShowRules] = useState(false)
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [showPvEVictoryModal, setShowPvEVictoryModal] = useState(false)
  const [pveWinner, setPveWinner] = useState<'player' | 'bot' | null>(null)
  const [hasStartedPvE, setHasStartedPvE] = useState(false)

  // Add to history
  const addToHistory = useCallback((message: string) => {
    setGameHistory(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }, [])

  // Demo game automatic gameplay
  const startDemoGameplay = useCallback((playerCards: number[], botCards: number[]) => {
    let currentPlayerHand = [...playerCards]
    let currentBotHand = [...botCards]
    let currentPlayerScore = 0
    let currentBotScore = 0
    let currentRound = 0
    let currentPlayedCards: Array<{player: number, bot: number}> = []

    const playDemoRound = () => {
      // Check if game is over (5 rounds completed)
      if (currentRound >= 5) {
        return // Game already finished
      }

      if (currentPlayerHand.length === 0 || currentBotHand.length === 0) {
        // Game finished
        setGameState('Finished')
        addToHistory(`🎉 Demo game finished! Final score: Player ${currentPlayerScore} - Bot ${currentBotScore}`)
        
        if (currentPlayerScore > currentBotScore) {
          addToHistory(`🏆 Player wins the demo game!`)
        } else if (currentBotScore > currentPlayerScore) {
          addToHistory(`🤖 Bot wins the demo game!`)
        } else {
          addToHistory(`🤝 Demo game is a tie!`)
        }
        setShowVictoryModal(true)
        return
      }

      // Add round start message
      addToHistory(`🚀 Starting Round ${currentRound + 1}...`)
      
      // Show bot thinking
      setIsBotThinking(true)
      
      // Select random cards for both players after a short delay
      setTimeout(() => {
        const playerCardIndex = Math.floor(Math.random() * currentPlayerHand.length)
        const botCardIndex = Math.floor(Math.random() * currentBotHand.length)
        
        const playerCard = currentPlayerHand[playerCardIndex]
        const botCard = currentBotHand[botCardIndex]

        // Stop bot thinking
        setIsBotThinking(false)
        
        // Add card selection message
        addToHistory(`🎯 Cards selected: Player ${playerCard} vs Bot ${botCard}`)

        // Continue with the rest of the logic
        playRound(playerCard, botCard, playerCardIndex, botCardIndex)
      }, 2500) // 2.5 second thinking delay
    }

    const playRound = (playerCard: number, botCard: number, playerCardIndex: number, botCardIndex: number) => {
      // Remove played cards
      currentPlayerHand = currentPlayerHand.filter((_, index) => index !== playerCardIndex)
      currentBotHand = currentBotHand.filter((_, index) => index !== botCardIndex)

      // Determine winner
      let roundWinner = ''
      if (playerCard > botCard) {
        currentPlayerScore++
        roundWinner = 'Player'
      } else if (botCard > playerCard) {
        currentBotScore++
        roundWinner = 'Bot'
      } else {
        roundWinner = 'Tie'
      }

      // Update state
      currentRound++
      currentPlayedCards.push({ player: playerCard, bot: botCard })

      // Update UI state
      setPlayerHand([...currentPlayerHand])
      setBotHand([...currentBotHand])
      setPlayerScore(currentPlayerScore)
      setBotScore(currentBotScore)
      setCurrentRound(currentRound)
      setPlayedCards([...currentPlayedCards])

      // Add to history
      addToHistory(`🎲 Round ${currentRound}: Player ${playerCard} vs Bot ${botCard}`)
      if (roundWinner === 'Player') {
        addToHistory(`🏆 Player wins this round! (+1 point)`)
        addToHistory(`📊 Current score: Player ${currentPlayerScore} - Bot ${currentBotScore}`)
      } else if (roundWinner === 'Bot') {
        addToHistory(`🤖 Bot wins this round! (+1 point)`)
        addToHistory(`📊 Current score: Player ${currentPlayerScore} - Bot ${currentBotScore}`)
      } else {
        addToHistory(`🤝 Round is a tie! (no points)`)
        addToHistory(`📊 Current score: Player ${currentPlayerScore} - Bot ${currentBotScore}`)
      }
      
      // Add round completion message
      addToHistory(`✅ Round ${currentRound} completed!`)

      // Check if game is over (5 rounds completed)
      if (currentRound >= 5) {
        // Determine final winner
        let finalWinner = ''
        if (currentPlayerScore > currentBotScore) {
          finalWinner = 'Player'
          addToHistory(`🎉 Player wins the game! Final score: ${currentPlayerScore}-${currentBotScore}`)
        } else if (currentBotScore > currentPlayerScore) {
          finalWinner = 'Bot'
          addToHistory(`🤖 Bot wins the game! Final score: ${currentBotScore}-${currentPlayerScore}`)
        } else {
          finalWinner = 'Tie'
          addToHistory(`🤝 Game is a tie! Final score: ${currentPlayerScore}-${currentBotScore}`)
        }
        
        // Set game state to finished
        setGameState('Finished')
        setShowVictoryModal(true)
        return // Stop the game
      }

      // Continue to next round after delay
      setTimeout(() => {
        playDemoRound()
      }, 5000) // 5 second delay between rounds
    }

    // Start the first round
    setTimeout(() => {
      playDemoRound()
    }, 3000) // 3 second delay before starting
  }, [addToHistory])

  // Demo game logic - matching contract card distribution
  const startDemoGame = useCallback(() => {
    setGameState('Playing')
    
    // Contract shuffles cards 1-10 and distributes 5 to each player
    const allCards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    
    // Simple shuffle (matching contract logic)
    const shuffledCards = [...allCards]
    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]]
    }
    
    // Distribute cards (first 5 to player, next 5 to bot)
    const playerCards = shuffledCards.slice(0, 5)
    const botCards = shuffledCards.slice(5, 10)
    
    
    setPlayerHand(playerCards)
    setBotHand(botCards)
    setPlayerScore(0)
    setBotScore(0)
    setCurrentRound(0)
    setPlayedCards([])
    setGameHistory(['🎮 Demo game started!'])
    setError(null)
    addToHistory('🎮 Demo game started!')
    
    // Start automatic demo gameplay
    startDemoGameplay(playerCards, botCards)
  }, [addToHistory, startDemoGameplay])

  // PvE game logic
  const startPvEGame = useCallback(async () => {
    if (!contract || isLoading) {
      return
    }

    setIsLoading(true)
    setError(null)
    addToHistory('🎮 Starting PvE game...')

    try {
      // Create game
      const newGameId = await createGame()
      if (!newGameId) {
        throw new Error('Failed to create game')
      }

      setGameId(newGameId)
      addToHistory(`✅ Game created with ID: ${newGameId}`)

      // Wait for contract to process and retry getting game data
      let gameData = null
      let retries = 0
      const maxRetries = 5
      
      while (!gameData && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        gameData = await getGameData(newGameId)
        retries++
        
        // Silent retry - no logging
      }
      
      if (!gameData) {
        throw new Error('Failed to get game data after multiple attempts')
      }

      // Update state - matching contract GameState enum
      setPlayerHand(gameData.playerHand)
      setBotHand(gameData.botHand)
      setPlayerScore(gameData.player1Score)
      setBotScore(gameData.player2Score)
      setCurrentRound(gameData.currentRound)
      setPlayedCards([])
      // Convert contract game state (0=Waiting, 1=Playing, 2=Finished) to string
      const stateMap = ['Waiting', 'Playing', 'Finished'] as const
      setGameState(stateMap[gameData.gameState] || 'Waiting')

      addToHistory(`👤 Your hand: [${gameData.playerHand.join(', ')}]`)
      addToHistory('🎯 Game started - select a card to play')

    } catch (err: any) {
      console.error('Game start failed:', err)
      setError(err.message || 'Failed to start game')
      addToHistory(`❌ ${err.message || 'Failed to start game'}`)
    } finally {
      setIsLoading(false)
    }
  }, [contract, isLoading, createGame, getGameData, addToHistory])

  // Reset PvE flag when mode changes
  useEffect(() => {
    setHasStartedPvE(false)
  }, [mode])

  // Auto-start PvE games only
  useEffect(() => {
    if (mode === 'pve' && isConnected && isContractConnected && gameState === 'Waiting' && !gameId && !isLoading && !hasStartedPvE) {
      setHasStartedPvE(true)
      const timer = setTimeout(() => {
        startPvEGame()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [mode, isConnected, isContractConnected, gameState, gameId, isLoading, hasStartedPvE, startPvEGame])

  // Play card
  const handleCardPlay = async (cardValue: number) => {
    console.log('🎮 handleCardPlay called:', { cardValue, gameState, mode, gameId, contract: !!contract, isLoading })
    
    // Only block if game is finished
    if (gameState === 'Finished') {
      console.log('🎮 Game is finished, cannot play card')
      return
    }
    
    // For demo mode, just log the selection
    if (mode === 'demo') {
      addToHistory(`🎯 You selected card: ${cardValue}`)
      return
    }
    
    // For PvE mode, check if we have contract and gameId
    if (mode === 'pve' && (!gameId || !contract || isLoading)) {
      console.log('🎮 PvE mode but missing requirements:', { gameId, contract: !!contract, isLoading })
      return
    }

    console.log('🎮 Starting to play card...')
    setIsLoading(true)
    setError(null)
    addToHistory(`🎯 Playing card: ${cardValue}`)

    try {
      console.log('🎮 Setting bot thinking...')
      setIsBotThinking(true)
      addToHistory('🤖 Bot is thinking...')

      console.log('🎮 Calling playCard function...')
      const success = await playCard(gameId!, cardValue)
      console.log('🎮 playCard result:', success)
      
      if (!success) {
        throw new Error('Failed to play card')
      }

      addToHistory(`✅ Card ${cardValue} played successfully`)

      // Wait for contract to process
      await new Promise(resolve => setTimeout(resolve, 2000))

      setIsBotThinking(false)

      // Get updated game data
      const gameData = await getGameData(gameId!)
      if (gameData) {
        setPlayerHand(gameData.playerHand)
        setBotHand(gameData.botHand)
        setPlayerScore(gameData.player1Score)
        setBotScore(gameData.player2Score)
        setCurrentRound(gameData.currentRound)

        // Update played cards
        if (gameData.playedCards && gameData.playedCards.length >= 2) {
          const newPlayedCards = []
          for (let i = 0; i < gameData.playedCards.length; i += 2) {
            if (i + 1 < gameData.playedCards.length) {
              newPlayedCards.push({
                player: gameData.playedCards[i],
                bot: gameData.playedCards[i + 1]
              })
            }
          }
          setPlayedCards(newPlayedCards)

          // Show round result
          const playerCard = gameData.playedCards[gameData.playedCards.length - 2]
          const botCard = gameData.playedCards[gameData.playedCards.length - 1]

          addToHistory(`🎲 Round ${gameData.currentRound}: Player ${playerCard} vs Bot ${botCard}`)

          if (playerCard > botCard) {
            addToHistory(`🏆 Player wins this round! (+1 point)`)
          } else if (botCard > playerCard) {
            addToHistory(`🤖 Bot wins this round! (+1 point)`)
          } else {
            addToHistory(`🤝 Round is a tie! (no points)`)
          }
        }

        // Update game state from contract
        const stateMap = ['Waiting', 'Playing', 'Finished'] as const
        setGameState(stateMap[gameData.gameState] || 'Waiting')
        
        // Check if game is finished - matching contract logic
        if (gameData.gameState === 2) { // Finished state
          const finalWinner = await getWinner(gameId!)
          const winnerText = finalWinner === 'player' ? 'Player' : 
                           finalWinner === 'bot' ? 'Bot' : 'Tie'

          addToHistory(`🎉 Game finished! Final score: Player ${gameData.player1Score} - Bot ${gameData.player2Score}`)
          addToHistory(`🏆 Winner: ${winnerText}`)
          
          // Show PvE victory modal
          setPveWinner(finalWinner as 'player' | 'bot')
          setShowPvEVictoryModal(true)
        }
      }

    } catch (err: any) {
      console.error('Error playing card:', err)
      setError(err.message || 'Error playing card')
      addToHistory(`❌ Error playing card: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // New game
  const handleNewGame = useCallback(() => {
    setGameState('Waiting')
    setPlayerHand([])
    setBotHand([])
    setPlayedCards([])
    setPlayerScore(0)
    setBotScore(0)
    setCurrentRound(0)
    setGameHistory([])
    setGameId(null)
    setIsBotThinking(false)
    setError(null)
    setIsLoading(false)
    setShowVictoryModal(false)
    setShowPvEVictoryModal(false)
    setPveWinner(null)
    setHasStartedPvE(false)

    if (mode === 'demo') {
      startDemoGame()
    } else {
      startPvEGame()
    }
  }, [mode, startDemoGame, startPvEGame])

  // Back to menu
  const handleBackToMenu = useCallback(() => {
    router.push('/')
  }, [router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Show wallet connection screen for PvE mode
  if (mode === 'pve' && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <GamepadIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Wallet Required</h1>
            <p className="text-gray-300 text-lg">Connect your wallet to play against the bot with FHE encryption</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={connect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 disabled:opacity-50 text-lg"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            <button
              onClick={handleBackToMenu}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 text-lg"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container">
      {/* Background Pattern */}
      <div className="background-pattern"></div>

      <div className="content-container">
        {/* Header */}
        <header className="game-header">
          <h1 className="game-title">
            {mode === 'demo' ? 'Demo Game' : 'Player vs Bot'}
          </h1>
          <p className="game-subtitle">
            {mode === 'demo' 
              ? (playerHand.length === 0 ? 'Click "Start Demo Game" to begin' : 'Demo game in progress...')
              : 'Play against an intelligent bot with <span className="highlight-text">FHE-encrypted</span> card comparisons'
            }
          </p>
        </header>

        {/* Navigation */}
        <div className="navigation">
          <button
            onClick={handleBackToMenu}
            className="back-button"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Menu
          </button>
          <div className="header-actions">
            <button
              onClick={() => setShowRules(true)}
              className="header-button"
            >
              <GamepadIcon className="w-4 h-4" />
              Rules
            </button>
            
            <button
              onClick={handleNewGame}
              className="header-button"
              disabled={isLoading}
            >
              <RefreshIcon className="w-4 h-4" />
              {mode === 'demo' 
                ? (playerHand.length === 0 ? 'Start Demo Game' : 'Restart Demo')
                : 'New Game'
              }
            </button>
            
            {isConnected && (
              <div className="wallet-info">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            )}
          </div>
        </div>

        {/* Main Game Area */}
        <div className="main-game-area">
          {/* Game Board */}
          <div className="game-board">
            {/* Player Cards */}
            <div className="card-section">
              <h3 className="card-section-title">
                {mode === 'demo' ? 'Player Bot Cards' : 'Your Cards'}
              </h3>
              <div className="card-grid">
              {playerHand.map((card, index) => (
                <Card
                  key={`player-${index}-${card}`}
                  value={card}
                  onClick={() => handleCardPlay(card)}
                  disabled={gameState === 'Finished'}
                  isPlayable={true}
                  animationDelay={index * 100}
                  player="player"
                />
              ))}
              </div>
            </div>

            {/* Bot Cards */}
            <div className="card-section">
              <h3 className="card-section-title">
                Bot Cards {isBotThinking && <span className="text-yellow-400">(Thinking...)</span>}
              </h3>
              <div className="card-grid">
              {botHand.map((card, index) => (
                <Card
                  key={`bot-${index}`}
                  value={card}
                  isRevealed={false}
                  animationDelay={index * 150}
                  isThinking={isBotThinking && index === 0}
                  player="bot"
                  onClick={undefined}
                />
              ))}
              </div>
              {botHand.length === 0 && (
                <div className="text-center text-gray-400 mt-2">
                  Bot has played all cards
                </div>
              )}
            </div>

            {/* Played Cards */}
            {playedCards.length > 0 && (
              <div className="played-cards-section">
                <div className="played-card-container">
                  <div className="played-card-label">You</div>
                  <Card
                    value={playedCards[playedCards.length - 1]?.player || 0}
                    player="player"
                    isWinner={playedCards[playedCards.length - 1]?.player > playedCards[playedCards.length - 1]?.bot}
                    animationDelay={0}
                    isRevealed={true}
                    onClick={undefined}
                  />
                </div>
                <div className="played-card-container">
                  <div className="played-card-label">Bot</div>
                  <Card
                    value={playedCards[playedCards.length - 1]?.bot || 0}
                    player="bot"
                    isWinner={playedCards[playedCards.length - 1]?.bot > playedCards[playedCards.length - 1]?.player}
                    animationDelay={200}
                    isRevealed={true}
                    onClick={undefined}
                  />
                </div>
              </div>
            )}

            {/* Game Status */}
            <div className="game-status">
              <div className="round-info">
                Round {currentRound + 1} of 5
              </div>
              <div className="score-display">
                Player {playerScore} - Bot {botScore}
              </div>
              {gameState === 'Playing' && mode === 'pve' && (
                <div className="game-message playing">
                  {isBotThinking ? 'Bot is thinking...' : 'Select a card to play'}
                </div>
              )}
              {gameState === 'Finished' && (
                <div className="game-message finished">
                  Game Finished!
                </div>
              )}
              {(error || contractError) && (
                <div className="error-display">
                  {error || contractError}
                </div>
              )}
            </div>
        </div>

          {/* Sidebar */}
          <div className="sidebar">
            <h3>Game Info</h3>
          
            <div className="info-item">
              <div className="info-label">Mode</div>
              <div className="info-value">
                {mode === 'demo' ? 'Demo' : 'Player vs Bot'}
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-label">FHE Status</div>
              <div className="info-value active">Active</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Bot Cards Left</div>
              <div className="info-value">{botHand.length}</div>
            </div>

            <div className="game-history">
              <h4>Game History</h4>
              <div className="history-list">
                {gameHistory.length === 0 ? (
                  <div className="text-gray-400 text-sm">No events yet</div>
                ) : (
                  gameHistory.slice(-10).map((event, index) => (
                    <div key={index} className="history-item">
                      {event}
                    </div>
                  ))
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="victory-modal">
          <div className="victory-content">
            <h2 className="victory-title">Game Rules</h2>
            <div className="text-left text-gray-300 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">How to Play</h3>
                <p>1. Each player starts with 5 cards (values 1-10)</p>
                <p>2. Players take turns playing one card per round</p>
                <p>3. Higher card value wins the round</p>
                <p>4. Winner gets 1 point per round</p>
                <p>5. First to win 3 rounds wins the game</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">FHE Features</h3>
                <p>• Cards are encrypted using Fully Homomorphic Encryption</p>
                <p>• Comparisons happen without revealing card values</p>
                <p>• Privacy is maintained throughout the game</p>
              </div>
            </div>
            <div className="victory-buttons">
              <button
                onClick={() => setShowRules(false)}
                className="victory-button"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {showVictoryModal && (
        <div className="victory-modal">
          <div className="victory-content">
            <div className="victory-emoji">🎉</div>
            <h2 className="victory-title">Game Over!</h2>
            <div className="victory-score">
              Final Score: Player {playerScore} - Bot {botScore}
            </div>
            <div className="victory-buttons">
              <button
                onClick={() => {
                  setShowVictoryModal(false)
                  setGameState('Waiting')
                  setPlayerHand([])
                  setBotHand([])
                  setPlayedCards([])
                  setPlayerScore(0)
                  setBotScore(0)
                  setCurrentRound(0)
                  setGameHistory([])
                  setIsBotThinking(false)
                }}
                className="victory-button"
              >
                New Game
              </button>
              <button
                onClick={() => setShowVictoryModal(false)}
                className="victory-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PvE Victory Modal */}
      {showPvEVictoryModal && (
        <div className="victory-modal">
          <div className="victory-content">
            <div className="victory-emoji">
              {pveWinner === 'player' ? '🎉' : '🤖'}
            </div>
            <h2 className="victory-title">
              {pveWinner === 'player' ? 'You Win!' : 'Bot Wins!'}
            </h2>
            <div className="victory-score">
              Final Score: Player {playerScore} - Bot {botScore}
            </div>
            <div className="victory-buttons">
              <button
                onClick={() => {
                  setShowPvEVictoryModal(false)
                  setPveWinner(null)
                  handleNewGame()
                }}
                className="victory-button"
              >
                New Game
              </button>
              <button
                onClick={() => setShowPvEVictoryModal(false)}
                className="victory-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    }>
      <GameContent />
    </Suspense>
  )
}