import React, { useState } from 'react';
import { Window, Button, GroupBox, Input } from '@/components/win95';
import { useGameStore } from '@/store/gameStore';
import { GameShow } from '@/types/game';
import { UserPlus, Trash2, Play, Copy } from 'lucide-react';

interface GameLobbyProps {
  gameShow: GameShow;
  onClose: () => void;
  onStartGame: () => void;
}

const FAKE_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery'];

export const GameLobby: React.FC<GameLobbyProps> = ({ gameShow, onClose, onStartGame }) => {
  const { currentSession, createSession, addFakePlayer, removeFakePlayer, endSession } = useGameStore();
  const [hostName, setHostName] = useState('Host');
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleCreateSession = () => {
    createSession(gameShow, hostName);
  };

  const handleAddFakePlayer = () => {
    const name = newPlayerName.trim() || FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
    addFakePlayer(name);
    setNewPlayerName('');
  };

  const handleClose = () => {
    endSession();
    onClose();
  };

  const copyCode = () => {
    if (currentSession?.code) {
      navigator.clipboard.writeText(currentSession.code);
    }
  };

  if (!currentSession) {
    return (
      <Window title="Start Game Show" onClose={handleClose} width={350} height={200} initialPosition={{ x: 200, y: 150 }}>
        <div className="p-4 flex flex-col gap-4">
          <p className="text-xs">Starting: <strong>{gameShow.name}</strong> ({gameShow.games.length} games)</p>
          <Input
            label="Your Name (Host)"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={handleCreateSession}>Create Lobby</Button>
            <Button onClick={handleClose}>Cancel</Button>
          </div>
        </div>
      </Window>
    );
  }

  const nonHostPlayers = currentSession.players.filter(p => !p.isHost);
  const canStart = nonHostPlayers.length >= 1;

  return (
    <Window
      title={`Game Lobby - ${currentSession.code}`}
      onClose={handleClose}
      width={650}
      height={550}
      resizable
      initialPosition={{ x: 343, y: 168 }}
    >
      <div className="p-2 flex flex-col gap-2 h-full">
        <GroupBox label="Game Code">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-pixel tracking-wider">{currentSession.code}</span>
            <Button onClick={copyCode} className="text-xs">
              <Copy className="w-3 h-3" />
            </Button>
            <span className="text-xs text-muted-foreground">(Share this code with players)</span>
          </div>
        </GroupBox>

        <GroupBox label="Players" className="flex-1">
          <div className="h-32 overflow-y-auto win95-inset mb-2">
            {currentSession.players.map((player) => (
              <div key={player.id} className="flex items-center gap-2 p-1 text-xs border-b border-window-border-dark">
                <span className={player.isHost ? 'font-bold' : ''}>{player.name}</span>
                {player.isHost && <span className="text-muted-foreground">(Host)</span>}
                {player.isFake && <span className="text-muted-foreground">(Test)</span>}
                <span className="flex-1" />
                <span>{player.points} pts</span>
                {player.isFake && (
                  <button className="win95-button p-0.5" onClick={() => removeFakePlayer(player.id)}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-1">
            <input
              className="win95-input flex-1 text-xs"
              placeholder="Player name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFakePlayer()}
            />
            <Button onClick={handleAddFakePlayer} disabled={currentSession.players.length >= 5}>
              <UserPlus className="w-3 h-3 mr-1" />
              Add Test Player
            </Button>
          </div>
        </GroupBox>

        <div className="text-xs text-muted-foreground">
          {canStart ? '✓ Ready to start!' : 'Need at least 1 player to start'}
        </div>

        <div className="flex gap-1 justify-end">
          <Button onClick={onStartGame} disabled={!canStart}>
            <Play className="w-3 h-3 mr-1" />
            Start Game
          </Button>
          <Button onClick={handleClose}>Cancel</Button>
        </div>
      </div>
    </Window>
  );
};