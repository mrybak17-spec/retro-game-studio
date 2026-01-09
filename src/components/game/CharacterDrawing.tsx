import React, { useState, useRef, useEffect } from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { Pencil, PaintBucket, Eraser, Check } from 'lucide-react';

interface CharacterDrawingProps {
  playerName: string;
  onComplete: (drawing: string) => void;
  onClose: () => void;
}

const GRID_SIZE = 32;
const CELL_SIZE = 10;
const WAIST_LINE = 20; // Line where waist starts (only above visible in game)

const PALETTE = [
  '#000000', '#FFFFFF', '#808080', '#C0C0C0',
  '#800000', '#FF0000', '#808000', '#FFFF00',
  '#008000', '#00FF00', '#008080', '#00FFFF',
  '#000080', '#0000FF', '#800080', '#FF00FF',
  '#804000', '#FF8000', '#FFC0CB', '#FFE4C4',
];

// Background color that becomes transparent (not in palette)
const BG_COLOR = '#FF00FF80';

type Tool = 'pencil' | 'bucket' | 'eraser';

export const CharacterDrawing: React.FC<CharacterDrawingProps> = ({
  playerName,
  onComplete,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<string[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(BG_COLOR))
  );
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [tool, setTool] = useState<Tool>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    drawCanvas();
  }, [grid]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw grid lines
    ctx.strokeStyle = '#A0A0A0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw waist line
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, WAIST_LINE * CELL_SIZE);
    ctx.lineTo(GRID_SIZE * CELL_SIZE, WAIST_LINE * CELL_SIZE);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const getCellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
    return { x, y };
  };

  const floodFill = (startX: number, startY: number, newColor: string) => {
    const targetColor = grid[startY][startX];
    if (targetColor === newColor) return;

    const newGrid = grid.map(row => [...row]);
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;
      if (newGrid[y][x] !== targetColor) continue;

      newGrid[y][x] = newColor;
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    setGrid(newGrid);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e);
    if (!cell) return;

    if (tool === 'bucket') {
      floodFill(cell.x, cell.y, selectedColor);
    } else {
      setIsDrawing(true);
      const newGrid = [...grid];
      newGrid[cell.y][cell.x] = tool === 'eraser' ? BG_COLOR : selectedColor;
      setGrid(newGrid);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'bucket') return;
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const newGrid = [...grid];
    newGrid[cell.y][cell.x] = tool === 'eraser' ? BG_COLOR : selectedColor;
    setGrid(newGrid);
  };

  const handleMouseUp = () => setIsDrawing(false);

  const handleClear = () => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(BG_COLOR)));
  };

  const handleComplete = () => {
    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = WAIST_LINE; // Only above waist
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw pixels (transparent for BG_COLOR)
    for (let y = 0; y < WAIST_LINE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x] !== BG_COLOR) {
          ctx.fillStyle = grid[y][x];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    onComplete(canvas.toDataURL());
  };

  return (
    <Window
      title={`Draw Your Character - ${playerName}`}
      onClose={onClose}
      width={500}
      height={480}
      resizable
      initialPosition={{ x: 150, y: 50 }}
    >
      <div className="p-2 flex flex-col h-full gap-2">
        <p className="text-xs text-muted-foreground">
          Draw your character! Only the area <strong>above</strong> the red line will be visible on the podium.
        </p>

        <div className="flex gap-2 flex-1">
          {/* Canvas */}
          <div className="win95-inset p-1 bg-window">
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * CELL_SIZE}
              height={GRID_SIZE * CELL_SIZE}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-crosshair"
            />
          </div>

          {/* Tools & Palette */}
          <div className="flex flex-col gap-2 w-32">
            <GroupBox label="Tools">
              <div className="flex gap-1">
                <button
                  className={`win95-button p-2 ${tool === 'pencil' ? 'win95-pressed' : ''}`}
                  onClick={() => setTool('pencil')}
                  title="Pencil"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  className={`win95-button p-2 ${tool === 'bucket' ? 'win95-pressed' : ''}`}
                  onClick={() => setTool('bucket')}
                  title="Fill Bucket"
                >
                  <PaintBucket className="w-4 h-4" />
                </button>
                <button
                  className={`win95-button p-2 ${tool === 'eraser' ? 'win95-pressed' : ''}`}
                  onClick={() => setTool('eraser')}
                  title="Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>
            </GroupBox>

            <GroupBox label="Colors" className="flex-1">
              <div className="grid grid-cols-4 gap-0.5">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 border-2 ${
                      selectedColor === color ? 'border-black' : 'border-window-border-dark'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs">Current:</span>
                <div
                  className="w-8 h-6 border border-window-border-dark"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>
            </GroupBox>

            <Button onClick={handleClear} className="text-xs">
              Clear All
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-1">
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleComplete}>
            <Check className="w-3 h-3 mr-1" />
            Ready!
          </Button>
        </div>
      </div>
    </Window>
  );
};
