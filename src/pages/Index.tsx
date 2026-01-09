import React, { useState } from 'react';
import { DesktopIcon, Taskbar, StartMenu, Dialog } from '@/components/win95';
import {
  GameShowWizard,
  GamesLibrary,
  GameLobby,
  CharacterDrawing,
  GamePlayScreen,
} from '@/components/game';
import { useGameStore } from '@/store/gameStore';
import { Game, GameShow } from '@/types/game';
import { 
  FolderOpen, 
  FileText,
  HelpCircle,
  Tv
} from 'lucide-react';

type WindowType = 'newShow' | 'gamesLibrary' | 'lobby' | 'drawing' | 'playing' | null;

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
  const [pendingGameShow, setPendingGameShow] = useState<GameShow | null>(null);
  const [drawingPlayerIndex, setDrawingPlayerIndex] = useState(0);
  const [dialog, setDialog] = useState<DialogState>({
    show: false,
    title: '',
    message: '',
    type: 'info',
  });

  const { games, gameShows, addGameShow, currentSession, setPlayerReady } = useGameStore();

  const handleSaveGameShow = (show: GameShow) => {
    addGameShow(show);
    setActiveWindow(null);
    setDialog({
      show: true,
      title: 'Success',
      message: `Game Show "${show.name}" saved with ${show.games.length} games!`,
      type: 'info',
    });
  };

  const handlePlayShow = (show: GameShow) => {
    setPendingGameShow(show);
    setActiveWindow('lobby');
  };

  const handleStartGame = () => {
    setDrawingPlayerIndex(0);
    setActiveWindow('drawing');
  };

  const handleDrawingComplete = (drawing: string) => {
    if (!currentSession) return;
    const players = currentSession.players;
    
    // Update current player's drawing
    const player = players[drawingPlayerIndex];
    if (player) {
      player.drawing = drawing;
      setPlayerReady(player.id, true);
    }
    
    // Move to next player or start game
    if (drawingPlayerIndex < players.length - 1) {
      setDrawingPlayerIndex(drawingPlayerIndex + 1);
    } else {
      setActiveWindow('playing');
    }
  };

  const desktopIcons = [
    {
      icon: <Tv className="w-8 h-8 text-purple-400" />,
      label: 'New Game Show',
      onClick: () => setActiveWindow('newShow'),
    },
    {
      icon: <FolderOpen className="w-8 h-8 text-yellow-400" />,
      label: 'My Shows',
      onClick: () => setActiveWindow('gamesLibrary'),
    },
    {
      icon: <HelpCircle className="w-8 h-8 text-cyan-300" />,
      label: 'Help',
      onClick: () => setDialog({
        show: true,
        title: 'Game Show Maker Help',
        message: 'Welcome to Game Show Maker 95!\n\n• Click "New Game Show" to create a show\n• Add multiple games (Grid, Slides, Wheel)\n• Save and play with fake players for testing!',
        type: 'info',
      }),
    },
  ];

  const startMenuItems = [
    { id: 'new', icon: <Tv className="w-6 h-6" />, label: 'New Game Show', onClick: () => setActiveWindow('newShow') },
    { id: 'shows', icon: <FolderOpen className="w-6 h-6" />, label: 'My Shows', onClick: () => setActiveWindow('gamesLibrary') },
  ];

  const taskbarItems = activeWindow
    ? [{ id: activeWindow, title: activeWindow === 'newShow' ? 'New Game Show' : 'My Shows', active: true, onClick: () => {} }]
    : [];

  return (
    <div className="min-h-screen bg-background relative pb-7 overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.1) 2px,rgba(0,0,0,0.1) 4px)` }} />

      <div className="p-4 grid grid-cols-1 gap-1 content-start h-[calc(100vh-28px)]">
        {desktopIcons.map((icon, index) => (
          <DesktopIcon key={index} icon={icon.icon} label={icon.label} onDoubleClick={icon.onClick} />
        ))}
      </div>

      {activeWindow === 'newShow' && (
        <GameShowWizard onSave={handleSaveGameShow} onClose={() => setActiveWindow(null)} />
      )}

      {activeWindow === 'gamesLibrary' && (
        <GamesLibrary
          games={games}
          onEdit={() => {}}
          onPlay={(game) => handlePlayShow({ id: 'quick', name: game.name, description: '', games: [game], createdAt: new Date(), updatedAt: new Date() })}
          onDelete={() => {}}
          onClose={() => setActiveWindow(null)}
        />
      )}

      {activeWindow === 'lobby' && pendingGameShow && (
        <GameLobby gameShow={pendingGameShow} onClose={() => setActiveWindow(null)} onStartGame={handleStartGame} />
      )}

      {activeWindow === 'drawing' && currentSession && (
        <CharacterDrawing
          playerName={currentSession.players[drawingPlayerIndex]?.name || 'Player'}
          onComplete={handleDrawingComplete}
          onClose={() => setActiveWindow('lobby')}
        />
      )}

      {activeWindow === 'playing' && <GamePlayScreen onClose={() => setActiveWindow(null)} />}

      {dialog.show && (
        <Dialog
          title={dialog.title}
          message={dialog.message}
          type={dialog.type}
          onClose={() => setDialog({ ...dialog, show: false })}
          buttons={dialog.type === 'question' ? [{ label: 'No', onClick: () => {} }, { label: 'Yes', onClick: () => dialog.onConfirm?.(), primary: true }] : [{ label: 'OK', onClick: () => {}, primary: true }]}
        />
      )}

      {startMenuOpen && <StartMenu items={startMenuItems} onClose={() => setStartMenuOpen(false)} />}
      <Taskbar items={taskbarItems} onStartClick={() => setStartMenuOpen(!startMenuOpen)} startMenuOpen={startMenuOpen} />
    </div>
  );
};

export default Index;