import React, { useState, useEffect } from 'react';
import { Window, Button, GroupBox, Input } from '@/components/win95';
import { useGameStore } from '@/store/gameStore';
import { GameShow } from '@/types/game';
import { UserPlus, Trash2, Play, Copy, Users } from 'lucide-react';
import {
  createMultiplayerSession,
  subscribeToSession,
  fetchSessionWithPlayers,
  updateSessionStatus,
  removePlayer,
  deleteSession,
  getLocalPlayerId,
} from '@/lib/multiplayerService';
import { supabase } from '@/integrations/supabase/client';

interface GameLobbyProps {
  gameShow: GameShow;
  onClose: () => void;
  onStartGame: (sessionId: string) => void;
}

const FAKE_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery'];

export const GameLobby: React.FC<GameLobbyProps> = ({ gameShow, onClose, onStartGame }) => {
  const { currentSession, createSession, addFakePlayer, removeFakePlayer, endSession } = useGameStore();
  const [hostName, setHostName] = useState('Host');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [dbPlayers, setDbPlayers] = useState<any[]>([]);
  const [creatingOnline, setCreatingOnline] = useState(false);

  // Subscribe to realtime player changes
  useEffect(() => {
    if (!dbSessionId) return;
    
    const loadPlayers = async () => {
      const data = await fetchSessionWithPlayers(dbSessionId);
      setDbPlayers(data.players || []);
    };
    loadPlayers();

    const channel = subscribeToSession(
      dbSessionId,
      () => {},
      () => loadPlayers()
    );

    return () => { supabase.removeChannel(channel); };
  }, [dbSessionId]);

  const handleCreateSession = async () => {
    // Create local session for game state
    const session = createSession(gameShow, hostName);
    
    // Also create online session for multiplayer
    setCreatingOnline(true);
    try {
      const { session: dbSession } = await createMultiplayerSession(gameShow, hostName);
      setDbSessionId(dbSession.id);
      
      // Update local session with the DB session code
      useGameStore.setState({
        currentSession: {
          ...session,
          id: dbSession.id,
          code: dbSession.code,
        },
      });
    } catch (err) {
      console.error('Failed to create online session:', err);
    } finally {
      setCreatingOnline(false);
    }
  };

  const handleAddFakePlayer = () => {
    const name = newPlayerName.trim() || FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
    addFakePlayer(name);
    setNewPlayerName('');
  };

  const handleClose = () => {
    if (dbSessionId) {
      deleteSession(dbSessionId).catch(console.error);
    }
    endSession();
    onClose();
  };

  const copyCode = () => {
    const code = currentSession?.code;
    if (code) navigator.clipboard.writeText(code);
  };

  if (!currentSession) {
    return (
      <Window title="Start Game Show" onClose={handleClose} width={450} height={280} initialPosition={{ x: 443, y: 303 }}>
        <div className="p-4 flex flex-col gap-4">
          <p className="text-xs">Starting: <strong>{gameShow.name}</strong> ({gameShow.games.length} games)</p>
          <Input
            label="Your Name (Host)"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={handleCreateSession} disabled={creatingOnline}>
              {creatingOnline ? 'Creating...' : 'Create Lobby'}
            </Button>
            <Button onClick={handleClose}>Cancel</Button>
          </div>
        </div>
      </Window>
    );
  }

  // Combine local fake players with online players (excluding host duplicates)
  const localFakePlayers = currentSession.players.filter(p => p.isFake);
  const onlinePlayers = dbPlayers.filter(p => !p.is_host);
  const allNonHostPlayers = [
    ...onlinePlayers.map(p => ({
      id: p.player_id,
      name: p.name,
      isHost: false,
      isFake: false,
      points: p.points,
      isReady: true,
      isOnline: true,
    })),
    ...localFakePlayers.map(p => ({ ...p, isOnline: false })),
  ];
  const canStart = allNonHostPlayers.length >= 1;

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
            <span className="text-xs text-muted-foreground">(Share this code with players to join)</span>
          </div>
        </GroupBox>

        <GroupBox label="Players" className="flex-1">
          <div className="h-32 overflow-y-auto win95-inset mb-2">
            {/* Host */}
            <div className="flex items-center gap-2 p-1 text-xs border-b border-window-border-dark">
              <span className="font-bold">{hostName}</span>
              <span className="text-muted-foreground">(Host)</span>
            </div>
            {/* Online players */}
            {onlinePlayers.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-1 text-xs border-b border-window-border-dark">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span>{p.name}</span>
                <span className="text-muted-foreground">(Online)</span>
                <span className="flex-1" />
                <button
                  className="win95-button p-0.5"
                  onClick={() => removePlayer(dbSessionId!, p.player_id).catch(console.error)}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {/* Local fake players */}
            {localFakePlayers.map(player => (
              <div key={player.id} className="flex items-center gap-2 p-1 text-xs border-b border-window-border-dark">
                <span>{player.name}</span>
                <span className="text-muted-foreground">(Test)</span>
                <span className="flex-1" />
                <button className="win95-button p-0.5" onClick={() => removeFakePlayer(player.id)}>
                  <Trash2 className="w-3 h-3" />
                </button>
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

        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" />
          {allNonHostPlayers.length} player(s) | {onlinePlayers.length} online | {localFakePlayers.length} test
          {canStart ? ' | ✓ Ready to start!' : ' | Need at least 1 player'}
        </div>

        <div className="flex gap-1 justify-end">
          <Button onClick={() => {
            // Merge online players into local session
            const { currentSession: sess } = useGameStore.getState();
            if (sess) {
              const mergedPlayers = [
                ...sess.players,
                ...onlinePlayers
                  .filter(op => !sess.players.some(lp => lp.id === op.player_id))
                  .map(op => ({
                    id: op.player_id,
                    name: op.name,
                    isHost: false,
                    isFake: false,
                    points: 0,
                    isReady: true,
                    drawing: op.drawing || undefined,
                  })),
              ];
              useGameStore.setState({
                currentSession: { ...sess, players: mergedPlayers },
              });
            }
            // Update DB session status
            if (dbSessionId) {
              updateSessionStatus(dbSessionId, 'drawing').catch(console.error);
            }
            onStartGame(dbSessionId || '');
          }} disabled={!canStart}>
            <Play className="w-3 h-3 mr-1" />
            Start Game
          </Button>
          <Button onClick={handleClose}>Cancel</Button>
        </div>
      </div>
    </Window>
  );
};
