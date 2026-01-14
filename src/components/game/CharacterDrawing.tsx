import React, { useState, useRef, useCallback } from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { useGameStore } from '@/store/gameStore';
import { Player } from '@/types/game';
import { Check, RotateCcw, ChevronRight } from 'lucide-react';

interface CharacterDrawingProps {
  onComplete: () => void;
  onClose: () => void;
}

const CANVAS_SIZE = 16; // 16x16 pixel grid
const PIXEL_SIZE = 12;
const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0', '#008000',
  '#FFD700'
];

interface PlayerCanvas {
  playerId: string;
  pixels: (string | null)[][];
}

export const CharacterDrawing: React.FC<CharacterDrawingProps> = ({ onComplete, onClose }) => {
  const { currentSession } = useGameStore();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [playerCanvases, setPlayerCanvases] = useState<Map<string, (string | null)[][]>>(new Map());
  
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!currentSession) return null;

  const nonHostPlayers = currentSession.players.filter(p => !p.isHost);
  const currentPlayer = nonHostPlayers[currentPlayerIndex];

  const getOrCreateCanvas = (playerId: string): (string | null)[][] => {
    if (playerCanvases.has(playerId)) {
      return playerCanvases.get(playerId)!;
    }
    return Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE).fill(null));
  };

  const currentCanvas = currentPlayer ? getOrCreateCanvas(currentPlayer.id) : [];

  const setPixel = (row: number, col: number) => {
    if (!currentPlayer) return;
    
    setPlayerCanvases(prev => {
      const newMap = new Map(prev);
      const canvas = getOrCreateCanvas(currentPlayer.id);
      const newCanvas = canvas.map((r, ri) => 
        r.map((c, ci) => (ri === row && ci === col) ? selectedColor : c)
      );
      newMap.set(currentPlayer.id, newCanvas);
      return newMap;
    });
  };

  const handleMouseDown = (row: number, col: number) => {
    setIsDrawing(true);
    setPixel(row, col);
  };

  const handleMouseMove = (row: number, col: number) => {
    if (isDrawing) {
      setPixel(row, col);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!currentPlayer) return;
    setPlayerCanvases(prev => {
      const newMap = new Map(prev);
      newMap.set(currentPlayer.id, Array(CANVAS_SIZE).fill(null).map(() => Array(CANVAS_SIZE).fill(null)));
      return newMap;
    });
  };

  const canvasToDataUrl = (canvas: (string | null)[][]): string => {
    const svgSize = CANVAS_SIZE * 4;
    const pixelSize = 4;
    let rects = '';
    
    canvas.forEach((row, ri) => {
      row.forEach((color, ci) => {
        if (color) {
          rects += `<rect x="${ci * pixelSize}" y="${ri * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
        }
      });
    });
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}"><rect width="100%" height="100%" fill="#c0c0c0"/>${rects}</svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const handleConfirmPlayer = () => {
    if (!currentPlayer) return;
    
    const canvas = getOrCreateCanvas(currentPlayer.id);
    const dataUrl = canvasToDataUrl(canvas);
    
    // Update player drawing in store
    const { currentSession: session } = useGameStore.getState();
    if (session) {
      useGameStore.setState({
        currentSession: {
          ...session,
          players: session.players.map(p => 
            p.id === currentPlayer.id ? { ...p, drawing: dataUrl } : p
          ),
        },
      });
    }
    
    if (currentPlayerIndex < nonHostPlayers.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      // All players done, move to playing
      const { currentSession: finalSession } = useGameStore.getState();
      if (finalSession) {
        useGameStore.setState({
          currentSession: { ...finalSession, status: 'playing' },
        });
      }
      onComplete();
    }
  };

  if (!currentPlayer) {
    return null;
  }

  return (
    <Window
      title={`Draw Your Character - ${currentPlayer.name}`}
      onClose={onClose}
      width={450}
      height={480}
      initialPosition={{ x: 200, y: 50 }}
    >
      <div className="p-2 flex flex-col gap-2 h-full">
        <div className="text-xs text-center mb-1">
          Player {currentPlayerIndex + 1} of {nonHostPlayers.length}: <strong>{currentPlayer.name}</strong>
        </div>

        <GroupBox label="Canvas" className="flex-1">
          <div className="flex justify-center">
            <div
              ref={canvasRef}
              className="win95-inset p-1 inline-block"
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${CANVAS_SIZE}, ${PIXEL_SIZE}px)`,
                  gap: '1px',
                  backgroundColor: '#808080',
                }}
              >
                {currentCanvas.map((row, ri) =>
                  row.map((color, ci) => (
                    <div
                      key={`${ri}-${ci}`}
                      style={{
                        width: PIXEL_SIZE,
                        height: PIXEL_SIZE,
                        backgroundColor: color || '#c0c0c0',
                        cursor: 'crosshair',
                      }}
                      onMouseDown={() => handleMouseDown(ri, ci)}
                      onMouseMove={() => handleMouseMove(ri, ci)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </GroupBox>

        <GroupBox label="Colors">
          <div className="flex flex-wrap gap-1 justify-center">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`w-5 h-5 border-2 ${
                  selectedColor === color 
                    ? 'border-titlebar' 
                    : 'border-window-border-dark'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </GroupBox>

        <div className="flex justify-between gap-2">
          <Button onClick={clearCanvas}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Clear
          </Button>
          <div className="flex gap-1">
            <Button onClick={handleConfirmPlayer}>
              <Check className="w-3 h-3 mr-1" />
              {currentPlayerIndex < nonHostPlayers.length - 1 ? 'Next Player' : 'Start Game'}
              {currentPlayerIndex < nonHostPlayers.length - 1 && <ChevronRight className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Preview of completed drawings */}
        {currentPlayerIndex > 0 && (
          <div className="flex gap-2 justify-center mt-1">
            {nonHostPlayers.slice(0, currentPlayerIndex).map(p => {
              const drawing = playerCanvases.get(p.id);
              const dataUrl = drawing ? canvasToDataUrl(drawing) : null;
              return (
                <div key={p.id} className="text-center">
                  <div className="w-8 h-8 win95-raised mx-auto overflow-hidden">
                    {dataUrl && <img src={dataUrl} alt={p.name} className="w-full h-full" />}
                  </div>
                  <div className="text-xs truncate w-12">{p.name}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Window>
  );
};
