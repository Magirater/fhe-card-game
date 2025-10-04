'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import type { WalletState } from '../types/game'
import sepoliaDeployment from '../sepolia-deployment.json'

// Contract ABI and address from deployment
const CONTRACT_ABI = sepoliaDeployment.abi
const CONTRACT_ADDRESS = sepoliaDeployment.address

export function useMockFHEVMGame(walletState: WalletState) {
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  
  // Simple ref to prevent multiple initializations
  const initializedRef = useRef(false)

  // Initialize contract
  const initializeContract = useCallback(async () => {
    if (!walletState.isConnected || !walletState.address || initializedRef.current) {
      return
    }

    try {
      initializedRef.current = true
      
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const network = await provider.getNetwork()
        
        if (Number(network.chainId) !== 11155111) {
          throw new Error('Please switch to Sepolia testnet')
        }
        
        const signer = await provider.getSigner()
        const gameContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        
        setContract(gameContract)
        setIsConnected(true)
        setError(null)
        console.log('✅ Contract initialized')
      }
    } catch (err: any) {
      console.error('Contract init failed:', err)
      setError(err.message || 'Failed to initialize contract')
      setIsConnected(false)
      initializedRef.current = false
    }
  }, [walletState.isConnected, walletState.address])

  // Create game
  const createGame = useCallback(async (): Promise<number | null> => {
    if (!contract || isCreatingGame) return null

    try {
      setIsCreatingGame(true)
      console.log('🎮 Creating game...')
      
      // First, simulate the call to get the gameId
      console.log('🎮 Simulating createGame call...')
      const simulatedGameId = await contract.createGame.staticCall()
      console.log('🎮 Simulated game ID:', simulatedGameId.toString())
      
      // Now send the actual transaction
      console.log('🎮 Sending actual transaction...')
      const tx = await contract.createGame()
      console.log('🎮 Transaction sent:', tx.hash)
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      console.log('🎮 Transaction confirmed, logs:', receipt.logs.length)
      
      // Verify the gameId matches
      const gameIdNumber = Number(simulatedGameId.toString())
      console.log('🎮 Final game ID:', gameIdNumber)
      
      if (isNaN(gameIdNumber) || gameIdNumber <= 0) {
        console.error('🎮 Invalid game ID:', gameIdNumber)
        return null
      }
      
      return gameIdNumber
    } catch (err: any) {
      console.error('Create game failed:', err)
      setError(err.message || 'Failed to create game')
      return null
    } finally {
      setIsCreatingGame(false)
    }
  }, [contract, isCreatingGame])

  // Play card
  const playCard = useCallback(async (gameId: number, cardValue: number): Promise<boolean> => {
    if (!contract) return false

    try {
      console.log(`🎮 Playing card ${cardValue} in game ${gameId}`)
      
      // Check if player has the card first
      const playerHand = await contract.getPlayerHand(gameId)
      const hasCard = playerHand.some((card: any) => Number(card) === cardValue)
      
      if (!hasCard) {
        throw new Error('You don\'t have this card')
      }
      
      // Check game state
      const gameState = await contract.getGameState(gameId)
      if (gameState !== 0n && gameState !== 1n) { // Not Waiting or Playing
        throw new Error(`Game is not in a playable state. Current state: ${gameState}`)
      }
      
      // Check if game is finished
      const gameData = await contract.games(gameId)
      const currentRound = gameData.currentRound
      if (currentRound >= 5) {
        throw new Error('Game is already finished')
      }
      
      const tx = await contract.playCard(gameId, cardValue)
      console.log('🎮 Transaction sent:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('🎮 Transaction confirmed:', receipt.status === 1 ? 'success' : 'failed')
      
      return receipt.status === 1
    } catch (err: any) {
      console.error('Play card failed:', err)
      setError(err.message || 'Failed to play card')
      return false
    }
  }, [contract])

  // Get game data
  const getGameData = useCallback(async (gameId: number) => {
    if (!contract) {
      console.log('❌ No contract available for getGameData')
      return null
    }

    try {
      console.log(`🎮 Getting game data for gameId: ${gameId}`)
      
      const [playerHand, botHand, gameScores, playedCards, gameData, gameState] = await Promise.all([
        contract.getPlayerHand(gameId),
        contract.getBotHand(gameId),
        contract.getGameScores(gameId),
        contract.getPlayedCards(gameId),
        contract.games(gameId),
        contract.getGameState(gameId)
      ])

      console.log('🎮 Raw game data:', {
        playerHand,
        botHand,
        gameScores,
        playedCards,
        gameData,
        gameState
      })

      const result = {
        playerHand: playerHand.map((card: any) => Number(card)),
        botHand: botHand.map((card: any) => Number(card)),
        player1Score: Number(gameScores[0]),
        player2Score: Number(gameScores[1]),
        currentRound: Number(gameData.currentRound),
        playedCards: playedCards.map((card: any) => Number(card)),
        gameState: gameState // 0=Waiting, 1=Playing, 2=Finished
      }

      console.log('🎮 Processed game data:', result)
      return result
    } catch (err: any) {
      console.error('❌ Get game data failed:', err)
      setError(err.message || 'Failed to get game data')
      return null
    }
  }, [contract])

  // Get winner (for finished games)
  const getWinner = useCallback(async (gameId: number): Promise<'player' | 'bot' | 'tie' | null> => {
    if (!contract) return null

    try {
      const gameState = await contract.getGameState(gameId)
      if (gameState !== 2) return null // Not finished

      const [playerScore, botScore] = await contract.getGameScores(gameId)
      
      if (Number(playerScore) > Number(botScore)) return 'player'
      if (Number(botScore) > Number(playerScore)) return 'bot'
      return 'tie'
    } catch (err: any) {
      console.error('Get winner failed:', err)
      return null
    }
  }, [contract])

  // Mock FHE functions
  const mockEncrypt = useCallback((value: number): string => {
    return `encrypted_${value}_${Date.now()}`
  }, [])

  const mockCompare = useCallback((encrypted1: string, encrypted2: string): number => {
    const val1 = parseInt(encrypted1.split('_')[1])
    const val2 = parseInt(encrypted2.split('_')[1])
    return val1 > val2 ? 1 : val1 < val2 ? -1 : 0
  }, [])

  const mockDecrypt = useCallback((encrypted: string): number => {
    return parseInt(encrypted.split('_')[1])
  }, [])

  // Cleanup
  const cleanup = useCallback(() => {
    setContract(null)
    setIsConnected(false)
    setError(null)
    setIsCreatingGame(false)
    initializedRef.current = false
  }, [])

  // Auto-initialize when wallet connects
  useEffect(() => {
    if (walletState.isConnected && !initializedRef.current) {
      initializeContract()
    }
  }, [walletState.isConnected, initializeContract])

  return {
    contract,
    isConnected,
    error,
    isCreatingGame,
    initializeContract,
    createGame,
    playCard,
    getGameData,
    getWinner,
    mockEncrypt,
    mockCompare,
    mockDecrypt,
    cleanup
  }
}