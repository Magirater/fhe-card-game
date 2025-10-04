'use client'

import React, { useState, useEffect } from 'react'

interface CardProps {
  value: number
  onClick?: () => void
  disabled?: boolean
  isPlayable?: boolean
  isSelected?: boolean
  isPlayed?: boolean
  isRevealed?: boolean
  isThinking?: boolean
  isRevealing?: boolean
  animationDelay?: number
  player?: 'player' | 'bot'
  isWinner?: boolean
}

// Card design configurations for values 1-9 - clean modern design
const getCardDesign = (value: number) => {
  const designs = {
    1: { 
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', 
      color: '#ffffff',
      glow: 'rgba(239, 68, 68, 0.4)',
      accent: 'linear-gradient(135deg, #f87171, #ef4444)'
    },
    2: { 
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
      color: '#ffffff',
      glow: 'rgba(59, 130, 246, 0.4)',
      accent: 'linear-gradient(135deg, #60a5fa, #3b82f6)'
    },
    3: { 
      gradient: 'linear-gradient(135deg, #10b981, #059669)', 
      color: '#ffffff',
      glow: 'rgba(16, 185, 129, 0.4)',
      accent: 'linear-gradient(135deg, #34d399, #10b981)'
    },
    4: { 
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
      color: '#ffffff',
      glow: 'rgba(139, 92, 246, 0.4)',
      accent: 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
    },
    5: { 
      gradient: 'linear-gradient(135deg, #eab308, #f59e0b)', 
      color: '#ffffff',
      glow: 'rgba(234, 179, 8, 0.4)',
      accent: 'linear-gradient(135deg, #facc15, #eab308)'
    },
    6: { 
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', 
      color: '#ffffff',
      glow: 'rgba(236, 72, 153, 0.4)',
      accent: 'linear-gradient(135deg, #f472b6, #ec4899)'
    },
    7: { 
      gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
      color: '#ffffff',
      glow: 'rgba(99, 102, 241, 0.4)',
      accent: 'linear-gradient(135deg, #818cf8, #6366f1)'
    },
    8: { 
      gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)', 
      color: '#ffffff',
      glow: 'rgba(20, 184, 166, 0.4)',
      accent: 'linear-gradient(135deg, #5eead4, #14b8a6)'
    },
    9: { 
      gradient: 'linear-gradient(135deg, #10b981, #059669)', 
      color: '#ffffff',
      glow: 'rgba(16, 185, 129, 0.4)',
      accent: 'linear-gradient(135deg, #34d399, #10b981)'
    }
  }
  
  return designs[value as keyof typeof designs] || designs[1]
}

