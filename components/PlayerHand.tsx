'use client'

import React from 'react'
import Card from './Card'

interface PlayerHandProps {
  cards: number[]
  onCardPlay: (card: number) => void
  disabled?: boolean
  title?: string
}

export default function PlayerHand({ 
  cards, 
  onCardPlay, 
  disabled = false,
  title = "Your Cards"
}: PlayerHandProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="grid grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <Card
            key={index}
            value={card}
            onClick={() => onCardPlay(card)}
            disabled={disabled}
            isPlayable={!disabled}
          />
        ))}
      </div>
    </div>
  )
}

