import React, { useState, useEffect } from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { useGameStore } from '@/store/gameStore';
import { Check, Users, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fetchSessionWithPlayers, updateSessionStatus } from '@/lib/multiplayerService';

interface CharacterDrawingProps {
  sessionId?: string | null;
  onComplete: () => void;
  onClose: () => void;
}

export const CharacterDrawing: React.FC<CharacterDrawingProps> = ({ sessionId, onComplete, onClose }) => {
  const { currentSession } = useGameStore();
  const [players, setPlayers] = useState<any[]>([]);

  // Poll players from DB to see drawing status
  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      const data = await fetchSessionWithPlayers(sessionId);
      setPlayers(data.players || []);
      
      // Merge drawings into local session
      const { currentSession: sess } = useGameStore.getState();
      if (sess && data.players) {
        const updatedPlayers = sess.players.map(lp => {
          const dbPlayer = data.players.find((dp: any) => dp.player_id === lp.id);
          if (dbPlayer?.drawing) {
            return { ...lp, drawing: dbPlayer.drawing };
          }
          return lp;
        });
        useGameStore.setState({
          currentSession: { ...sess, players: updatedPlayers },
        });
      }
    };
    load();

    const channel = supabase
      .channel(`drawing-watch-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${sessionId}` },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  if (!currentSession) return null;

  const nonHostPlayers = players.filter((p: any) => !p.is_host);
  const playersWithDrawing = nonHostPlayers.filter((p: any) => p.drawing);
  const allReady = nonHostPlayers.length > 0 && playersWithDrawing.length === nonHostPlayers.length;

  const handleStartPlaying = async () => {
    if (sessionId) {
      await updateSessionStatus(sessionId, 'playing');
    }
    const { currentSession: sess } = useGameStore.getState();
    if (sess) {
      useGameStore.setState({
        currentSession: { ...sess, status: 'playing' },
      });
    }
    onComplete();
  };

  return (
    <Window
      title="Waiting for Players to Draw"
      onClose={onClose}
      width={500}
      height={400}
      initialPosition={{ x: 418, y: 243 }}
    >
      <div className="p-4 flex flex-col gap-3 h-full">
        <div className="text-sm text-center font-bold">
          Players are drawing their characters...
        </div>
        <div className="text-xs text-center text-muted-foreground">
          {playersWithDrawing.length} / {nonHostPlayers.length} players ready
        </div>

        <GroupBox label="Players" className="flex-1">
          <div className="win95-inset p-2 max-h-48 overflow-y-auto">
            {nonHostPlayers.map((p: any) => (
              <div key={p.id} className="flex items-center gap-2 p-1 text-xs border-b border-window-border-dark">
                <div className="w-8 h-8 bg-secondary border-2 border-window-border-dark flex items-center justify-center overflow-hidden shrink-0">
                  {p.drawing ? (
                    <img src={p.drawing} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">{p.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="flex-1">{p.name}</span>
                {p.drawing ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="text-muted-foreground">Drawing...</span>
                )}
              </div>
            ))}
            {nonHostPlayers.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">
                No players have joined yet...
              </div>
            )}
          </div>
        </GroupBox>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {nonHostPlayers.length} player(s)
          </div>
          <div className="flex gap-2">
            <Button onClick={handleStartPlaying} disabled={!allReady}>
              <Play className="w-3 h-3 mr-1" />
              {allReady ? 'Start Game!' : 'Waiting...'}
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </Window>
  );
};
