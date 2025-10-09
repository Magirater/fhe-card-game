'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import type { WalletState } from '../types/game'
import fheDeployment from '../fhe-deployment.json'

// Contract ABI and address from deployment
const CONTRACT_ABI = fheDeployment.abi
const CONTRACT_ADDRESS = fheDeployment.address

// Relayer instance
let relayerInstance: any = null

export function useFHECardGame(walletState: WalletState) {
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  
  // Simple ref to prevent multiple initializations
  const initializedRef = useRef(false)

  // Initialize Relayer and contract
  const initializeContract = useCallback(async () => {
    if (!walletState.isConnected || !walletState.address || initializedRef.current) {
      return
    }

    try {
      initializedRef.current = true
      
      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const network = await provider.getNetwork()
        
        // Check if we're on Sepolia testnet (chainId: 11155111)
        if (Number(network.chainId) !== 11155111) {
          setError('Please switch to Sepolia testnet for FHE functionality')
          return
        }
        
        // Initialize Relayer instance with Zama SDK
        try {
          // Use require for CommonJS module
          const zamaSDK = require('@zama-fhe/relayer-sdk') as any
          if (zamaSDK.createInstance && zamaSDK.SepoliaConfig) {
            relayerInstance = await zamaSDK.createInstance(zamaSDK.SepoliaConfig)
          } else {
            console.warn('Zama FHE SDK loaded but missing required exports')
            return
          }
        } catch (error) {
          console.warn('Failed to load Zama FHE SDK:', error)
          // Fallback: continue without FHE functionality
          return
        }
        
        const signer = await provider.getSigner()
        const gameContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        
        setContract(gameContract)
        setIsConnected(true)
        setError(null)
        console.log('✅ FHE Contract and Relayer initialized with Zama SDK')
      }
    } catch (err: any) {
      console.error('FHE Contract init failed:', err)
      setError(err.message || 'Failed to initialize FHE contract')
      setIsConnected(false)
      initializedRef.current = false
    }
  }, [walletState.isConnected, walletState.address])

  // Create game
  const createGame = useCallback(async (): Promise<number | null> => {
    if (!contract || isCreatingGame) return null

    try {
      setIsCreatingGame(true)
      console.log('🎮 Creating FHE game...')
      
      // Create game with FHE encryption
      const tx = await contract.createGame()
      console.log('🎮 FHE Transaction sent:', tx.hash)
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      console.log('🎮 FHE Transaction confirmed, logs:', receipt.logs.length)
      
      // Get game ID from events
      const gameCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log)
          return parsed?.name === 'GameCreated'
        } catch {
          return false
        }
      })
      
      if (gameCreatedEvent) {
        const parsed = contract.interface.parseLog(gameCreatedEvent)
        const gameId = Number(parsed?.args[0])
        console.log('🎮 FHE Game ID:', gameId)
        return gameId
      }
      
      return null
    } catch (err: any) {
      console.error('Create FHE game failed:', err)
      setError(err.message || 'Failed to create FHE game')
      return null
    } finally {
      setIsCreatingGame(false)
    }
  }, [contract, isCreatingGame])

  // Play card with FHE using Relayer
  const playCard = useCallback(async (gameId: number, cardValue: number): Promise<boolean> => {
    if (!contract || !relayerInstance) return false

    try {
      console.log(`🎮 Playing FHE card ${cardValue} in game ${gameId}`)
      
      // Use Relayer to encrypt and send the card
      const encryptedCard = relayerInstance.encrypt8(cardValue)
      
      // Use Relayer to call the contract function
      const tx = await relayerInstance.callContract({
        to: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'playCardEncrypted',
        args: [gameId, encryptedCard]
      })
      
      console.log('🎮 FHE Transaction sent via Relayer:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('🎮 FHE Transaction confirmed:', receipt.status === 1 ? 'success' : 'failed')
      
      return receipt.status === 1
    } catch (err: any) {
      console.error('Play FHE card failed:', err)
      setError(err.message || 'Failed to play FHE card')
      return false
    }
  }, [contract])

  // Get game data using Relayer
  const getGameData = useCallback(async (gameId: number) => {
    if (!contract || !relayerInstance) {
      console.log('❌ No FHE contract or Relayer instance available for getGameData')
      return null
    }

    try {
      console.log(`🎮 Getting FHE game data for gameId: ${gameId}`)
      
      // Use Relayer to call contract functions
      const [playerHand, botHand, gameScores, playedCards, gameData, gameState] = await Promise.all([
        relayerInstance.callContract({
          to: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getPlayerHand',
          args: [gameId]
        }),
        relayerInstance.callContract({
          to: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getBotHand',
          args: [gameId]
        }),
        relayerInstance.callContract({
          to: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getGameScores',
          args: [gameId]
        }),
        relayerInstance.callContract({
          to: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getPlayedCards',
          args: [gameId]
        }),
        relayerInstance.callContract({
          to: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'games',
          args: [gameId]
        }),
        relayerInstance.callContract({
          to: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getGameState',
          args: [gameId]
        })
      ])

      console.log('🎮 Raw FHE game data:', {
        playerHand,
        botHand,
        gameScores,
        playedCards,
        gameData,
        gameState
      })

      // Decrypt the encrypted data using Relayer
      const result = {
        playerHand: playerHand.map((card: any) => relayerInstance.decrypt(card)),
        botHand: botHand.map((card: any) => relayerInstance.decrypt(card)),
        player1Score: relayerInstance.decrypt(gameScores[0]),
        player2Score: relayerInstance.decrypt(gameScores[1]),
        currentRound: relayerInstance.decrypt(gameData.currentRound),
        playedCards: playedCards.map((card: any) => relayerInstance.decrypt(card)),
        gameState: gameState // 0=Waiting, 1=Playing, 2=Finished
      }

      console.log('🎮 Processed FHE game data:', result)
      return result
    } catch (err: any) {
      console.error('❌ Get FHE game data failed:', err)
      setError(err.message || 'Failed to get FHE game data')
      return null
    }
  }, [contract])

  // Get winner (for finished games)
  const getWinner = useCallback(async (gameId: number): Promise<'player' | 'bot' | 'tie' | null> => {
    if (!contract || !relayerInstance) return null

    try {
      const gameState = await relayerInstance.callContract({
        to: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getGameState',
        args: [gameId]
      })
      
      if (gameState !== 2) return null // Not finished

      const [playerScore, botScore] = await relayerInstance.callContract({
        to: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getGameScores',
        args: [gameId]
      })
      
      // Decrypt scores to determine winner
      const decryptedPlayerScore = relayerInstance.decrypt(playerScore)
      const decryptedBotScore = relayerInstance.decrypt(botScore)
      
      if (decryptedPlayerScore > decryptedBotScore) return 'player'
      if (decryptedBotScore > decryptedPlayerScore) return 'bot'
      return 'tie'
    } catch (err: any) {
      console.error('Get FHE winner failed:', err)
      return null
    }
  }, [contract])

  // FHE specific functions using Relayer
  const createEncryptedCard = useCallback(async (value: number): Promise<string> => {
    if (!relayerInstance) return ''
    
    try {
      const encryptedCard = relayerInstance.encrypt8(value)
      return encryptedCard
    } catch (err: any) {
      console.error('Create encrypted card failed:', err)
      return ''
    }
  }, [])

  const compareCards = useCallback(async (card1: string, card2: string): Promise<boolean> => {
    if (!relayerInstance) return false
    
    try {
      // Decrypt both cards and compare
      const decryptedCard1 = relayerInstance.decrypt(card1)
      const decryptedCard2 = relayerInstance.decrypt(card2)
      return decryptedCard1 > decryptedCard2
    } catch (err: any) {
      console.error('Compare cards failed:', err)
      return false
    }
  }, [])

  // Make scores publicly decryptable using Relayer
  const makeScoresPublic = useCallback(async (gameId: number): Promise<boolean> => {
    if (!relayerInstance) return false
    
    try {
      const tx = await relayerInstance.callContract({
        to: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'makeScoresPublic',
        args: [gameId]
      })
      await tx.wait()
      return true
    } catch (err: any) {
      console.error('Make scores public failed:', err)
      return false
    }
  }, [])

  // Make round publicly decryptable using Relayer
  const makeRoundPublic = useCallback(async (gameId: number): Promise<boolean> => {
    if (!relayerInstance) return false
    
    try {
      const tx = await relayerInstance.callContract({
        to: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'makeRoundPublic',
        args: [gameId]
      })
      await tx.wait()
      return true
    } catch (err: any) {
      console.error('Make round public failed:', err)
      return false
    }
  }, [])

  // Cleanup
  const cleanup = useCallback(() => {
    setContract(null)
    setIsConnected(false)
    setError(null)
    setIsCreatingGame(false)
    relayerInstance = null
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
    createEncryptedCard,
    compareCards,
    makeScoresPublic,
    makeRoundPublic,
    cleanup
  }
}
