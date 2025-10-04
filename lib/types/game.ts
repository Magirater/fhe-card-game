export interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  error: string | null
}

export interface GameState {
  gameId: number | null
  playerHand: number[]
  botHand: number[]
  playedCards: { player: number; bot: number }[]
  playerScore: number
  botScore: number
  currentRound: number
  isFinished: boolean
  winner: 'player' | 'bot' | 'tie' | null
}

export interface GameHistory {
  round: number
  playerCard: number
  botCard: number
  winner: 'player' | 'bot' | 'tie'
  timestamp: number
}

export interface ContractState {
  isConnected: boolean
  contractAddress: string | null
  error: string | null
}

export interface FHEState {
  isActive: boolean
  encryptedValues: string[]
  decryptedValues: number[]
}

