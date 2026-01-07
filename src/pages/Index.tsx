import React, { useState } from 'react';
import { DesktopIcon, Taskbar, StartMenu, Dialog } from '@/components/win95';
import {
  GridGameCreator,
  SlidesGameCreator,
  WheelGameCreator,
  GamesLibrary,
  NewGameWizard,
} from '@/components/game';
import { useGameStore } from '@/store/gameStore';
import { Game, GridGame, SlidesGame, WheelGame } from '@/types/game';
import { 
  Grid3X3, 
  Presentation, 
  CircleDot, 
  FolderOpen, 
  FileText,
  HelpCircle,
  Play
} from 'lucide-react';

type WindowType = 
  | 'newGame'
  | 'gridCreator'
  | 'slidesCreator'
  | 'wheelCreator'
  | 'gamesLibrary'
  | null;

interface DialogState {
  show: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'question';
  onConfirm?: () => void;
}

const Index = () => {
  const [activeWindow, setActiveWindow] = useState<WindowType>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [dialog, setDialog] = useState<DialogState>({
    show: false,
    title: '',
    message: '',
    type: 'info',
  });

  const { games, addGame, updateGame, deleteGame, validateGame, validationErrors } = useGameStore();

  const handleNewGame = (type: 'grid' | 'slides' | 'wheel') => {
    setActiveWindow(null);
    setEditingGame(null);
    
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
  };

  const handleSaveGame = (game: Game) => {
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

    if (editingGame) {
      updateGame(game.id, game);
    } else {
      addGame(game);
    }
    
    setActiveWindow(null);
    setEditingGame(null);
    
    setDialog({
      show: true,
      title: 'Success',
      message: `Game "${game.name}" has been saved successfully!`,
      type: 'info',
    });
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    
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
  };

  const handleDeleteGame = (id: string) => {
    const game = games.find(g => g.id === id);
    setDialog({
      show: true,
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${game?.name}"? This action cannot be undone.`,
      type: 'question',
      onConfirm: () => deleteGame(id),
    });
  };

  const handlePlayGame = (game: Game) => {
    setDialog({
      show: true,
      title: 'Coming Soon!',
      message: 'Multiplayer game sessions require a backend connection. Enable Lovable Cloud to unlock real-time multiplayer with game codes, lobbies, and character drawing!',
      type: 'info',
    });
  };

  const desktopIcons = [
    {
      icon: <FileText className="w-8 h-8 text-yellow-300" />,
      label: 'New Game',
      onClick: () => setActiveWindow('newGame'),
    },
    {
      icon: <FolderOpen className="w-8 h-8 text-yellow-400" />,
      label: 'My Games',
      onClick: () => setActiveWindow('gamesLibrary'),
    },
    {
      icon: <Grid3X3 className="w-8 h-8 text-blue-400" />,
      label: 'Grid Game',
      onClick: () => handleNewGame('grid'),
    },
    {
      icon: <Presentation className="w-8 h-8 text-green-400" />,
      label: 'Slides Game',
      onClick: () => handleNewGame('slides'),
    },
    {
      icon: <CircleDot className="w-8 h-8 text-red-400" />,
      label: 'Wheel Game',
      onClick: () => handleNewGame('wheel'),
    },
    {
      icon: <HelpCircle className="w-8 h-8 text-cyan-300" />,
      label: 'Help',
      onClick: () => setDialog({
        show: true,
        title: 'Game Show Maker Help',
        message: 'Welcome to Game Show Maker 95!\n\n• Create games using the desktop icons\n• Save your games to access them later\n• Enable multiplayer with Lovable Cloud\n\nDouble-click icons to open!',
        type: 'info',
      }),
    },
  ];

  const startMenuItems = [
    {
      id: 'new',
      icon: <FileText className="w-6 h-6" />,
      label: 'New Game',
      onClick: () => setActiveWindow('newGame'),
    },
    {
      id: 'games',
      icon: <FolderOpen className="w-6 h-6" />,
      label: 'My Games',
      onClick: () => setActiveWindow('gamesLibrary'),
    },
    {
      id: 'grid',
      icon: <Grid3X3 className="w-6 h-6" />,
      label: 'Grid Game',
      onClick: () => handleNewGame('grid'),
    },
    {
      id: 'slides',
      icon: <Presentation className="w-6 h-6" />,
      label: 'Slides Game',
      onClick: () => handleNewGame('slides'),
    },
    {
      id: 'wheel',
      icon: <CircleDot className="w-6 h-6" />,
      label: 'Wheel Game',
      onClick: () => handleNewGame('wheel'),
    },
  ];

  const taskbarItems = activeWindow
    ? [
        {
          id: activeWindow,
          title:
            activeWindow === 'newGame'
              ? 'New Game Wizard'
              : activeWindow === 'gridCreator'
              ? 'Grid Game Creator'
              : activeWindow === 'slidesCreator'
              ? 'Slides Game Creator'
              : activeWindow === 'wheelCreator'
              ? 'Wheel Game Creator'
              : 'My Games',
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
      {activeWindow === 'newGame' && (
        <NewGameWizard
          onSelectType={handleNewGame}
          onClose={() => setActiveWindow(null)}
        />
      )}

      {activeWindow === 'gridCreator' && (
        <GridGameCreator
          game={editingGame?.type === 'grid' ? editingGame as GridGame : undefined}
          onSave={handleSaveGame}
          onClose={() => {
            setActiveWindow(null);
            setEditingGame(null);
          }}
        />
      )}

      {activeWindow === 'slidesCreator' && (
        <SlidesGameCreator
          game={editingGame?.type === 'slides' ? editingGame as SlidesGame : undefined}
          onSave={handleSaveGame}
          onClose={() => {
            setActiveWindow(null);
            setEditingGame(null);
          }}
        />
      )}

      {activeWindow === 'wheelCreator' && (
        <WheelGameCreator
          game={editingGame?.type === 'wheel' ? editingGame as WheelGame : undefined}
          onSave={handleSaveGame}
          onClose={() => {
            setActiveWindow(null);
            setEditingGame(null);
          }}
        />
      )}

      {activeWindow === 'gamesLibrary' && (
        <GamesLibrary
          games={games}
          onEdit={handleEditGame}
          onPlay={handlePlayGame}
          onDelete={handleDeleteGame}
          onClose={() => setActiveWindow(null)}
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
