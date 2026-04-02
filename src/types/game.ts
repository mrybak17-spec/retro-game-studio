export interface GridCell {
  id: string;
  question: string;
  answer: string;
  displayText: string;
  points?: number;
  revealed?: boolean;
  imageUrl?: string;
  audioUrl?: string;
}

export interface GridGame {
  id: string;
  type: 'grid';
  name: string;
  columns: number;
  rows: number;
  columnNames: string[];
  rowNames: string[];
  cells: GridCell[][];
  primaryColor: string;
  secondaryColor: string;
}

export interface Slide {
  id: string;
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  question?: string;
  answer?: string;
}

export interface SlidesGame {
  id: string;
  type: 'slides';
  name: string;
  slides: Slide[];
  backgroundColor: string;
  textColor: string;
}

export interface WheelSegment {
  id: string;
  displayText: string;
  question: string;
  answer: string;
  color: string;
}

export interface WheelGame {
  id: string;
  type: 'wheel';
  name: string;
  segments: WheelSegment[];
}

export interface BoardCell {
  id: string;
  question: string;
  answer: string;
  displayText: string;
  teamColor?: string;
  points?: number;
  revealed?: boolean;
  imageUrl?: string;
  audioUrl?: string;
}

export interface BoardGame {
  id: string;
  type: 'board';
  name: string;
  columns: number;
  rows: number;
  rowNames: string[];
  cells: BoardCell[][];
  teamColor1: string;
  teamColor2: string;
  pointValues: number[];
}

export type Game = GridGame | SlidesGame | WheelGame | BoardGame;

// Game Show - Collection of multiple games
export interface GameShow {
  id: string;
  name: string;
  description: string;
  games: Game[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isFake: boolean; // For testing without backend
  drawing?: string; // Base64 or data URL of pixel drawing
  points: number;
  isReady: boolean;
}

export interface GameSession {
  id: string;
  code: string;
  gameShow: GameShow;
  currentGameIndex: number;
  players: Player[];
  hostId: string;
  status: 'lobby' | 'drawing' | 'playing' | 'ended';
  currentQuestion?: {
    cellId?: string;
    slideIndex?: number;
    segmentId?: string;
  };
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface ValidationError {
  field: string;
  message: string;
  gameId?: string;
}
