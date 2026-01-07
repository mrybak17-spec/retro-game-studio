import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game, GridGame, SlidesGame, WheelGame, ValidationError } from '@/types/game';

interface GameStore {
  games: Game[];
  currentGame: Game | null;
  validationErrors: ValidationError[];
  
  // Game CRUD
  addGame: (game: Game) => void;
  updateGame: (id: string, game: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  setCurrentGame: (game: Game | null) => void;
  
  // Validation
  validateGame: (game: Game) => ValidationError[];
  setValidationErrors: (errors: ValidationError[]) => void;
  clearValidationErrors: () => void;
}

const validateGridGame = (game: GridGame): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!game.name.trim()) {
    errors.push({ field: 'name', message: 'Game name is required' });
  }
  
  for (let row = 0; row < game.rows; row++) {
    for (let col = 0; col < game.columns; col++) {
      const cell = game.cells[row]?.[col];
      if (!cell) continue;
      
      if (!cell.question.trim()) {
        errors.push({
          field: `cell-${row}-${col}-question`,
          message: `Question missing in Row ${row + 1}, Column ${col + 1}`,
        });
      }
      if (!cell.answer.trim()) {
        errors.push({
          field: `cell-${row}-${col}-answer`,
          message: `Answer missing in Row ${row + 1}, Column ${col + 1}`,
        });
      }
    }
  }
  
  return errors;
};

const validateSlidesGame = (game: SlidesGame): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!game.name.trim()) {
    errors.push({ field: 'name', message: 'Game name is required' });
  }
  
  game.slides.forEach((slide, index) => {
    if (!slide.text.trim() && !slide.imageUrl) {
      errors.push({
        field: `slide-${index}-content`,
        message: `Slide ${index + 1} needs text or an image`,
      });
    }
  });
  
  return errors;
};

const validateWheelGame = (game: WheelGame): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!game.name.trim()) {
    errors.push({ field: 'name', message: 'Game name is required' });
  }
  
  game.segments.forEach((segment, index) => {
    if (!segment.displayText.trim()) {
      errors.push({
        field: `segment-${index}-display`,
        message: `Segment ${index + 1} needs display text`,
      });
    }
    if (!segment.question.trim()) {
      errors.push({
        field: `segment-${index}-question`,
        message: `Segment ${index + 1} needs a question`,
      });
    }
    if (!segment.answer.trim()) {
      errors.push({
        field: `segment-${index}-answer`,
        message: `Segment ${index + 1} needs an answer`,
      });
    }
  });
  
  return errors;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      games: [],
      currentGame: null,
      validationErrors: [],
      
      addGame: (game) =>
        set((state) => ({ games: [...state.games, game] })),
      
      updateGame: (id, updatedGame) =>
        set((state) => ({
          games: state.games.map((g) =>
            g.id === id ? ({ ...g, ...updatedGame } as Game) : g
          ),
          currentGame:
            state.currentGame?.id === id
              ? ({ ...state.currentGame, ...updatedGame } as Game)
              : state.currentGame,
        })),
      
      deleteGame: (id) =>
        set((state) => ({
          games: state.games.filter((g) => g.id !== id),
          currentGame: state.currentGame?.id === id ? null : state.currentGame,
        })),
      
      setCurrentGame: (game) => set({ currentGame: game }),
      
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
      
      setValidationErrors: (errors) => set({ validationErrors: errors }),
      clearValidationErrors: () => set({ validationErrors: [] }),
    }),
    {
      name: 'game-show-maker-storage',
    }
  )
);
