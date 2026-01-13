import React, { useState, useCallback } from 'react';
import { DesktopIcon, Taskbar, StartMenu, Dialog } from '@/components/win95';
import {
  GridGameCreator,
  SlidesGameCreator,
  WheelGameCreator,
  GamesLibrary,
  NewGameWizard,
  GameLobby,
  GameShowPlayer,
} from '@/components/game';
import { useGameStore } from '@/store/gameStore';
import { Game, GameShow, GridGame, SlidesGame, WheelGame } from '@/types/game';
import { 
  Grid3X3, 
  Presentation, 
  CircleDot, 
  FolderOpen, 
  FileText,
  HelpCircle,
} from 'lucide-react';

type WindowType = 
  | 'newGameWizard'
  | 'gridCreator'
  | 'slidesCreator'
  | 'wheelCreator'
  | 'gamesLibrary'
  | 'gameLobby'
  | 'gamePlayer'
  | null;

interface DialogState {
  show: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'question';
  onConfirm?: () => void;
}

interface EditorState {
  type: 'grid' | 'slides' | 'wheel';
  game: Game | null;
  onComplete: (game: Game) => void;
  saveLabel: string;
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

  // For wizard flow - editing a game that will be added to the wizard
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  
  // For lobby
  const [pendingGameShow, setPendingGameShow] = useState<GameShow | null>(null);

  const { 
    games, 
    gameShows,
    addGame, 
    updateGame, 
    deleteGame, 
    addGameShow,
    updateGameShow,
    validateGame,
    currentSession,
    createSession,
  } = useGameStore();

  // Handle opening a game editor from the wizard
  const handleEditGameFromWizard = useCallback((
    type: 'grid' | 'slides' | 'wheel',
    game: Game | null,
    onComplete: (game: Game) => void
  ) => {
    setEditorState({
      type,
      game,
      onComplete,
      saveLabel: game ? 'Update' : 'Add',
    });
    
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
    }
  }, []);

  // Handle saving a game from the editor
  const handleSaveFromEditor = useCallback((game: Game) => {
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

    if (editorState) {
      // Coming from wizard flow - call the completion callback
      editorState.onComplete(game);
      setEditorState(null);
      setActiveWindow('newGameWizard');
    } else {
      // Direct save (standalone mode or from games library)
      addGame(game);
      setActiveWindow(null);
      setDialog({
        show: true,
        title: 'Success',
        message: `Game "${game.name}" has been saved!`,
        type: 'info',
      });
    }
  }, [editorState, validateGame, addGame]);

  // Handle closing an editor
  const handleCloseEditor = useCallback(() => {
    if (editorState) {
      // Return to wizard without saving
      setEditorState(null);
      setActiveWindow('newGameWizard');
    } else {
      setActiveWindow(null);
    }
  }, [editorState]);

  // Handle saving a game show
  const handleSaveGameShow = useCallback((show: GameShow) => {
    const existing = gameShows.find(s => s.id === show.id);
    if (existing) {
      updateGameShow(show.id, show);
    } else {
      addGameShow(show);
    }
    
    setActiveWindow(null);
    setDialog({
      show: true,
      title: 'Success',
      message: `Game Show "${show.name}" has been saved!`,
      type: 'info',
    });
  }, [gameShows, addGameShow, updateGameShow]);

  // Handle playing a game show
  const handlePlayGameShow = useCallback((show: GameShow) => {
    setPendingGameShow(show);
    setActiveWindow('gameLobby');
  }, []);

  // Handle starting the game from lobby
  const handleStartGame = useCallback(() => {
    setActiveWindow('gamePlayer');
  }, []);

  // Handle playing a single game (wrap it in a show)
  const handlePlaySingleGame = useCallback((game: Game) => {
    const tempShow: GameShow = {
      id: 'temp-' + Date.now(),
      name: game.name,
      description: '',
      games: [game],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    handlePlayGameShow(tempShow);
  }, [handlePlayGameShow]);

  // Handle editing an existing game from library
  const handleEditGameFromLibrary = useCallback((game: Game) => {
    setEditorState({
      type: game.type,
      game,
      onComplete: (updatedGame) => {
        updateGame(game.id, updatedGame);
        setDialog({
          show: true,
          title: 'Success',
          message: `Game "${updatedGame.name}" has been updated!`,
          type: 'info',
        });
      },
      saveLabel: 'Save',
    });
    
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
    }
  }, [updateGame]);

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

  const desktopIcons = [
    {
      icon: <FileText className="w-8 h-8 text-yellow-300" />,
      label: 'New Game Show',
      onClick: () => setActiveWindow('newGameWizard'),
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
      onClick: () => setActiveWindow('newGameWizard'),
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
              : activeWindow === 'gamesLibrary'
              ? 'My Games'
              : activeWindow === 'gameLobby'
              ? 'Game Lobby'
              : activeWindow === 'gamePlayer'
              ? 'Playing...'
              : 'Window',
          active: true,
          onClick: () => {},
        },
      ]
    : [];

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
          onEditGame={handleEditGameFromWizard}
          onSaveShow={handleSaveGameShow}
          onPlayShow={handlePlayGameShow}
          onClose={() => setActiveWindow(null)}
        />
      )}

      {activeWindow === 'gridCreator' && (
        <GridGameCreator
          game={editorState?.type === 'grid' && editorState.game ? editorState.game as GridGame : undefined}
          onSave={handleSaveFromEditor}
          onClose={handleCloseEditor}
          saveLabel={editorState?.saveLabel}
        />
      )}

      {activeWindow === 'slidesCreator' && (
        <SlidesGameCreator
          game={editorState?.type === 'slides' && editorState.game ? editorState.game as SlidesGame : undefined}
          onSave={handleSaveFromEditor}
          onClose={handleCloseEditor}
          saveLabel={editorState?.saveLabel}
        />
      )}

      {activeWindow === 'wheelCreator' && (
        <WheelGameCreator
          game={editorState?.type === 'wheel' && editorState.game ? editorState.game as WheelGame : undefined}
          onSave={handleSaveFromEditor}
          onClose={handleCloseEditor}
          saveLabel={editorState?.saveLabel}
        />
      )}

      {activeWindow === 'gamesLibrary' && (
        <GamesLibrary
          games={games}
          onEdit={handleEditGameFromLibrary}
          onPlay={handlePlaySingleGame}
          onDelete={handleDeleteGame}
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
