'use client'

import React, { memo, useMemo } from 'react'

interface GameSidebarProps {
  mode: 'pve' | 'demo' | null
  isConnected: boolean
  isContractConnected: boolean
  botHandLength: number
  gameHistory: string[]
}

const GameSidebar = memo<GameSidebarProps>(({
  mode,
  isConnected,
  isContractConnected,
  botHandLength,
  gameHistory
}) => {
  // Memoized history items to prevent unnecessary re-renders
  const historyItems = useMemo(() => 
    gameHistory.length === 0 ? (
      <div className="history-item">No events yet</div>
    ) : (
      gameHistory.slice(-10).map((event, index) => (
        <div key={`history-${index}-${event.slice(0, 10)}`} className="history-item">
          {event}
        </div>
      ))
    ), [gameHistory]
  )

  return (
    <div className="game-sidebar">
      <h3 className="sidebar-title">Game Info</h3>
      
      <div className="info-item">
        <div className="info-label">Mode</div>
        <div className="info-value">
          {mode === 'demo' ? 'Demo' : 'Player vs Bot'}
        </div>
      </div>
      
      <div className="info-item">
        <div className="info-label">FHE Status</div>
        <div className="info-value text-green-400">
          Active
        </div>
      </div>
      
      {isConnected && (
        <div className="info-item">
          <div className="info-label">Contract</div>
          <div className={`info-value ${isContractConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isContractConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      )}

      <div className="info-item">
        <div className="info-label">Bot Cards Left</div>
        <div className="info-value">
          {botHandLength}
        </div>
      </div>

      {/* Game History */}
      <div className="game-history">
        <h4 className="history-title">Game History</h4>
        <div className="history-list">
          {historyItems}
        </div>
      </div>
    </div>
  )
})

GameSidebar.displayName = 'GameSidebar'

export default GameSidebar