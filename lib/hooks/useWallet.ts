'use client'

import { useState, useEffect, useCallback } from 'react'
import type { WalletState } from '../types/game'

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    error: null
  })

  const [isConnecting, setIsConnecting] = useState(false)

  // Check if MetaMask is available
  const isMetaMaskAvailable = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }, [])

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskAvailable()) {
      setWalletState(prev => ({
        ...prev,
        error: 'MetaMask is not installed'
      }))
      return
    }

    setIsConnecting(true)
    setWalletState(prev => ({ ...prev, error: null }))

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      })

      setWalletState({
        isConnected: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        error: null
      })

    } catch (error: any) {
      console.error('Wallet connection error:', error)
      setWalletState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet'
      }))
    } finally {
      setIsConnecting(false)
    }
  }, [isMetaMaskAvailable])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      error: null
    })
  }, [])

  // Check if already connected
  const checkConnection = useCallback(async () => {
    if (!isMetaMaskAvailable()) return

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      })

      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        })

        setWalletState({
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          error: null
        })
      }
    } catch (error) {
      console.error('Connection check failed:', error)
    }
  }, [isMetaMaskAvailable])

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      setWalletState(prev => ({
        ...prev,
        address: accounts[0] || null
      }))
    }
  }, [disconnect])

  // Handle chain changes
  const handleChainChanged = useCallback((chainId: string) => {
    setWalletState(prev => ({
      ...prev,
      chainId: parseInt(chainId, 16)
    }))
  }, [])

  // Set up event listeners
  useEffect(() => {
    if (!isMetaMaskAvailable()) return

    // Check existing connection
    checkConnection()

    // Set up event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [isMetaMaskAvailable, checkConnection, handleAccountsChanged, handleChainChanged])

  // Mock connection for development
  const connectMock = useCallback((mockAddress: string = '0x1234567890123456789012345678901234567890') => {
    setWalletState({
      isConnected: true,
      address: mockAddress,
      chainId: 31337, // Local dev chain
      error: null
    })
  }, [])

  return {
    ...walletState,
    connect,
    connectMock,
    disconnect,
    isConnecting,
    isMetaMaskAvailable: isMetaMaskAvailable()
  }
}

