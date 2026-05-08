import React, { useState, useEffect, useCallback } from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { Gamepad2, Plus, Minus, ChevronLeft, ChevronRight, Eye, RotateCcw, SkipForward, X, Power } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fetchSessionByCodeAny, sendRemoteCommand } from '@/lib/remoteControl';
import { GameShow, GridGame, SlidesGame, WheelGame, BoardGame } from '@/types/game';

interface ConsoleProps {
  onClose: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ onClose }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);

  const refresh = useCallback(async (sid: string) => {
    const { data: s } = await supabase.from('game_sessions').select('*').eq('id', sid).single();
    const { data: p } = await supabase.from('session_players').select('*').eq('session_id', sid).order('created_at');
    if (s) setSession(s);
    setPlayers(p || []);
  }, []);

  useEffect(() => {
    if (!session?.id) return;
    refresh(session.id);
    const interval = window.setInterval(() => refresh(session.id), 1500);
    const channel = supabase
      .channel(`console-${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${session.id}` }, () => refresh(session.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_players', filter: `session_id=eq.${session.id}` }, () => refresh(session.id))
      .subscribe();
    return () => { window.clearInterval(interval); supabase.removeChannel(channel); };
  }, [session?.id, refresh]);

  const connect = async () => {
    if (!code.trim()) { setError('Enter a code'); return; }
    setLoading(true); setError('');
    try {
      const data = await fetchSessionByCodeAny(code.trim());
      if (!data) throw new Error('Game not found');
      setSession(data.session);
      setPlayers(data.players);
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally { setLoading(false); }
  };

  // ─── Connect screen ───
  if (!session) {
    return (
      <Window title="Console (Remote)" onClose={onClose} width={380} height={300} initialPosition={{ x: 478, y: 293 }}>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <span className="text-sm font-bold">Mobile Remote Control</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the same game code shown on the host's screen to take remote control.
          </p>
          <GroupBox label="Game Code">
            <input
              className="win95-input w-full text-center text-lg font-bold font-pixel tracking-[0.3em] uppercase"
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              onKeyDown={(e) => e.key === 'Enter' && connect()}
            />
          </GroupBox>
          {error && <div className="text-xs text-red-600 win95-inset p-2">{error}</div>}
          <div className="flex gap-2 justify-end">
            <Button onClick={connect} disabled={loading}>
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </Window>
    );
  }

  const gameShow = session.game_show_data as GameShow;
  const currentGameIndex = session.current_game_index || 0;
  const currentGame = gameShow?.games?.[currentGameIndex];
  const gameState = session.game_state || {};
  const sid = session.id;
  const send = (command: any) => sendRemoteCommand(sid, command).catch(console.error);

  const renderGameControls = () => {
    if (!currentGame) return <div className="text-xs">No game loaded.</div>;
    const revealed = new Set<string>(gameState.revealedCells || []);

    switch (currentGame.type) {
      case 'grid': {
        const g = currentGame as GridGame;
        return (
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold">Grid: tap a card to reveal</div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${g.columns}, 1fr)` }}>
              {g.cells.flat().map(cell => {
                const r = revealed.has(cell.id);
                return (
                  <button
                    key={cell.id}
                    className="win95-raised text-xs font-bold p-2 active:translate-y-px"
                    style={{ backgroundColor: r ? '#666' : g.secondaryColor, color: r ? '#999' : '#000', minHeight: 44 }}
                    onClick={() => send({ type: 'revealCell', cellId: cell.id })}
                    disabled={r}
                  >
                    {r ? '✓' : cell.displayText}
                  </button>
                );
              })}
            </div>
            <Button onClick={() => send({ type: 'revealAnswer' })}>
              <Eye className="w-4 h-4 mr-1" /> Reveal Answer
            </Button>
          </div>
        );
      }
      case 'slides': {
        const g = currentGame as SlidesGame;
        const idx = gameState.currentSlideIndex || 0;
        return (
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold">Slide {idx + 1} / {g.slides.length}</div>
            <div className="win95-inset p-2 text-xs min-h-[60px]">
              {g.slides[idx]?.text || '(no text)'}
              {g.slides[idx]?.question && (
                <div className="mt-1"><strong>Q:</strong> {g.slides[idx].question}</div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1">
              <Button onClick={() => send({ type: 'prevSlide' })}><ChevronLeft className="w-4 h-4" /></Button>
              <Button onClick={() => send({ type: 'revealAnswer' })}><Eye className="w-4 h-4" /></Button>
              <Button onClick={() => send({ type: 'nextSlide' })}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        );
      }
      case 'wheel': {
        return (
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold">Wheel</div>
            <Button onClick={() => send({ type: 'spinWheel' })}>
              <RotateCcw className="w-4 h-4 mr-1" /> Spin Wheel
            </Button>
            <Button onClick={() => send({ type: 'revealAnswer' })}>
              <Eye className="w-4 h-4 mr-1" /> Reveal Answer
            </Button>
          </div>
        );
      }
      case 'board': {
        const g = currentGame as BoardGame;
        const phase = gameState.boardPhase || 'phase1';
        const cells = (gameState.boardCells as any) || g.cells; // host syncs in phase2
        return (
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold">Board ({phase})</div>
            {phase === 'phase1' ? (
              <BoardPhase1Controls game={g} sid={sid} send={send} />
            ) : (
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${g.columns}, 1fr)` }}>
                {g.cells.flat().map(cell => {
                  const r = revealed.has(cell.id);
                  return (
                    <button
                      key={cell.id}
                      className="win95-raised text-xs font-bold p-2"
                      style={{ backgroundColor: r ? '#666' : (cell.teamColor || '#c6c6c6'), color: '#fff', minHeight: 44 }}
                      onClick={() => send({ type: 'revealCell', cellId: cell.id })}
                      disabled={r}
                    >
                      {r ? '✓' : cell.displayText}
                    </button>
                  );
                })}
              </div>
            )}
            <Button onClick={() => send({ type: 'revealAnswer' })}>
              <Eye className="w-4 h-4 mr-1" /> Reveal Answer
            </Button>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <Window
      title={`Console - ${session.code}`}
      onClose={onClose}
      width={420}
      height={620}
      resizable
      initialPosition={{ x: 458, y: 50 }}
    >
      <div className="p-2 flex flex-col gap-2 h-full overflow-y-auto bg-window">
        {/* Pilot header */}
        <div className="win95-inset p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold font-pixel">{session.code}</span>
          </div>
          <span className="text-xs text-muted-foreground">{session.status}</span>
        </div>

        <GroupBox label={`Game ${currentGameIndex + 1}/${gameShow?.games?.length || 0}: ${currentGame?.name || ''}`}>
          {renderGameControls()}
        </GroupBox>

        <GroupBox label="Players (tap +/- to score)">
          <div className="flex flex-col gap-1">
            {players.filter(p => !p.is_host).map(p => (
              <PlayerScoreRow key={p.id} player={p} onAdjust={(delta) => send({ type: 'adjustPoints', playerId: p.player_id, delta })} />
            ))}
            {(gameState.fakePlayers || []).map((p: any) => (
              <PlayerScoreRow
                key={p.id}
                player={{ name: `${p.name} (bot)`, points: p.points, drawing: p.drawing }}
                onAdjust={(delta) => send({ type: 'adjustPoints', playerId: p.id, delta })}
              />
            ))}
            {players.filter(p => !p.is_host).length === 0 && (gameState.fakePlayers || []).length === 0 && (
              <div className="text-xs text-muted-foreground">No players yet.</div>
            )}
          </div>
        </GroupBox>

        <div className="grid grid-cols-2 gap-1">
          <Button onClick={() => send({ type: 'nextGame' })}>
            <SkipForward className="w-4 h-4 mr-1" /> Next Game
          </Button>
          <Button onClick={() => { if (confirm('End the show?')) send({ type: 'finish' }); }}>
            <X className="w-4 h-4 mr-1" /> End Show
          </Button>
        </div>

        <Button onClick={onClose}>Disconnect Console</Button>
      </div>
    </Window>
  );
};

const PlayerScoreRow: React.FC<{ player: any; onAdjust: (delta: number) => void }> = ({ player, onAdjust }) => {
  const [showInput, setShowInput] = useState<'add' | 'sub' | null>(null);
  const [val, setVal] = useState('');
  const submit = () => {
    const n = parseInt(val);
    if (!isNaN(n) && n > 0) {
      onAdjust(showInput === 'add' ? n : -n);
    }
    setShowInput(null); setVal('');
  };
  return (
    <div className="win95-raised p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-secondary border border-window-border-dark overflow-hidden shrink-0">
            {player.drawing ? <img src={player.drawing} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">{player.name.charAt(0)}</div>}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">{player.name}</div>
            <div className="text-xs font-pixel">{player.points} pts</div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button onClick={() => { setShowInput('sub'); setVal(''); }}><Minus className="w-3 h-3" /></Button>
          <Button onClick={() => { setShowInput('add'); setVal(''); }}><Plus className="w-3 h-3" /></Button>
        </div>
      </div>
      {showInput && (
        <div className="flex gap-1 mt-2">
          <input
            type="number" inputMode="numeric" autoFocus
            className="win95-input flex-1 text-xs" placeholder="pts"
            value={val} onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); else if (e.key === 'Escape') setShowInput(null); }}
          />
          <Button onClick={submit}>OK</Button>
          <Button onClick={() => setShowInput(null)}><X className="w-3 h-3" /></Button>
        </div>
      )}
    </div>
  );
};

const BoardPhase1Controls: React.FC<{ game: BoardGame; sid: string; send: (cmd: any) => void }> = ({ game, send }) => {
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [pickedPoints, setPickedPoints] = useState<number | null>(null);

  const onCellTap = (cellId: string) => {
    if (pickedColor) {
      send({ type: 'assignBoardColor', cellId, color: pickedColor });
    } else if (pickedPoints !== null) {
      send({ type: 'assignBoardPoints', cellId, points: pickedPoints });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs">Pick a color or points value, then tap a card.</div>
      <div className="flex gap-1">
        {[game.teamColor1, game.teamColor2].map((c, i) => (
          <button
            key={c}
            className="win95-raised text-xs font-bold p-2 flex-1"
            style={{
              backgroundColor: c,
              color: '#fff',
              outline: pickedColor === c ? '3px solid #ffeb3b' : 'none',
              minHeight: 40,
            }}
            onClick={() => { setPickedColor(c); setPickedPoints(null); }}
          >
            Team {i + 1}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {game.pointValues.map(v => (
          <button
            key={v}
            className="win95-raised text-xs font-bold p-2"
            style={{
              outline: pickedPoints === v ? '3px solid #ffeb3b' : 'none',
              minHeight: 40,
            }}
            onClick={() => { setPickedPoints(v); setPickedColor(null); }}
          >
            {v} pts
          </button>
        ))}
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${game.columns}, 1fr)` }}
      >
        {game.cells.flat().map(cell => (
          <button
            key={cell.id}
            className="win95-raised text-xs font-bold p-2"
            style={{
              backgroundColor: cell.teamColor || '#c6c6c6',
              color: cell.teamColor ? '#fff' : '#000',
              minHeight: 44,
            }}
            onClick={() => onCellTap(cell.id)}
            disabled={!pickedColor && pickedPoints === null}
          >
            <div className="truncate">{cell.displayText}</div>
            {cell.points ? <div className="text-[10px] opacity-80">{cell.points} pts</div> : null}
          </button>
        ))}
      </div>
      <Button onClick={() => send({ type: 'endPhase1' })}>End Phase 1 →</Button>
    </div>
  );
};
