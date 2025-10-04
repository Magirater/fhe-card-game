'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/hooks/useWallet'
import ConnectWallet from '@/components/ConnectWallet'
import { GamepadIcon, ShieldCheckIcon, CpuChipIcon } from '@/components/icons'
import './page.css'

export default function Home() {
  const router = useRouter()
  const { isConnected, address, chainId, connect, isConnecting, error } = useWallet()
  const [isLoading, setIsLoading] = useState(false)

  const handlePlayGame = async (mode: 'pve' | 'demo') => {
    setIsLoading(true)
    try {
      if (mode === 'pve' && !isConnected) {
        await connect()
        return
      }
      
      // Navigate to game page with mode parameter
      router.push(`/game?mode=${mode}`)
    } catch (error) {
      console.error('Error starting game:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isCorrectNetwork = chainId === 11155111 // Sepolia

  return (
    <div className="main-container">
      {/* Background Effects */}
      <div className="background-pattern"></div>

      <div className="content-container">
        {/* Header */}
        <header className="header">
          <p className="main-subtitle">
            Experience the future of gaming with <span className="highlight-text">Fully Homomorphic Encryption</span>.
            Play cards while keeping your moves completely private on the blockchain.
          </p>
        </header>

        {/* Network Status */}
        {isConnected && (
          <div className="network-status">
            {isCorrectNetwork ? (
              <span className="network-badge network-connected">
                <span className="network-dot"></span>
                Connected to Sepolia Network
              </span>
            ) : (
              <span className="network-badge network-wrong">
                <span className="network-dot"></span>
                Wrong Network - Please switch to Sepolia
              </span>
            )}
          </div>
        )}

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="connect-wallet-container">
            <ConnectWallet 
              onConnect={connect}
              isConnecting={isConnecting}
              error={error}
            />
          </div>
        )}

        {/* Game Modes */}
        <div className="game-modes">
          {/* Player vs Bot */}
          <div className="game-mode-card">
            <div className="game-mode-content">
              <div className="game-mode-icon-container">
                <div className="game-mode-icon-glow"></div>
                <GamepadIcon className="game-mode-icon" />
              </div>
              <h2 className="game-mode-title">
                Player vs Bot
              </h2>
              <p className="game-mode-description">
                Play against an intelligent bot with <span className="highlight-text">FHE-encrypted</span> card comparisons. 
                Your cards remain completely private throughout the game.
              </p>
              <button
                onClick={() => handlePlayGame('pve')}
                disabled={isLoading}
                className="game-mode-button"
              >
                <span>{isLoading ? 'Starting...' : '🎮 Play Now'}</span>
              </button>
            </div>
          </div>

          {/* Demo Mode */}
          <div className="game-mode-card">
            <div className="game-mode-content">
              <div className="game-mode-icon-container">
                <div className="game-mode-icon-glow"></div>
                <CpuChipIcon className="game-mode-icon" />
              </div>
              <h2 className="game-mode-title">
                Demo Mode
              </h2>
              <p className="game-mode-description">
                Watch an automated <span className="highlight-text">bot vs bot</span> battle to see FHE in action. 
                No wallet connection required.
              </p>
              <button
                onClick={() => handlePlayGame('demo')}
                disabled={isLoading}
                className="game-mode-button"
              >
                <span>{isLoading ? 'Starting...' : '👀 Watch Demo'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="features">
          <h3 className="features-title">
            Powered by Advanced Technology
          </h3>
          <p className="features-subtitle">
            Experience the cutting-edge intersection of cryptography, blockchain, and gaming
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-container">
                <div className="feature-icon-glow"></div>
                <ShieldCheckIcon className="feature-icon" />
              </div>
              <h4 className="feature-title">FHE Privacy</h4>
              <p className="feature-description">
                Your card values are <span className="highlight-text">encrypted</span> and never revealed during gameplay, ensuring complete privacy
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-container">
                <div className="feature-icon-glow"></div>
                <CpuChipIcon className="feature-icon" />
              </div>
              <h4 className="feature-title">Smart Contracts</h4>
              <p className="feature-description">
                Game logic runs on <span className="highlight-text">Ethereum</span> with transparent, verifiable rules and automated execution
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-container">
                <div className="feature-icon-glow"></div>
                <GamepadIcon className="feature-icon" />
              </div>
              <h4 className="feature-title">Fair Play</h4>
              <p className="feature-description">
                <span className="highlight-text">Randomized</span> card distribution ensures fair and unpredictable games every time
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>
            Built with <span className="highlight-text">Next.js</span>, <span className="highlight-text">TypeScript</span>, and <span className="highlight-text">FHE technology</span>
          </p>
          <p>
            Experience the future of privacy-preserving gaming
          </p>
        </footer>
      </div>
    </div>
  )
}

