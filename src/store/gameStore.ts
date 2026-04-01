import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game, GameShow, GridGame, SlidesGame, WheelGame, ValidationError, Player, GameSession } from '@/types/game';
import { saveGameShowToDb, loadGameShowsFromDb, deleteGameShowFromDb } from '@/lib/supabaseGameService';

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateGameCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

interface GameStore {
  games: Game[];
  gameShows: GameShow[];
  currentSession: GameSession | null;
  validationErrors: ValidationError[];
  
  // Game CRUD
  addGame: (game: Game) => void;
  updateGame: (id: string, game: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  
  // Game Show CRUD
  addGameShow: (show: GameShow) => void;
  updateGameShow: (id: string, show: Partial<GameShow>) => void;
  deleteGameShow: (id: string) => void;
  loadGameShowsFromCloud: () => Promise<void>;
  isSaving: boolean;
  addGameToShow: (showId: string, game: Game) => void;
  removeGameFromShow: (showId: string, gameIndex: number) => void;
  reorderGamesInShow: (showId: string, fromIndex: number, toIndex: number) => void;
  
  // Session Management (local/fake players for testing)
  createSession: (gameShow: GameShow, hostName: string) => GameSession;
  addFakePlayer: (name: string) => void;
  removeFakePlayer: (playerId: string) => void;
  updatePlayerPoints: (playerId: string, delta: number) => void;
  setPlayerReady: (playerId: string, ready: boolean) => void;
  advanceToNextGame: () => void;
  endSession: () => void;
  
  // Validation
  validateGame: (game: Game) => ValidationError[];
  validateGameShow: (show: GameShow) => ValidationError[];
  setValidationErrors: (errors: ValidationError[]) => void;
  clearValidationErrors: () => void;
}

const validateGridGame = (game: GridGame): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!game.name.trim()) {
    errors.push({ field: 'name', message: 'Game name is required', gameId: game.id });
  }
  
  for (let row = 0; row < game.rows; row++) {
    for (let col = 0; col < game.columns; col++) {
      const cell = game.cells[row]?.[col];
      if (!cell) continue;
      
      if (!cell.question.trim()) {
        errors.push({
          field: `cell-${row}-${col}-question`,
          message: `Question missing in Row ${row + 1}, Column ${col + 1}`,
          gameId: game.id,
        });
      }
      if (!cell.answer.trim()) {
        errors.push({
          field: `cell-${row}-${col}-answer`,
          message: `Answer missing in Row ${row + 1}, Column ${col + 1}`,
          gameId: game.id,
        });
      }
    }
  }
  
  return errors;
};

const validateSlidesGame = (game: SlidesGame): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!game.name.trim()) {
    errors.push({ field: 'name', message: 'Game name is required', gameId: game.id });
  }
  
  game.slides.forEach((slide, index) => {
    if (!slide.text.trim() && !slide.imageUrl) {
      errors.push({
        field: `slide-${index}-content`,
        message: `Slide ${index + 1} needs text or an image`,
        gameId: game.id,
      });
    }
  });
  
  return errors;
};

