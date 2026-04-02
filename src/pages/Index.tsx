import React, { useState, useCallback, useEffect } from 'react';
import { DesktopIcon, Taskbar, StartMenu, Dialog } from '@/components/win95';
import {
  GridGameCreator,
  SlidesGameCreator,
  WheelGameCreator,
  BoardGameCreator,
  GamesLibrary,
  NewGameWizard,
  GameLobby,
  GameShowPlayer,
  CharacterDrawing,
} from '@/components/game';
import { useGameStore } from '@/store/gameStore';
import { Game, GameShow, GridGame, SlidesGame, WheelGame, BoardGame } from '@/types/game';
import { 
  FolderOpen, 
  FileText,
  HelpCircle,
} from 'lucide-react';

type WindowType = 
  | 'newGameWizard'
  | 'gridCreator'
  | 'slidesCreator'
  | 'wheelCreator'
  | 'boardCreator'
  | 'gamesLibrary'
  | 'gameLobby'
  | 'characterDrawing'
  | 'gamePlayer'
  | null;

interface DialogState {
  show: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'question';
  onConfirm?: () => void;
}

interface WizardState {
  showName: string;
  games: Game[];
  editingIndex: number | null; // null = adding new, number = editing existing
}

const Index = () => {
  const [activeWindow, setActiveWindow] = useState<WindowType>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    show: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Wizard state - persists when switching between wizard and editors
  const [wizardState, setWizardState] = useState<WizardState>({
    showName: 'My Game Show',
    games: [],
    editingIndex: null,
  });
  
  // Track if we're in wizard flow or standalone edit
  const [isWizardFlow, setIsWizardFlow] = useState(false);
  
  // For editing from library
  const [libraryEditGame, setLibraryEditGame] = useState<Game | null>(null);
  
  // For lobby
  const [pendingGameShow, setPendingGameShow] = useState<GameShow | null>(null);
  const [editingShowId, setEditingShowId] = useState<string | null>(null);

  const { 
    games, 
    gameShows,
    addGame, 
    updateGame, 
    deleteGame, 
    addGameShow,
    updateGameShow,
    validateGame,
    validateGameShow,
    currentSession,
    loadGameShowsFromCloud,
    deleteGameShow,
  } = useGameStore();

  // Load game shows from cloud on mount
  useEffect(() => {
    loadGameShowsFromCloud();
  }, [loadGameShowsFromCloud]);

  // Reset wizard state
  const resetWizardState = () => {
    setWizardState({
      showName: 'My Game Show',
      games: [],
      editingIndex: null,
    });
    setEditingShowId(null);
  };

  // Handle opening a game editor from the wizard
  const handleEditGameFromWizard = useCallback((
    type: 'grid' | 'slides' | 'wheel' | 'board',
    gameIndex: number | null
  ) => {
    setWizardState(prev => ({ ...prev, editingIndex: gameIndex }));
    setIsWizardFlow(true);
    
    switch (type) {
      case 'grid':
        setActiveWindow('gridCreator');
        break;
      case 'slides':
        setActiveWindow('slidesCreator');
        break;
      case 'wheel':
        setActiveWindow('wheelCreator');
        break;
      case 'board':
        setActiveWindow('boardCreator');
        break;
    }
  }, []);

  // Handle adding/updating a game from editor (wizard flow)
  const handleSaveFromWizardEditor = useCallback((game: Game) => {
    const errors = validateGame(game);
    
    if (errors.length > 0) {
      setDialog({
        show: true,
        title: 'Validation Error',
        message: `Please fix the following:\n\n${errors.slice(0, 3).map(e => `• ${e.message}`).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''}`,
        type: 'warning',
      });
      return;
    }

    setWizardState(prev => {
      if (prev.editingIndex !== null) {
        // Update existing game
        const newGames = [...prev.games];
        newGames[prev.editingIndex] = game;
        return { ...prev, games: newGames, editingIndex: null };
      } else {
        // Add new game
        return { ...prev, games: [...prev.games, game], editingIndex: null };
      }
    });
    
    setIsWizardFlow(false);
    setActiveWindow('newGameWizard');
  }, [validateGame]);

  // Handle closing editor in wizard flow
  const handleCloseWizardEditor = useCallback(() => {
    setWizardState(prev => ({ ...prev, editingIndex: null }));
    setIsWizardFlow(false);
    setActiveWindow('newGameWizard');
  }, []);

  // Handle saving from library edit
  const handleSaveFromLibraryEditor = useCallback((game: Game) => {
    const errors = validateGame(game);
    
    if (errors.length > 0) {
      setDialog({
        show: true,
        title: 'Validation Error',
        message: `Please fix the following:\n\n${errors.slice(0, 3).map(e => `• ${e.message}`).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''}`,
        type: 'warning',
      });
      return;
    }

    if (libraryEditGame) {
      updateGame(libraryEditGame.id, game);
      setDialog({
        show: true,
        title: 'Success',
        message: `Game "${game.name}" has been updated!`,
        type: 'info',
      });
    } else {
      addGame(game);
      setDialog({
        show: true,
        title: 'Success',
        message: `Game "${game.name}" has been saved!`,
        type: 'info',
      });
    }
    
    setLibraryEditGame(null);
    setActiveWindow(null);
  }, [libraryEditGame, validateGame, updateGame, addGame]);

  // Handle closing library editor
  const handleCloseLibraryEditor = useCallback(() => {
    setLibraryEditGame(null);
    setActiveWindow(null);
  }, []);

  // Handle wizard state updates from wizard component
  const handleWizardStateUpdate = useCallback((updates: Partial<WizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle saving a game show
  const handleSaveGameShow = useCallback(() => {
    const show: GameShow = {
      id: editingShowId || crypto.randomUUID(),
      name: wizardState.showName,
      description: '',
      games: wizardState.games,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const errors = validateGameShow(show);
    if (errors.length > 0) {
      setDialog({
        show: true,
        title: 'Validation Error',
        message: `Please fix the following:\n\n${errors.slice(0, 3).map(e => `• ${e.message}`).join('\n')}`,
        type: 'warning',
      });
      return;
    }

    if (editingShowId) {
      updateGameShow(editingShowId, show);
    } else {
      addGameShow(show);
    }
    resetWizardState();
    setActiveWindow(null);
    setDialog({
      show: true,
      title: 'Success',
      message: `Game Show "${show.name}" has been ${editingShowId ? 'updated' : 'saved'}!`,
      type: 'info',
    });
  }, [wizardState, editingShowId, validateGameShow, addGameShow, updateGameShow]);

  // Handle playing a game show from wizard
  const handlePlayGameShowFromWizard = useCallback(() => {
    if (wizardState.games.length === 0) {
      setDialog({
        show: true,
        title: 'No Games',
        message: 'Add at least one game to play!',
        type: 'warning',
      });
      return;
    }

    const show: GameShow = {
      id: crypto.randomUUID(),
      name: wizardState.showName,
      description: '',
      games: wizardState.games,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setPendingGameShow(show);
    setActiveWindow('gameLobby');
  }, [wizardState]);

  // Handle starting the game from lobby - go to drawing phase first
  const handleStartGame = useCallback(() => {
    // Update session status to drawing
    const { currentSession } = useGameStore.getState();
    if (currentSession) {
      useGameStore.setState({
        currentSession: { ...currentSession, status: 'drawing' },
      });
    }
    setActiveWindow('characterDrawing');
  }, []);

  // Handle playing a single game (wrap it in a show)
  const handlePlaySingleGame = useCallback((game: Game) => {
    const tempShow: GameShow = {
      id: crypto.randomUUID(),
      name: game.name,
      description: '',
      games: [game],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPendingGameShow(tempShow);
    setActiveWindow('gameLobby');
  }, []);

  // Handle editing an existing game from library
  const handleEditGameFromLibrary = useCallback((game: Game) => {
    setLibraryEditGame(game);
    setIsWizardFlow(false);
    
    switch (game.type) {
      case 'grid':
        setActiveWindow('gridCreator');
        break;
      case 'slides':
        setActiveWindow('slidesCreator');
        break;
      case 'wheel':
        setActiveWindow('wheelCreator');
        break;
      case 'board':
        setActiveWindow('boardCreator');
        break;
    }
  }, []);

  const handleDeleteGame = (id: string) => {
    const game = games.find(g => g.id === id);
    setDialog({
      show: true,
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${game?.name}"?`,
      type: 'question',
      onConfirm: () => deleteGame(id),
    });
  };

  const handleDeleteGameShow = (id: string) => {
    const show = gameShows.find(s => s.id === id);
    setDialog({
      show: true,
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${show?.name}"?`,
      type: 'question',
      onConfirm: () => useGameStore.getState().deleteGameShow(id),
    });
  };

  const handlePlayGameShow = (show: GameShow) => {
    setPendingGameShow(show);
    setActiveWindow('gameLobby');
  };

  const handleEditGameShow = useCallback((show: GameShow) => {
    setWizardState({
      showName: show.name,
      games: [...show.games],
      editingIndex: null,
    });
    setIsWizardFlow(false);
    // Store the show id so we can update instead of creating new
    setEditingShowId(show.id);
    setActiveWindow('newGameWizard');
  }, []);

  // Get current game being edited (for editors)
  const getCurrentEditGame = (): Game | undefined => {
    if (isWizardFlow && wizardState.editingIndex !== null) {
      return wizardState.games[wizardState.editingIndex];
    }
    if (libraryEditGame) {
      return libraryEditGame;
    }
    return undefined;
  };

  const getSaveLabel = (): string => {
    if (isWizardFlow) {
      return wizardState.editingIndex !== null ? 'Update' : 'Add';
    }
    return 'Save';
  };

  const handleEditorSave = isWizardFlow ? handleSaveFromWizardEditor : handleSaveFromLibraryEditor;
  const handleEditorClose = isWizardFlow ? handleCloseWizardEditor : handleCloseLibraryEditor;

  const desktopIcons = [
    {
      icon: <FileText className="w-8 h-8 text-yellow-300" />,
      label: 'New Game Show',
      onClick: () => {
        resetWizardState();
        setActiveWindow('newGameWizard');
      },
    },
    {
      icon: <FolderOpen className="w-8 h-8 text-yellow-400" />,
      label: 'My Games',
      onClick: () => setActiveWindow('gamesLibrary'),
    },
    {
      icon: <HelpCircle className="w-8 h-8 text-cyan-300" />,
      label: 'Help',
      onClick: () => setDialog({
        show: true,
        title: 'Game Show Maker Help',
        message: 'Welcome to Game Show Maker 95!\n\n• Create game shows with multiple challenges\n• Add Grid, Slides, or Wheel games\n• Play with test players offline\n\nDouble-click icons to open!',
        type: 'info',
      }),
    },
  ];

  const startMenuItems = [
    {
      id: 'new',
      icon: <FileText className="w-6 h-6" />,
      label: 'New Game Show',
      onClick: () => {
        resetWizardState();
        setActiveWindow('newGameWizard');
      },
    },
    {
      id: 'games',
      icon: <FolderOpen className="w-6 h-6" />,
      label: 'My Games',
      onClick: () => setActiveWindow('gamesLibrary'),
    },
  ];

  const taskbarItems = activeWindow
    ? [
        {
          id: activeWindow,
          title:
            activeWindow === 'newGameWizard'
              ? 'New Game Show'
              : activeWindow === 'gridCreator'
              ? 'Grid Game Creator'
              : activeWindow === 'slidesCreator'
              ? 'Slides Game Creator'
              : activeWindow === 'wheelCreator'
              ? 'Wheel Game Creator'
              : activeWindow === 'boardCreator'
              ? 'Board Game Creator'
              : activeWindow === 'gamesLibrary'
              ? 'My Games'
              : activeWindow === 'gameLobby'
              ? 'Game Lobby'
              : activeWindow === 'characterDrawing'
              ? 'Draw Your Character'
              : activeWindow === 'gamePlayer'
              ? 'Playing...'
              : 'Window',
          active: true,
          onClick: () => {},
        },
      ]
    : [];

  const currentEditGame = getCurrentEditGame();

  return (
    <div className="min-h-screen bg-background relative pb-7 overflow-hidden">
      {/* Desktop Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.1) 2px,
            rgba(0,0,0,0.1) 4px
          )`
        }}
      />

      {/* Desktop Icons */}
      <div className="p-4 grid grid-cols-1 gap-1 content-start h-[calc(100vh-28px)]">
        {desktopIcons.map((icon, index) => (
          <DesktopIcon
            key={index}
            icon={icon.icon}
            label={icon.label}
            onDoubleClick={icon.onClick}
          />
        ))}
      </div>

      {/* Windows */}
      {activeWindow === 'newGameWizard' && (
        <NewGameWizard
          showName={wizardState.showName}
          games={wizardState.games}
          onShowNameChange={(name) => handleWizardStateUpdate({ showName: name })}
          onGamesChange={(games) => handleWizardStateUpdate({ games })}
          onEditGame={handleEditGameFromWizard}
          onSaveShow={handleSaveGameShow}
          onPlayShow={handlePlayGameShowFromWizard}
          onClose={() => {
            resetWizardState();
            setActiveWindow(null);
          }}
        />
      )}

      {activeWindow === 'gridCreator' && (
        <GridGameCreator
          game={currentEditGame?.type === 'grid' ? currentEditGame as GridGame : undefined}
          onSave={handleEditorSave}
          onClose={handleEditorClose}
          saveLabel={getSaveLabel()}
        />
      )}

      {activeWindow === 'slidesCreator' && (
        <SlidesGameCreator
          game={currentEditGame?.type === 'slides' ? currentEditGame as SlidesGame : undefined}
          onSave={handleEditorSave}
          onClose={handleEditorClose}
          saveLabel={getSaveLabel()}
        />
      )}

      {activeWindow === 'wheelCreator' && (
        <WheelGameCreator
          game={currentEditGame?.type === 'wheel' ? currentEditGame as WheelGame : undefined}
          onSave={handleEditorSave}
          onClose={handleEditorClose}
          saveLabel={getSaveLabel()}
        />
      )}

      {activeWindow === 'boardCreator' && (
        <BoardGameCreator
          game={currentEditGame?.type === 'board' ? currentEditGame as BoardGame : undefined}
          onSave={handleEditorSave}
          onClose={handleEditorClose}
          saveLabel={getSaveLabel()}
        />
      )}

      {activeWindow === 'gamesLibrary' && (
        <GamesLibrary
          games={games}
          gameShows={gameShows}
          onEdit={handleEditGameFromLibrary}
          onEditShow={handleEditGameShow}
          onPlay={handlePlaySingleGame}
          onPlayShow={handlePlayGameShow}
          onDelete={handleDeleteGame}
          onDeleteShow={handleDeleteGameShow}
          onClose={() => setActiveWindow(null)}
        />
      )}

      {activeWindow === 'gameLobby' && pendingGameShow && (
        <GameLobby
          gameShow={pendingGameShow}
          onClose={() => {
            setPendingGameShow(null);
            setActiveWindow(null);
          }}
          onStartGame={handleStartGame}
        />
      )}

      {activeWindow === 'characterDrawing' && currentSession && (
        <CharacterDrawing
          onComplete={() => setActiveWindow('gamePlayer')}
          onClose={() => {
            setPendingGameShow(null);
            useGameStore.getState().endSession();
            setActiveWindow(null);
          }}
        />
      )}

      {activeWindow === 'gamePlayer' && currentSession && (
        <GameShowPlayer
          onClose={() => {
            setPendingGameShow(null);
            setActiveWindow(null);
          }}
        />
      )}

      {/* Dialog */}
      {dialog.show && (
        <Dialog
          title={dialog.title}
          message={dialog.message}
          type={dialog.type}
          onClose={() => setDialog({ ...dialog, show: false })}
          buttons={
            dialog.type === 'question'
              ? [
                  { label: 'No', onClick: () => {} },
                  {
                    label: 'Yes',
                    onClick: () => dialog.onConfirm?.(),
                    primary: true,
                  },
                ]
              : [{ label: 'OK', onClick: () => {}, primary: true }]
          }
        />
      )}

      {/* Start Menu */}
      {startMenuOpen && (
        <StartMenu
          items={startMenuItems}
          onClose={() => setStartMenuOpen(false)}
        />
      )}

      {/* Taskbar */}
      <Taskbar
        items={taskbarItems}
        onStartClick={() => setStartMenuOpen(!startMenuOpen)}
        startMenuOpen={startMenuOpen}
      />
    </div>
  );
};

export default Index;
