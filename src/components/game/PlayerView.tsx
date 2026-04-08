import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { supabase } from '@/integrations/supabase/client';
import { getLocalPlayerId, subscribeToSession, fetchSessionWithPlayers, updatePlayerDrawing } from '@/lib/multiplayerService';
import { GameShow, Game, GridGame, SlidesGame, WheelGame, BoardGame, BoardCell } from '@/types/game';
import { Volume2, Users } from 'lucide-react';

// ─── Mini drawing component for the player ───
const CANVAS_SIZE = 16;
const PIXEL_SIZE = 10;
const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0', '#008000', '#FFD700'
];

const canvasToDataUrl = (canvas: (string | null)[][]): string => {
  const svgSize = CANVAS_SIZE * 4;
  const pixelSize = 4;
  let rects = '';
  canvas.forEach((row, ri) => {
    row.forEach((color, ci) => {
      if (color) rects += `<rect x="${ci * pixelSize}" y="${ri * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
    });
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}"><rect width="100%" height="100%" fill="#c0c0c0"/>${rects}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

interface PlayerViewProps {
  sessionId: string;
  onClose: () => void;
}

interface SessionData {
  id: string;
  code: string;
  status: string;
  host_id: string;
  game_show_data: any;
  current_game_index: number;
  game_state: any;
}

interface PlayerData {
  id: string;
  player_id: string;
  name: string;
  drawing: string | null;
  points: number;
  is_host: boolean;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ sessionId, onClose }) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const playerId = getLocalPlayerId();

  // Drawing state
  const [pixels, setPixels] = useState<(string | null)[][]>(
    Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE).fill(null))
  );
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingSubmitted, setDrawingSubmitted] = useState(false);

  const loadSessionData = useCallback(async (keepLoading = false) => {
    if (!keepLoading) setLoading(true);
    const data = await fetchSessionWithPlayers(sessionId);
    if (data.session) setSession(data.session as any);
    setPlayers((data.players || []) as any);
    setLoading(false);
  }, [sessionId]);

  // Load initial data + polling fallback when realtime misses an event
  useEffect(() => {
    loadSessionData();

    const interval = window.setInterval(() => {
      loadSessionData(true);
    }, 1500);

    return () => window.clearInterval(interval);
  }, [loadSessionData]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = subscribeToSession(
      sessionId,
      async () => {
        await loadSessionData(true);
      },
      async () => {
        await loadSessionData(true);
      }
    );
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, loadSessionData]);

  const me = players.find(p => p.player_id === playerId);
  const gameShow = session?.game_show_data as GameShow | undefined;
  const nonHostPlayers = players.filter(p => !p.is_host);

  // Drawing handlers
  const setPixel = (row: number, col: number) => {
    setPixels(prev => prev.map((r, ri) => r.map((c, ci) => (ri === row && ci === col) ? selectedColor : c)));
  };

  const handleSubmitDrawing = async () => {
    const dataUrl = canvasToDataUrl(pixels);
    await updatePlayerDrawing(sessionId, playerId, dataUrl);
    setDrawingSubmitted(true);
  };

  if (loading) {
    return (
      <Window title="Game" onClose={onClose} width={400} height={200} initialPosition={{ x: 468, y: 343 }}>
        <div className="p-4 text-center text-sm">Loading game...</div>
      </Window>
    );
  }

  if (!session) {
    return (
      <Window title="Game" onClose={onClose} width={400} height={200} initialPosition={{ x: 468, y: 343 }}>
        <div className="p-4 text-center text-sm">Game session not found.</div>
      </Window>
    );
  }

  // ─── LOBBY ───
  if (session.status === 'lobby') {
    return (
      <Window title={`Lobby - ${session.code}`} onClose={onClose} width={450} height={350} initialPosition={{ x: 443, y: 268 }}>
        <div className="p-4 flex flex-col gap-3">
          <div className="text-sm text-center">Waiting for host to start the game...</div>
          <GroupBox label="Players">
            <div className="win95-inset p-2 max-h-40 overflow-y-auto">
              {players.map(p => (
                <div key={p.id} className="text-xs flex justify-between py-0.5">
                  <span className={p.is_host ? 'font-bold' : ''}>{p.name}</span>
                  <span className="text-muted-foreground">{p.is_host ? '(Host)' : 'Player'}</span>
                </div>
              ))}
            </div>
          </GroupBox>
          <div className="text-xs text-muted-foreground text-center">
            <Users className="w-3 h-3 inline mr-1" />
            {players.length} player(s) in lobby
          </div>
        </div>
      </Window>
    );
  }

  // ─── DRAWING PHASE ───
  if (session.status === 'drawing') {
    if (drawingSubmitted || me?.drawing) {
      return (
        <Window title="Draw Your Character" onClose={onClose} width={400} height={200} initialPosition={{ x: 468, y: 343 }}>
          <div className="p-4 text-center text-sm">
            ✓ Drawing submitted! Waiting for other players...
          </div>
        </Window>
      );
    }

    return (
      <Window title={`Draw Your Character - ${me?.name || 'Player'}`} onClose={onClose} width={500} height={500} initialPosition={{ x: 418, y: 193 }}>
        <div className="p-2 flex flex-col gap-2 h-full">
          <div className="text-xs text-center">Draw your character!</div>
          <GroupBox label="Canvas" className="flex-1">
            <div className="flex justify-center">
              <div
                className="win95-inset p-1 inline-block"
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${CANVAS_SIZE}, ${PIXEL_SIZE}px)`,
                    gap: '1px',
                    backgroundColor: '#808080',
                  }}
                >
                  {pixels.map((row, ri) =>
                    row.map((color, ci) => (
                      <div
                        key={`${ri}-${ci}`}
                        style={{
                          width: PIXEL_SIZE,
                          height: PIXEL_SIZE,
                          backgroundColor: color || '#c0c0c0',
                          cursor: 'crosshair',
                        }}
                        onMouseDown={() => { setIsDrawing(true); setPixel(ri, ci); }}
                        onMouseMove={() => { if (isDrawing) setPixel(ri, ci); }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </GroupBox>
          <GroupBox label="Colors">
            <div className="flex flex-wrap gap-1 justify-center">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`w-5 h-5 border-2 ${selectedColor === c ? 'border-titlebar' : 'border-window-border-dark'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setSelectedColor(c)}
                />
              ))}
            </div>
          </GroupBox>
          <div className="flex justify-end">
            <Button onClick={handleSubmitDrawing}>Submit Drawing</Button>
          </div>
        </div>
      </Window>
    );
  }

  // ─── PLAYING / ENDED ───
  const currentGameIndex = session.current_game_index || 0;
  const currentGame = gameShow?.games?.[currentGameIndex];
  const gameState = session.game_state || {};

  // Also check if status just changed to 'playing' from 'drawing'
  // This ensures players see the game immediately

  return (
    <Window
      title={`${gameShow?.name || 'Game'} - ${session.status === 'ended' ? 'Game Over' : currentGame?.name || 'Game'}`}
      onClose={onClose}
      width={900}
      height={600}
      resizable
      initialPosition={{ x: 50, y: 30 }}
      statusBar={
        <span className="win95-statusbar-section flex-1">
          Game {currentGameIndex + 1} of {gameShow?.games?.length || 0} | You: {me?.name} | {me?.points || 0} pts
        </span>
      }
    >
      <div className="flex h-full gap-2 p-2">
        {/* Players sidebar */}
        <div className="w-44 flex flex-col gap-1 shrink-0">
          <GroupBox label="Players">
            <div className="flex flex-col gap-2">
              {nonHostPlayers.map(p => (
                <div key={p.id} className="win95-raised p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-secondary border-2 border-window-border-dark flex items-center justify-center text-xs overflow-hidden">
                      {p.drawing ? (
                        <img src={p.drawing} alt={p.name} className="w-full h-full object-cover" />
                      ) : p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{p.name}{p.player_id === playerId ? ' (You)' : ''}</div>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-pixel">{p.points} pts</span>
                </div>
              ))}
            </div>
          </GroupBox>
        </div>

        {/* Game area - read only */}
        <div className="flex-1 flex flex-col min-w-0">
          {session.status === 'ended' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <h2 className="text-xl font-bold font-pixel">Game Over!</h2>
              <div className="win95-raised p-4">
                <h3 className="text-sm font-bold mb-2">Final Scores:</h3>
                {nonHostPlayers
                  .sort((a, b) => b.points - a.points)
                  .map((p, i) => (
                    <div key={p.id} className="flex justify-between gap-4 text-sm">
                      <span>{i + 1}. {p.name}</span>
                      <span className="font-bold">{p.points} pts</span>
                    </div>
                  ))}
              </div>
              <Button onClick={onClose}>Close</Button>
            </div>
          ) : currentGame ? (
            <PlayerGameView game={currentGame} gameState={gameState} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm">Waiting for host...</div>
          )}
        </div>
      </div>
    </Window>
  );
};

// ─── Read-only game view for players ───
const PlayerGameView: React.FC<{ game: Game; gameState: any }> = ({ game, gameState }) => {
  const revealedCells = new Set<string>(gameState.revealedCells || []);
  const currentSlideIndex = gameState.currentSlideIndex || 0;
  const showAnswer = gameState.showAnswer || false;
  const selectedSegmentId = gameState.selectedSegmentId || null;
  const boardPhase = gameState.boardPhase || 'phase1';

  switch (game.type) {
    case 'grid': {
      const g = game as GridGame;
      const lastRevealedId = gameState.lastRevealedCellId;
      const lastCell = lastRevealedId ? g.cells.flat().find(c => c.id === lastRevealedId) : null;

      return (
        <div className="flex-1 flex flex-col gap-2">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${g.columns}, 1fr)` }}>
            {g.columnNames.slice(0, g.columns).map((name, i) => (
              <div key={i} className="text-center text-xs font-bold p-1 truncate" style={{ backgroundColor: g.primaryColor, color: '#fff' }}>
                {name}
              </div>
            ))}
          </div>
          <div className="grid gap-1 flex-1" style={{ gridTemplateColumns: `repeat(${g.columns}, 1fr)` }}>
            {g.cells.flat().map(cell => {
              const isRevealed = revealedCells.has(cell.id);
              return (
                <div
                  key={cell.id}
                  className="win95-raised text-sm font-bold flex items-center justify-center"
                  style={{ backgroundColor: isRevealed ? '#666' : g.secondaryColor, color: isRevealed ? '#999' : '#000' }}
                >
                  {isRevealed ? '✓' : cell.displayText}
                </div>
              );
            })}
          </div>
          {lastCell && (
            <div className="win95-inset p-3 mt-2">
              {lastCell.imageUrl && <img src={lastCell.imageUrl} alt="Q" className="max-w-full max-h-32 object-contain mx-auto mb-2" />}
              {lastCell.audioUrl && (
                <div className="mb-2 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <audio src={lastCell.audioUrl} controls className="h-8 flex-1" />
                </div>
              )}
              {lastCell.question && <div className="text-sm mb-2"><strong>Question:</strong> {lastCell.question}</div>}
              {showAnswer && <div className="text-sm text-green-700"><strong>Answer:</strong> {lastCell.answer}</div>}
            </div>
          )}
        </div>
      );
    }

    case 'slides': {
      const g = game as SlidesGame;
      const slide = g.slides[currentSlideIndex];
      if (!slide) return null;
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4" style={{ backgroundColor: g.backgroundColor, color: g.textColor }}>
          {slide.imageUrl && <img src={slide.imageUrl} alt="Slide" className="max-w-full max-h-48 object-contain mb-4" />}
          <p className="text-center font-pixel text-xl">{slide.text || 'No content'}</p>
          {slide.question && (
            <div className="win95-inset p-3 mt-4 bg-background text-foreground">
              <div className="text-sm mb-2"><strong>Question:</strong> {slide.question}</div>
              {showAnswer && <div className="text-sm text-green-700"><strong>Answer:</strong> {slide.answer}</div>}
            </div>
          )}
          <div className="text-xs mt-2 text-muted-foreground">Slide {currentSlideIndex + 1} / {g.slides.length}</div>
        </div>
      );
    }

    case 'wheel': {
      const g = game as WheelGame;
      const segment = selectedSegmentId ? g.segments.find(s => s.id === selectedSegmentId) : null;
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-sm text-muted-foreground">Host is spinning the wheel...</div>
          {segment && (
            <div className="win95-inset p-3 w-full max-w-md">
              <div className="text-sm font-bold mb-2" style={{ color: segment.color }}>{segment.displayText}</div>
              <div className="text-sm mb-2"><strong>Question:</strong> {segment.question}</div>
              {showAnswer && <div className="text-sm text-green-700"><strong>Answer:</strong> {segment.answer}</div>}
            </div>
          )}
        </div>
      );
    }

    case 'board': {
      const g = game as BoardGame;
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-sm text-muted-foreground">
            {boardPhase === 'phase1' ? 'Host is setting up the board...' : 'Host is running the board game...'}
          </div>
        </div>
      );
    }

    default:
      return <div className="text-sm">Unknown game type</div>;
  }
};