function Card({ 
  value, 
  onClick, 
  disabled = false, 
  isPlayable = true,
  isSelected = false,
  isPlayed = false,
  isRevealed = true,
  isThinking = false,
  isRevealing = false,
  animationDelay = 0,
  player = 'player',
  isWinner = false
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [showValue, setShowValue] = useState(isRevealed)

  const cardDesign = getCardDesign(value)
  const isPlayer = player === 'player'

  // Handle click
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
    
    setIsClicked(true)
    setTimeout(() => {
      setIsClicked(false)
    }, 200)
  }

  // Handle reveal animation
  useEffect(() => {
    if (isRevealed && !showValue) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setShowValue(true)
        setIsAnimating(false)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [isRevealed, showValue, value])

  // Handle entrance animation
  useEffect(() => {
    if (animationDelay > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, animationDelay + 600)
      
      return () => clearTimeout(timer)
    }
  }, [animationDelay])

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative text-center rounded-3xl border-2 border-white/20 shadow-2xl
        transition-all duration-500 ease-out transform backdrop-blur-sm
        ${isAnimating ? 'animate-cardEntrance' : 'opacity-0 translate-y-8'}
        ${isThinking ? 'animate-cardPulse' : ''}
        ${isRevealing ? 'animate-cardFlip' : ''}
        ${isPlayer ? 'cursor-pointer' : 'cursor-default'}
        ${isHovered && isPlayer ? 'hover:scale-110 hover:-translate-y-3 hover:rotate-2' : ''}
        ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-75 scale-105 shadow-2xl shadow-yellow-400/50' : ''}
        ${isPlayed ? 'opacity-60 scale-95' : ''}
        ${isClicked ? 'animate-cardFlip' : ''}
        ${isHovered && isPlayer ? 'animate-cardGlow' : ''}
        ${isWinner ? 'animate-cardPulse ring-4 ring-yellow-400 ring-opacity-75' : ''}
        ${showValue ? '' : 'text-white'}
      `}
      style={{
        width: '200px',
        height: '280px',
        background: showValue ? cardDesign.gradient : 'linear-gradient(135deg, #64748b, #475569)',
        color: showValue ? cardDesign.color : '#ffffff',
        animationDelay: `${animationDelay}ms`,
        zIndex: 1000,
        pointerEvents: 'auto',
        position: 'relative',
        boxShadow: isHovered && isPlayer
          ? `0 40px 80px ${cardDesign.glow}, 0 0 0 2px rgba(0, 255, 255, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), 0 0 100px ${cardDesign.glow}` 
          : isSelected 
            ? '0 30px 60px rgba(255, 255, 0, 0.7), 0 0 0 2px rgba(255, 255, 0, 0.8), inset 0 2px 0 rgba(255, 255, 255, 0.3), 0 0 50px rgba(255, 255, 0, 0.4)' 
            : isWinner
              ? `0 35px 70px ${cardDesign.glow}, 0 0 0 2px rgba(255, 255, 0, 0.9), inset 0 2px 0 rgba(255, 255, 255, 0.4), 0 0 80px ${cardDesign.glow}`
              : '0 15px 40px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2), 0 0 20px rgba(0, 255, 255, 0.1)'
      }}
    >
      {/* Card back pattern (when not revealed) */}
      {!showValue && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-600 to-slate-800" />
      )}

      {/* Gradient border overlay */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-30"
        style={{
          background: showValue 
            ? `linear-gradient(135deg, ${cardDesign.glow}, transparent, ${cardDesign.glow})`
            : 'linear-gradient(135deg, rgba(0, 255, 255, 0.3), transparent, rgba(0, 255, 255, 0.3))'
        }}
      />

      {/* Inner glow effect */}
      <div 
        className="absolute inset-2 rounded-2xl opacity-20"
        style={{
          background: showValue 
            ? `radial-gradient(circle at center, ${cardDesign.glow}, transparent)`
            : 'radial-gradient(circle at center, rgba(0, 255, 255, 0.2), transparent)'
        }}
      />

      {/* Card content - single centered number */}
      <div className="relative z-10 flex items-center justify-center h-full w-full">
        {showValue ? (
          <div 
            className="font-black transform transition-all duration-500 drop-shadow-2xl flex items-center justify-center"
            style={{ 
              fontSize: '120px',
              textShadow: `0 0 30px ${cardDesign.glow}, 0 0 60px ${cardDesign.glow}`,
              width: '100%',
              height: '100%'
            }}
          >
            {value}
          </div>
        ) : (
          <div 
            className="font-bold opacity-70 flex items-center justify-center"
            style={{ 
              fontSize: '80px',
              textShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
              width: '100%',
              height: '100%'
            }}
          >
            ?
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-xl">
          <div className="w-5 h-5 bg-yellow-600 rounded-full" />
        </div>
      )}

      {/* Played indicator */}
      {isPlayed && (
        <div className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center backdrop-blur-sm">
          <div className="text-white/95 text-sm font-bold tracking-widest uppercase">Played</div>
        </div>
      )}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-ping shadow-xl">
          <div className="w-5 h-5 bg-yellow-600 rounded-full" />
        </div>
      )}

      {/* Winner crown */}
      {isWinner && (
        <div className="absolute -top-5 -right-5 text-yellow-400 text-2xl animate-bounce drop-shadow-lg">
          👑
        </div>
      )}

      {/* Hover glow effect - only for player cards */}
      {isHovered && isPlayer && (
        <>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/30 to-transparent animate-pulse" />
          <div 
            className="absolute inset-0 rounded-3xl animate-pulse"
            style={{
              background: `radial-gradient(circle at center, ${cardDesign.glow}, transparent)`,
              opacity: 0.4
            }}
          />
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse" />
        </>
      )}

      {/* Winner glow effect */}
      {isWinner && (
        <>
          <div 
            className="absolute inset-0 rounded-3xl animate-pulse"
            style={{
              background: `radial-gradient(circle at center, ${cardDesign.glow}, transparent)`,
              opacity: 0.6
            }}
          />
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent transform -skew-x-12 animate-pulse" />
        </>
      )}

      {/* Thinking glow effect */}
      {isThinking && (
        <div 
          className="absolute inset-0 rounded-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 255, 255, 0.3), transparent)',
            opacity: 0.5
          }}
        />
      )}
    </div>
  )
}

export default Card