const validateWheelGame = (game: WheelGame): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!game.name.trim()) {
    errors.push({ field: 'name', message: 'Game name is required', gameId: game.id });
  }
  
  game.segments.forEach((segment, index) => {
    if (!segment.displayText.trim()) {
      errors.push({
        field: `segment-${index}-display`,
        message: `Segment ${index + 1} needs display text`,
        gameId: game.id,
      });
    }
    if (!segment.question.trim()) {
      errors.push({
        field: `segment-${index}-question`,
        message: `Segment ${index + 1} needs a question`,
        gameId: game.id,
      });
    }
    if (!segment.answer.trim()) {
      errors.push({
        field: `segment-${index}-answer`,
        message: `Segment ${index + 1} needs an answer`,
        gameId: game.id,
      });
    }
  });
  
  return errors;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      games: [],
      gameShows: [],
      currentSession: null,
      validationErrors: [],
      
      // Game CRUD
      addGame: (game) =>
        set((state) => ({ games: [...state.games, game] })),
      
      updateGame: (id, updatedGame) =>
        set((state) => ({
          games: state.games.map((g) =>
            g.id === id ? ({ ...g, ...updatedGame } as Game) : g
          ),
        })),
      
      deleteGame: (id) =>
        set((state) => ({
          games: state.games.filter((g) => g.id !== id),
        })),
      
      // Game Show CRUD
      addGameShow: (show) =>
        set((state) => ({ gameShows: [...state.gameShows, show] })),
      
      updateGameShow: (id, updatedShow) =>
        set((state) => ({
          gameShows: state.gameShows.map((s) =>
            s.id === id ? ({ ...s, ...updatedShow, updatedAt: new Date() } as GameShow) : s
          ),
        })),
      
      deleteGameShow: (id) =>
        set((state) => ({
          gameShows: state.gameShows.filter((s) => s.id !== id),
        })),
      
      addGameToShow: (showId, game) =>
        set((state) => ({
          gameShows: state.gameShows.map((s) =>
            s.id === showId
              ? { ...s, games: [...s.games, game], updatedAt: new Date() }
              : s
          ),
        })),
      
      removeGameFromShow: (showId, gameIndex) =>
        set((state) => ({
          gameShows: state.gameShows.map((s) =>
            s.id === showId
              ? { ...s, games: s.games.filter((_, i) => i !== gameIndex), updatedAt: new Date() }
              : s
          ),
        })),
      
      reorderGamesInShow: (showId, fromIndex, toIndex) =>
        set((state) => ({
          gameShows: state.gameShows.map((s) => {
            if (s.id !== showId) return s;
            const newGames = [...s.games];
            const [removed] = newGames.splice(fromIndex, 1);
            newGames.splice(toIndex, 0, removed);
            return { ...s, games: newGames, updatedAt: new Date() };
          }),
        })),
      
      // Session Management
      createSession: (gameShow, hostName) => {
        const host: Player = {
          id: generateId(),
          name: hostName,
          isHost: true,
          isFake: false,
          points: 0,
          isReady: true,
        };
        const session: GameSession = {
          id: generateId(),
          code: generateGameCode(),
          gameShow,
          currentGameIndex: 0,
          players: [host],
          hostId: host.id,
          status: 'lobby',
        };
        set({ currentSession: session });
        return session;
      },
      
      addFakePlayer: (name) => {
        const { currentSession } = get();
        if (!currentSession) return;
        if (currentSession.players.length >= 5) return; // 1 host + 4 players max
        
        const fakePlayer: Player = {
          id: generateId(),
          name,
          isHost: false,
          isFake: true,
          points: 0,
          isReady: true,
        };
        
        set({
          currentSession: {
            ...currentSession,
            players: [...currentSession.players, fakePlayer],
          },
        });
      },
      
      removeFakePlayer: (playerId) => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        set({
          currentSession: {
            ...currentSession,
            players: currentSession.players.filter((p) => p.id !== playerId),
          },
        });
      },
      
      updatePlayerPoints: (playerId, delta) => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        set({
          currentSession: {
            ...currentSession,
            players: currentSession.players.map((p) =>
              p.id === playerId ? { ...p, points: p.points + delta } : p
            ),
          },
        });
      },
      
      setPlayerReady: (playerId, ready) => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        set({
          currentSession: {
            ...currentSession,
            players: currentSession.players.map((p) =>
              p.id === playerId ? { ...p, isReady: ready } : p
            ),
          },
        });
      },
      
      advanceToNextGame: () => {
        const { currentSession } = get();
        if (!currentSession) return;
        
        const nextIndex = currentSession.currentGameIndex + 1;
        if (nextIndex >= currentSession.gameShow.games.length) {
          set({
            currentSession: { ...currentSession, status: 'ended' },
          });
        } else {
          set({
            currentSession: { ...currentSession, currentGameIndex: nextIndex },
          });
        }
      },
      
      endSession: () => set({ currentSession: null }),
      
      // Validation
      validateGame: (game) => {
        let errors: ValidationError[] = [];
        
        switch (game.type) {
          case 'grid':
            errors = validateGridGame(game as GridGame);
            break;
          case 'slides':
            errors = validateSlidesGame(game as SlidesGame);
            break;
          case 'wheel':
            errors = validateWheelGame(game as WheelGame);
            break;
        }
        
        set({ validationErrors: errors });
        return errors;
      },
      
      validateGameShow: (show) => {
        const errors: ValidationError[] = [];
        
        if (!show.name.trim()) {
          errors.push({ field: 'name', message: 'Game show name is required' });
        }
        
        if (show.games.length === 0) {
          errors.push({ field: 'games', message: 'Add at least one game to the show' });
        }
        
        // Validate each game
        show.games.forEach((game) => {
          const gameErrors = get().validateGame(game);
          errors.push(...gameErrors);
        });
        
        set({ validationErrors: errors });
        return errors;
      },
      
      setValidationErrors: (errors) => set({ validationErrors: errors }),
      clearValidationErrors: () => set({ validationErrors: [] }),
    }),
    {
      name: 'game-show-maker-storage',
    }
  )
);
