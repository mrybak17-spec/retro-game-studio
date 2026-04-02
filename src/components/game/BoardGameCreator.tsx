import React, { useState } from 'react';
import { Window, Button, GroupBox, Input, Select } from '@/components/win95';
import { BoardGame, BoardCell } from '@/types/game';
import { X, Image, Music, Trash2, Plus } from 'lucide-react';

interface BoardGameCreatorProps {
  game?: BoardGame;
  onSave: (game: BoardGame) => void;
  onClose: () => void;
  saveLabel?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyCell = (row: number, col: number): BoardCell => ({
  id: generateId(),
  question: '',
  answer: '',
  displayText: `Card ${row * 10 + col + 1}`,
  revealed: false,
});

const createEmptyCells = (rows: number, cols: number): BoardCell[][] =>
  Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => createEmptyCell(row, col))
  );

export const BoardGameCreator: React.FC<BoardGameCreatorProps> = ({
  game,
  onSave,
  onClose,
  saveLabel = 'Save',
}) => {
  const [name, setName] = useState(game?.name || 'My Board Game');
  const [columns, setColumns] = useState(game?.columns || 4);
  const [rows, setRows] = useState(game?.rows || 4);
  const [rowNames, setRowNames] = useState<string[]>(
    game?.rowNames || Array(6).fill('').map((_, i) => `Row ${i + 1}`)
  );
  const [cells, setCells] = useState<BoardCell[][]>(
    game?.cells || createEmptyCells(4, 4)
  );
  const [teamColor1, setTeamColor1] = useState(game?.teamColor1 || '#e53e3e');
  const [teamColor2, setTeamColor2] = useState(game?.teamColor2 || '#3182ce');
  const [pointValues, setPointValues] = useState<number[]>(
    game?.pointValues || [20, 50, 70]
  );
  const [newPointValue, setNewPointValue] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const handleDimensionChange = (newRows: number, newCols: number) => {
    const newCells = createEmptyCells(newRows, newCols);
    for (let r = 0; r < Math.min(rows, newRows); r++) {
      for (let c = 0; c < Math.min(columns, newCols); c++) {
        if (cells[r]?.[c]) newCells[r][c] = cells[r][c];
      }
    }
    setCells(newCells);
    setRows(newRows);
    setColumns(newCols);
  };

  const handleCellUpdate = (row: number, col: number, updates: Partial<BoardCell>) => {
    const newCells = cells.map(r => [...r]);
    newCells[row][col] = { ...newCells[row][col], ...updates };
    setCells(newCells);
  };

  const handleRowNameChange = (index: number, value: string) => {
    const newNames = [...rowNames];
    newNames[index] = value;
    setRowNames(newNames);
  };

  const handleAddPointValue = () => {
    const val = parseInt(newPointValue);
    if (!isNaN(val) && val > 0 && !pointValues.includes(val)) {
      setPointValues([...pointValues, val].sort((a, b) => a - b));
      setNewPointValue('');
    }
  };

  const handleRemovePointValue = (val: number) => {
    setPointValues(pointValues.filter(v => v !== val));
  };

  const handleSave = () => {
    const boardGame: BoardGame = {
      id: game?.id || generateId(),
      type: 'board',
      name,
      columns,
      rows,
      rowNames: rowNames.slice(0, rows),
      cells,
      teamColor1,
      teamColor2,
      pointValues,
    };
    onSave(boardGame);
  };

  const currentCell = selectedCell ? cells[selectedCell.row]?.[selectedCell.col] : null;

  return (
    <Window
      title="Board Game Creator"
      onClose={onClose}
      width={950}
      height={700}
      initialPosition={{ x: 193, y: 93 }}
      resizable
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
        <div className="w-48 flex flex-col gap-2 overflow-y-auto">
          <GroupBox label="Game Settings">
            <div className="flex flex-col gap-2">
              <Input label="Game Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Select
                label="Columns"
                value={columns}
                onChange={(e) => handleDimensionChange(rows, Number(e.target.value))}
                options={[2, 3, 4, 5, 6].map(n => ({ value: n, label: String(n) }))}
              />
              <Select
                label="Rows"
                value={rows}
                onChange={(e) => handleDimensionChange(Number(e.target.value), columns)}
                options={[2, 3, 4, 5, 6].map(n => ({ value: n, label: String(n) }))}
              />
            </div>
          </GroupBox>

          <GroupBox label="Team Colors">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs">Team 1:</span>
                <input type="color" value={teamColor1} onChange={(e) => setTeamColor1(e.target.value)} className="w-8 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">Team 2:</span>
                <input type="color" value={teamColor2} onChange={(e) => setTeamColor2(e.target.value)} className="w-8 h-6" />
              </div>
            </div>
          </GroupBox>

          <GroupBox label="Point Values">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap gap-1">
                {pointValues.map(val => (
                  <div key={val} className="win95-raised px-2 py-0.5 text-xs flex items-center gap-1">
                    {val}
                    <button onClick={() => handleRemovePointValue(val)} className="text-red-500 hover:text-red-700">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-1">
                <input
                  type="number"
                  className="win95-input flex-1 text-xs"
                  value={newPointValue}
                  onChange={(e) => setNewPointValue(e.target.value)}
                  placeholder="e.g. 100"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPointValue()}
                />
                <Button variant="icon" onClick={handleAddPointValue} title="Add">
                  <Plus size={12} />
                </Button>
              </div>
            </div>
          </GroupBox>

          <div className="flex-1" />
          <div className="flex gap-1">
            <Button onClick={handleSave}>{saveLabel}</Button>
            <Button onClick={onClose}>Cancel</Button>
          </div>
        </div>

        {/* Center - Grid Preview */}
        <div className="flex-1 flex flex-col">
          <GroupBox label="Board Preview" className="flex-1">
            <div className="h-full flex flex-col">
              {/* Grid with row names */}
              <div
                className="grid gap-1 flex-1"
                style={{ gridTemplateColumns: `80px repeat(${columns}, 1fr)` }}
              >
                {Array.from({ length: rows }).map((_, rowIdx) => (
                  <React.Fragment key={rowIdx}>
                    {/* Row name */}
                    <input
                      type="text"
                      value={rowNames[rowIdx] || ''}
                      onChange={(e) => handleRowNameChange(rowIdx, e.target.value)}
                      className="win95-input text-xs font-bold text-center"
                      placeholder={`Row ${rowIdx + 1}`}
                    />
                    {/* Row cells */}
                    {Array.from({ length: columns }).map((_, colIdx) => {
                      const cell = cells[rowIdx]?.[colIdx];
                      const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                      const hasContent = cell?.question && cell?.answer;
                      return (
                        <button
                          key={`${rowIdx}-${colIdx}`}
                          className={`win95-grid-cell text-sm ${isSelected ? 'ring-2 ring-titlebar' : ''}`}
                          style={{
                            backgroundColor: hasContent ? '#c6c6c6' : undefined,
                            color: hasContent ? '#000' : '#666',
                          }}
                          onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                        >
                          {cell?.displayText || '?'}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </GroupBox>
        </div>

        {/* Right Panel - Cell Editor */}
        <div className="w-64">
          <GroupBox label="Cell Editor">
            {selectedCell && currentCell ? (
              <div className="flex flex-col gap-2 max-h-[450px] overflow-y-auto pr-1">
                <Input
                  label="Display Text"
                  value={currentCell.displayText}
                  onChange={(e) => handleCellUpdate(selectedCell.row, selectedCell.col, { displayText: e.target.value })}
                />
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs">Question</label>
                  <textarea
                    className="win95-input h-12 resize-none"
                    value={currentCell.question}
                    onChange={(e) => handleCellUpdate(selectedCell.row, selectedCell.col, { question: e.target.value })}
                    placeholder="Enter the question..."
                  />
                </div>

                {/* Image Upload */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs flex items-center gap-1"><Image size={12} /> Image (optional)</label>
                  {currentCell.imageUrl ? (
                    <div className="relative">
                      <img src={currentCell.imageUrl} alt="Question" className="w-full h-16 object-cover win95-input" />
                      <button className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded" onClick={() => handleCellUpdate(selectedCell.row, selectedCell.col, { imageUrl: undefined })}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ) : (
                    <label className="win95-button text-xs text-center cursor-pointer flex items-center justify-center gap-1 py-1">
                      <Image size={12} /> Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => handleCellUpdate(selectedCell.row, selectedCell.col, { imageUrl: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  )}
                </div>

                {/* Audio Upload */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs flex items-center gap-1"><Music size={12} /> Audio (optional)</label>
                  {currentCell.audioUrl ? (
                    <div className="flex items-center gap-1">
                      <audio src={currentCell.audioUrl} controls className="h-8 flex-1" style={{ maxWidth: '150px' }} />
                      <button className="p-1 bg-red-500 text-white rounded" onClick={() => handleCellUpdate(selectedCell.row, selectedCell.col, { audioUrl: undefined })}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="win95-button text-xs text-center cursor-pointer flex items-center justify-center gap-1 py-1">
                      <Music size={12} /> Upload Audio
                      <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => handleCellUpdate(selectedCell.row, selectedCell.col, { audioUrl: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  )}
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-xs">Answer</label>
                  <textarea
                    className="win95-input h-12 resize-none"
                    value={currentCell.answer}
                    onChange={(e) => handleCellUpdate(selectedCell.row, selectedCell.col, { answer: e.target.value })}
                    placeholder="Enter the answer..."
                  />
                </div>
                <Button onClick={() => setSelectedCell(null)} className="mt-2">Done</Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Click a cell on the board to edit its content
              </p>
            )}
          </GroupBox>
        </div>
      </div>
    </Window>
  );
};
