'use client'

import { useState } from 'react'

interface ConnectWalletProps {
  onConnect: () => Promise<void>
  isConnecting: boolean
  error: string | null
}

export default function ConnectWallet({ onConnect, isConnecting, error }: ConnectWalletProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4 px-4 max-w-sm mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">
          Connect Wallet
        </h2>
        <p className="text-gray-300 text-lg max-w-xs mx-auto">
          Connect your EVM wallet to start playing
        </p>
      </div>
      
      <div className="flex justify-center w-full">
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="game-mode-button flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
          style={{
            background: isConnecting 
              ? 'linear-gradient(135deg, rgba(75, 85, 99, 0.5), rgba(55, 65, 81, 0.5))'
              : 'linear-gradient(135deg, #00ffff, #ff00ff)',
            color: isConnecting ? '#9ca3af' : '#0a0a0a',
            width: '280px',
            height: '56px',
            fontSize: '16px',
            borderRadius: '20px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            border: 'none',
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isConnecting
              ? '0 2px 8px rgba(0, 255, 255, 0.2)'
              : '0 4px 20px rgba(0, 255, 255, 0.4), 0 0 40px rgba(255, 0, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}
        >
          {isConnecting ? (
            <>
              <div 
                className="border border-current border-t-transparent rounded-full animate-spin mr-2"
                style={{ width: '16px', height: '16px' }}
              ></div>
              Connecting...
            </>
          ) : (
            <>
              <svg 
                className="mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ width: '16px', height: '16px' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Connect Wallet
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-center text-base max-w-xs mx-auto">
          {error}
        </div>
      )}
    </div>
  )
}

