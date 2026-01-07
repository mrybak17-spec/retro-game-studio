import React, { useState } from 'react';
import { Window, Button, GroupBox, Input, Select } from '@/components/win95';
import { GridGame, GridCell } from '@/types/game';
import { X } from 'lucide-react';

interface GridGameCreatorProps {
  game?: GridGame;
  onSave: (game: GridGame) => void;
  onClose: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyCell = (row: number, col: number): GridCell => ({
  id: generateId(),
  question: '',
  answer: '',
  displayText: `${(row + 1) * 100}`,
  points: (row + 1) * 100,
  revealed: false,
});

const createEmptyCells = (rows: number, cols: number): GridCell[][] => {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => createEmptyCell(row, col))
  );
};

export const GridGameCreator: React.FC<GridGameCreatorProps> = ({
  game,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(game?.name || 'My Grid Game');
  const [columns, setColumns] = useState(game?.columns || 5);
  const [rows, setRows] = useState(game?.rows || 5);
  const [columnNames, setColumnNames] = useState<string[]>(
    game?.columnNames || Array(6).fill('').map((_, i) => `Category ${i + 1}`)
  );
  const [cells, setCells] = useState<GridCell[][]>(
    game?.cells || createEmptyCells(5, 5)
  );
  const [primaryColor, setPrimaryColor] = useState(game?.primaryColor || '#1e3a8a');
  const [secondaryColor, setSecondaryColor] = useState(game?.secondaryColor || '#fbbf24');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const handleDimensionChange = (newRows: number, newCols: number) => {
    const newCells = createEmptyCells(newRows, newCols);
    // Preserve existing cell data
    for (let r = 0; r < Math.min(rows, newRows); r++) {
      for (let c = 0; c < Math.min(columns, newCols); c++) {
        if (cells[r]?.[c]) {
          newCells[r][c] = cells[r][c];
        }
      }
    }
    setCells(newCells);
    setRows(newRows);
    setColumns(newCols);
  };

  const handleCellUpdate = (row: number, col: number, updates: Partial<GridCell>) => {
    const newCells = [...cells];
    newCells[row][col] = { ...newCells[row][col], ...updates };
    setCells(newCells);
  };

  const handleColumnNameChange = (index: number, value: string) => {
    const newNames = [...columnNames];
    newNames[index] = value;
    setColumnNames(newNames);
  };

  const handleSave = () => {
    const gridGame: GridGame = {
      id: game?.id || generateId(),
      type: 'grid',
      name,
      columns,
      rows,
      columnNames: columnNames.slice(0, columns),
      rowNames: [],
      cells,
      primaryColor,
      secondaryColor,
    };
    onSave(gridGame);
  };

  const currentCell = selectedCell ? cells[selectedCell.row]?.[selectedCell.col] : null;

  return (
    <Window
      title="Grid Game Creator"
      onClose={onClose}
      width={800}
      height={600}
      initialPosition={{ x: 50, y: 30 }}
      statusBar={
        <span className="win95-statusbar-section flex-1">
          {selectedCell
            ? `Editing: Row ${selectedCell.row + 1}, Column ${selectedCell.col + 1}`
            : 'Click a cell to edit'}
        </span>
      }
    >
      <div className="flex h-full gap-2 p-2">
        {/* Left Panel - Settings */}
        <div className="w-48 flex flex-col gap-2">
          <GroupBox label="Game Settings">
            <div className="flex flex-col gap-2">
              <Input
                label="Game Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Select
                label="Columns"
                value={columns}
                onChange={(e) => handleDimensionChange(rows, Number(e.target.value))}
                options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
              />
              <Select
                label="Rows"
                value={rows}
                onChange={(e) => handleDimensionChange(Number(e.target.value), columns)}
                options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
              />
            </div>
          </GroupBox>

          <GroupBox label="Colors">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">Primary:</span>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-6"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Secondary:</span>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-8 h-6"
                />
              </div>
            </div>
          </GroupBox>

          <div className="flex-1" />
          
          <div className="flex gap-1">
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={onClose}>Cancel</Button>
          </div>
        </div>

        {/* Center - Grid Preview */}
        <div className="flex-1 flex flex-col">
          <GroupBox label="Grid Preview" className="flex-1">
            <div className="h-full flex flex-col">
              {/* Column Headers */}
              <div
                className="grid gap-1 mb-1"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {Array.from({ length: columns }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    value={columnNames[i] || ''}
                    onChange={(e) => handleColumnNameChange(i, e.target.value)}
                    className="win95-input text-center text-xs font-bold"
                    placeholder={`Cat ${i + 1}`}
                  />
                ))}
              </div>
              
              {/* Grid Cells */}
              <div
                className="grid gap-1 flex-1"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {Array.from({ length: rows }).map((_, rowIdx) =>
                  Array.from({ length: columns }).map((_, colIdx) => {
                    const cell = cells[rowIdx]?.[colIdx];
                    const isSelected =
                      selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                    const hasContent = cell?.question && cell?.answer;
                    
                    return (
                      <button
                        key={`${rowIdx}-${colIdx}`}
                        className={`win95-grid-cell text-sm ${
                          isSelected ? 'ring-2 ring-titlebar' : ''
                        }`}
                        style={{
                          backgroundColor: hasContent ? secondaryColor : undefined,
                          color: hasContent ? '#000' : '#666',
                        }}
                        onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                      >
                        {cell?.displayText || '?'}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </GroupBox>
        </div>

        {/* Right Panel - Cell Editor */}
        <div className="w-56">
          <GroupBox label="Cell Editor">
            {selectedCell && currentCell ? (
              <div className="flex flex-col gap-2">
                <Input
                  label="Display Text"
                  value={currentCell.displayText}
                  onChange={(e) =>
                    handleCellUpdate(selectedCell.row, selectedCell.col, {
                      displayText: e.target.value,
                    })
                  }
                />
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs">Question</label>
                  <textarea
                    className="win95-input h-16 resize-none"
                    value={currentCell.question}
                    onChange={(e) =>
                      handleCellUpdate(selectedCell.row, selectedCell.col, {
                        question: e.target.value,
                      })
                    }
                    placeholder="Enter the question..."
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs">Answer</label>
                  <textarea
                    className="win95-input h-16 resize-none"
                    value={currentCell.answer}
                    onChange={(e) =>
                      handleCellUpdate(selectedCell.row, selectedCell.col, {
                        answer: e.target.value,
                      })
                    }
                    placeholder="Enter the answer..."
                  />
                </div>
                <Input
                  label="Points"
                  type="number"
                  value={currentCell.points || 0}
                  onChange={(e) =>
                    handleCellUpdate(selectedCell.row, selectedCell.col, {
                      points: Number(e.target.value),
                    })
                  }
                />
                <Button
                  onClick={() => setSelectedCell(null)}
                  className="mt-2"
                >
                  Done
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Click a cell on the grid to edit its content
              </p>
            )}
          </GroupBox>
        </div>
      </div>
    </Window>
  );
};
