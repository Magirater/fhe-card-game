'use client'

import React from 'react'

interface GameStatusProps {
  currentRound: number
  playerScore: number
  botScore: number
  gameState: 'Waiting' | 'Playing' | 'Finished'
  isBotThinking: boolean
}

export default function GameStatus({
  currentRound,
  playerScore,
  botScore,
  gameState,
  isBotThinking
}: GameStatusProps) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-white mb-2">
        Round {currentRound} of 5
      </div>
      <div className="text-2xl font-bold text-cyan-400">
        Player {playerScore} - Bot {botScore}
      </div>
      {gameState === 'Finished' && (
        <div className="text-xl font-bold text-yellow-400 mt-4">
          Game Finished!
        </div>
      )}
      {isBotThinking && (
        <div className="text-lg text-blue-400 mt-2">
          Bot is thinking...
        </div>
      )}
    </div>
  )
}

