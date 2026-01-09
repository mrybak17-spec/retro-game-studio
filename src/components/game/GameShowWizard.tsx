import React, { useState } from 'react';
import { Window, Button, GroupBox, Input } from '@/components/win95';
import { Game, GameShow, GridGame, SlidesGame, WheelGame, GridCell, Slide, WheelSegment } from '@/types/game';
import { Grid3X3, Presentation, CircleDot, Plus, Trash2, ArrowUp, ArrowDown, Save, ChevronLeft } from 'lucide-react';

interface GameShowWizardProps {
  onSave: (show: GameShow) => void;
  onClose: () => void;
}

type CreatorStep = 'menu' | 'grid' | 'slides' | 'wheel';

const generateId = () => Math.random().toString(36).substr(2, 9);

const getGameIcon = (type: Game['type']) => {
  switch (type) {
    case 'grid': return <Grid3X3 className="w-4 h-4" />;
    case 'slides': return <Presentation className="w-4 h-4" />;
    case 'wheel': return <CircleDot className="w-4 h-4" />;
  }
};

const getGameTypeName = (type: Game['type']) => {
  switch (type) {
    case 'grid': return 'Grid Game';
    case 'slides': return 'Slides Game';
    case 'wheel': return 'Wheel Game';
  }
};

// Default creators for each game type
const createDefaultGridGame = (): GridGame => {
  const columns = 3;
  const rows = 3;
  const cells: GridCell[][] = [];
  
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < columns; c++) {
      cells[r][c] = {
        id: generateId(),
        question: '',
        answer: '',
        displayText: `${(r + 1) * 100}`,
        points: (r + 1) * 100,
      };
    }
  }
  
  return {
    id: generateId(),
    type: 'grid',
    name: 'New Grid Game',
    columns,
    rows,
    columnNames: Array(columns).fill('').map((_, i) => `Category ${i + 1}`),
    rowNames: Array(rows).fill(''),
    cells,
    primaryColor: '#000080',
    secondaryColor: '#FFD700',
  };
};

const createDefaultSlidesGame = (): SlidesGame => ({
  id: generateId(),
  type: 'slides',
  name: 'New Slides Game',
  slides: [
    { id: generateId(), text: 'Slide 1', question: '', answer: '' },
  ],
  backgroundColor: '#000080',
  textColor: '#FFFFFF',
});

const createDefaultWheelGame = (): WheelGame => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  return {
    id: generateId(),
    type: 'wheel',
    name: 'New Wheel Game',
    segments: Array(6).fill(null).map((_, i) => ({
      id: generateId(),
      displayText: `Prize ${i + 1}`,
      question: '',
      answer: '',
      color: colors[i % colors.length],
    })),
  };
};

export const GameShowWizard: React.FC<GameShowWizardProps> = ({ onSave, onClose }) => {
  const [showName, setShowName] = useState('My Game Show');
  const [showDescription, setShowDescription] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [step, setStep] = useState<CreatorStep>('menu');
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  // Game type specific editors
  const [gridGame, setGridGame] = useState<GridGame>(createDefaultGridGame());
  const [slidesGame, setSlidesGame] = useState<SlidesGame>(createDefaultSlidesGame());
  const [wheelGame, setWheelGame] = useState<WheelGame>(createDefaultWheelGame());

  const handleSelectGameType = (type: 'grid' | 'slides' | 'wheel') => {
    setEditingGame(null);
    switch (type) {
      case 'grid':
        setGridGame(createDefaultGridGame());
        break;
      case 'slides':
        setSlidesGame(createDefaultSlidesGame());
        break;
      case 'wheel':
        setWheelGame(createDefaultWheelGame());
        break;
    }
    setStep(type);
  };

  const handleAddGame = () => {
    let newGame: Game;
    switch (step) {
      case 'grid':
        newGame = { ...gridGame };
        break;
      case 'slides':
        newGame = { ...slidesGame };
        break;
      case 'wheel':
        newGame = { ...wheelGame };
        break;
      default:
        return;
    }
    
    if (editingGame) {
      setGames(games.map(g => g.id === editingGame.id ? newGame : g));
    } else {
      setGames([...games, newGame]);
    }
    setEditingGame(null);
    setStep('menu');
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    switch (game.type) {
      case 'grid':
        setGridGame(game as GridGame);
        setStep('grid');
        break;
      case 'slides':
        setSlidesGame(game as SlidesGame);
        setStep('slides');
        break;
      case 'wheel':
        setWheelGame(game as WheelGame);
        setStep('wheel');
        break;
    }
  };

  const handleRemoveGame = (index: number) => {
    setGames(games.filter((_, i) => i !== index));
  };

  const handleMoveGame = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= games.length) return;
    const newGames = [...games];
    [newGames[index], newGames[newIndex]] = [newGames[newIndex], newGames[index]];
    setGames(newGames);
  };

  const handleSaveShow = () => {
    const gameShow: GameShow = {
      id: generateId(),
      name: showName,
      description: showDescription,
      games,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onSave(gameShow);
  };

  const handleBack = () => {
    setStep('menu');
    setEditingGame(null);
  };

  return (
    <Window
      title="New Game Show"
      onClose={onClose}
      width={900}
      height={550}
      resizable
      initialPosition={{ x: 50, y: 30 }}
      statusBar={<span className="win95-statusbar-section flex-1">{games.length} game(s) added</span>}
    >
      <div className="flex h-full">
        {/* Left Panel - Game Creator/Menu */}
        <div className="flex-1 border-r border-window-border-dark flex flex-col">
          {step === 'menu' && (
            <div className="p-4 flex flex-col h-full">
              <h2 className="text-sm font-bold mb-2">Choose a Game Type to Add</h2>
              <div className="flex flex-col gap-2 flex-1">
                {[
                  { id: 'grid' as const, icon: <Grid3X3 className="w-8 h-8" />, title: 'Grid Game', desc: 'Jeopardy-style grid with categories' },
                  { id: 'slides' as const, icon: <Presentation className="w-8 h-8" />, title: 'Slides Game', desc: 'Presentation slides with questions' },
                  { id: 'wheel' as const, icon: <CircleDot className="w-8 h-8" />, title: 'Wheel Game', desc: 'Spin wheel with prizes' },
                ].map((type) => (
                  <button
                    key={type.id}
                    className="win95-raised p-3 flex items-center gap-3 text-left hover:bg-secondary"
                    onClick={() => handleSelectGameType(type.id)}
                  >
                    <div className="text-titlebar">{type.icon}</div>
                    <div>
                      <div className="font-bold text-sm">{type.title}</div>
                      <div className="text-xs text-muted-foreground">{type.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'grid' && (
            <GridGameEditor
              game={gridGame}
              onChange={setGridGame}
              onAdd={handleAddGame}
              onBack={handleBack}
              isEditing={!!editingGame}
            />
          )}

          {step === 'slides' && (
            <SlidesGameEditor
              game={slidesGame}
              onChange={setSlidesGame}
              onAdd={handleAddGame}
              onBack={handleBack}
              isEditing={!!editingGame}
            />
          )}

          {step === 'wheel' && (
            <WheelGameEditor
              game={wheelGame}
              onChange={setWheelGame}
              onAdd={handleAddGame}
              onBack={handleBack}
              isEditing={!!editingGame}
            />
          )}
        </div>

        {/* Right Panel - Show Details & Games List */}
        <div className="w-72 flex flex-col p-2 gap-2">
          <GroupBox label="Show Details">
            <div className="flex flex-col gap-2">
              <Input
                label="Show Name"
                value={showName}
                onChange={(e) => setShowName(e.target.value)}
              />
              <div className="flex flex-col gap-0.5">
                <label className="text-xs">Description</label>
                <textarea
                  className="win95-input h-12 resize-none text-xs"
                  value={showDescription}
                  onChange={(e) => setShowDescription(e.target.value)}
                  placeholder="Optional..."
                />
              </div>
            </div>
          </GroupBox>

          <GroupBox label="Games in Show" className="flex-1">
            <div className="h-48 overflow-y-auto win95-inset">
              {games.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  No games yet. Add games from the left panel.
                </p>
              ) : (
                games.map((game, index) => (
                  <div
                    key={`${game.id}-${index}`}
                    className="flex items-center gap-1 p-1 border-b border-window-border-dark text-xs hover:bg-secondary cursor-pointer"
                    onClick={() => handleEditGame(game)}
                  >
                    <span className="w-4 text-muted-foreground">{index + 1}.</span>
                    {getGameIcon(game.type)}
                    <span className="flex-1 truncate" title={game.name}>{game.name}</span>
                    <button
                      className="win95-button p-0.5"
                      onClick={(e) => { e.stopPropagation(); handleMoveGame(index, 'up'); }}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      className="win95-button p-0.5"
                      onClick={(e) => { e.stopPropagation(); handleMoveGame(index, 'down'); }}
                      disabled={index === games.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      className="win95-button p-0.5"
                      onClick={(e) => { e.stopPropagation(); handleRemoveGame(index); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </GroupBox>

          <div className="flex gap-1">
            <Button onClick={handleSaveShow} disabled={games.length === 0} className="flex-1">
              <Save className="w-3 h-3 mr-1" />
              Save Show
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </Window>
  );
};

// Mini Grid Game Editor
interface GridGameEditorProps {
  game: GridGame;
  onChange: (game: GridGame) => void;
  onAdd: () => void;
  onBack: () => void;
  isEditing: boolean;
}

const GridGameEditor: React.FC<GridGameEditorProps> = ({ game, onChange, onAdd, onBack, isEditing }) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const updateCell = (row: number, col: number, updates: Partial<GridCell>) => {
    const newCells = [...game.cells];
    newCells[row][col] = { ...newCells[row][col], ...updates };
    onChange({ ...game, cells: newCells });
  };

  const updateGridSize = (rows: number, cols: number) => {
    const newCells: GridCell[][] = [];
    for (let r = 0; r < rows; r++) {
      newCells[r] = [];
      for (let c = 0; c < cols; c++) {
        newCells[r][c] = game.cells[r]?.[c] || {
          id: generateId(),
          question: '',
          answer: '',
          displayText: `${(r + 1) * 100}`,
          points: (r + 1) * 100,
        };
      }
    }
    
    const newColNames = [...game.columnNames];
    while (newColNames.length < cols) newColNames.push(`Category ${newColNames.length + 1}`);
    newColNames.length = cols;
    
    onChange({ ...game, rows, columns: cols, cells: newCells, columnNames: newColNames });
  };

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex items-center gap-2 mb-2">
        <Button onClick={onBack} className="text-xs">
          <ChevronLeft className="w-3 h-3" />
        </Button>
        <h3 className="font-bold text-sm flex-1">Grid Game</h3>
      </div>
      
      <div className="flex gap-2 mb-2">
        <Input
          label="Game Name"
          value={game.name}
          onChange={(e) => onChange({ ...game, name: e.target.value })}
          className="flex-1"
        />
        <div className="flex flex-col gap-0.5">
          <label className="text-xs">Size</label>
          <div className="flex gap-1">
            <select
              className="win95-input text-xs w-16"
              value={game.columns}
              onChange={(e) => updateGridSize(game.rows, Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} cols</option>)}
            </select>
            <select
              className="win95-input text-xs w-16"
              value={game.rows}
              onChange={(e) => updateGridSize(Number(e.target.value), game.columns)}
            >
              {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} rows</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Preview */}
      <div className="flex-1 overflow-auto win95-inset p-1">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {game.columnNames.map((name, i) => (
                <th key={i} className="border border-window-border-dark p-1 bg-titlebar text-titlebar-foreground">
                  <input
                    className="w-full bg-transparent text-center text-xs border-none outline-none"
                    value={name}
                    onChange={(e) => {
                      const newNames = [...game.columnNames];
                      newNames[i] = e.target.value;
                      onChange({ ...game, columnNames: newNames });
                    }}
                    placeholder={`Cat ${i + 1}`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {game.cells.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`border border-window-border-dark p-2 text-center cursor-pointer transition-colors ${
                      selectedCell?.row === ri && selectedCell?.col === ci
                        ? 'bg-titlebar text-titlebar-foreground'
                        : cell.question && cell.answer
                        ? 'bg-green-100'
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => setSelectedCell({ row: ri, col: ci })}
                  >
                    {cell.displayText || cell.points}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cell Editor */}
      {selectedCell && (
        <div className="mt-2 p-2 win95-raised">
          <div className="text-xs font-bold mb-1">
            Cell: Row {selectedCell.row + 1}, {game.columnNames[selectedCell.col] || `Col ${selectedCell.col + 1}`}
          </div>
          <div className="flex flex-col gap-1">
            <input
              className="win95-input text-xs"
              placeholder="Question..."
              value={game.cells[selectedCell.row][selectedCell.col].question}
              onChange={(e) => updateCell(selectedCell.row, selectedCell.col, { question: e.target.value })}
            />
            <input
              className="win95-input text-xs"
              placeholder="Answer..."
              value={game.cells[selectedCell.row][selectedCell.col].answer}
              onChange={(e) => updateCell(selectedCell.row, selectedCell.col, { answer: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-1 mt-2">
        <Button onClick={onBack}>Cancel</Button>
        <Button onClick={onAdd}>
          <Plus className="w-3 h-3 mr-1" />
          {isEditing ? 'Update' : 'Add'} Game
        </Button>
      </div>
    </div>
  );
};

// Mini Slides Game Editor
interface SlidesGameEditorProps {
  game: SlidesGame;
  onChange: (game: SlidesGame) => void;
  onAdd: () => void;
  onBack: () => void;
  isEditing: boolean;
}

const SlidesGameEditor: React.FC<SlidesGameEditorProps> = ({ game, onChange, onAdd, onBack, isEditing }) => {
  const [selectedSlide, setSelectedSlide] = useState(0);

  const updateSlide = (index: number, updates: Partial<Slide>) => {
    const newSlides = [...game.slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    onChange({ ...game, slides: newSlides });
  };

  const addSlide = () => {
    onChange({
      ...game,
      slides: [...game.slides, { id: generateId(), text: `Slide ${game.slides.length + 1}`, question: '', answer: '' }],
    });
    setSelectedSlide(game.slides.length);
  };

  const removeSlide = (index: number) => {
    if (game.slides.length <= 1) return;
    onChange({ ...game, slides: game.slides.filter((_, i) => i !== index) });
    if (selectedSlide >= game.slides.length - 1) setSelectedSlide(Math.max(0, selectedSlide - 1));
  };

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex items-center gap-2 mb-2">
        <Button onClick={onBack} className="text-xs">
          <ChevronLeft className="w-3 h-3" />
        </Button>
        <h3 className="font-bold text-sm flex-1">Slides Game</h3>
      </div>

      <Input
        label="Game Name"
        value={game.name}
        onChange={(e) => onChange({ ...game, name: e.target.value })}
        className="mb-2"
      />

      <div className="flex gap-2 flex-1 overflow-hidden">
        {/* Slides List */}
        <div className="w-28 flex flex-col gap-1">
          <div className="win95-inset flex-1 overflow-y-auto">
            {game.slides.map((slide, i) => (
              <div
                key={slide.id}
                className={`p-1 text-xs cursor-pointer flex items-center gap-1 ${
                  selectedSlide === i ? 'bg-titlebar text-titlebar-foreground' : 'hover:bg-secondary'
                }`}
                onClick={() => setSelectedSlide(i)}
              >
                <span className="flex-1 truncate">{i + 1}. {slide.text.substring(0, 10)}</span>
                <button
                  className="text-xs opacity-50 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); removeSlide(i); }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Button onClick={addSlide} className="text-xs">
            <Plus className="w-3 h-3" /> Add Slide
          </Button>
        </div>

        {/* Slide Editor */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs">Slide Text</label>
            <textarea
              className="win95-input h-20 resize-none text-xs"
              value={game.slides[selectedSlide]?.text || ''}
              onChange={(e) => updateSlide(selectedSlide, { text: e.target.value })}
              placeholder="Slide content..."
            />
          </div>
          <input
            className="win95-input text-xs"
            placeholder="Question (optional)..."
            value={game.slides[selectedSlide]?.question || ''}
            onChange={(e) => updateSlide(selectedSlide, { question: e.target.value })}
          />
          <input
            className="win95-input text-xs"
            placeholder="Answer (optional)..."
            value={game.slides[selectedSlide]?.answer || ''}
            onChange={(e) => updateSlide(selectedSlide, { answer: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-1 mt-2">
        <Button onClick={onBack}>Cancel</Button>
        <Button onClick={onAdd}>
          <Plus className="w-3 h-3 mr-1" />
          {isEditing ? 'Update' : 'Add'} Game
        </Button>
      </div>
    </div>
  );
};

// Mini Wheel Game Editor
interface WheelGameEditorProps {
  game: WheelGame;
  onChange: (game: WheelGame) => void;
  onAdd: () => void;
  onBack: () => void;
  isEditing: boolean;
}

const WheelGameEditor: React.FC<WheelGameEditorProps> = ({ game, onChange, onAdd, onBack, isEditing }) => {
  const [selectedSegment, setSelectedSegment] = useState(0);
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F39C12', '#9B59B6'];

  const updateSegment = (index: number, updates: Partial<WheelSegment>) => {
    const newSegments = [...game.segments];
    newSegments[index] = { ...newSegments[index], ...updates };
    onChange({ ...game, segments: newSegments });
  };

  const updateSegmentCount = (count: number) => {
    const newSegments = [...game.segments];
    while (newSegments.length < count) {
      newSegments.push({
        id: generateId(),
        displayText: `Prize ${newSegments.length + 1}`,
        question: '',
        answer: '',
        color: colors[newSegments.length % colors.length],
      });
    }
    newSegments.length = count;
    onChange({ ...game, segments: newSegments });
    if (selectedSegment >= count) setSelectedSegment(count - 1);
  };

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex items-center gap-2 mb-2">
        <Button onClick={onBack} className="text-xs">
          <ChevronLeft className="w-3 h-3" />
        </Button>
        <h3 className="font-bold text-sm flex-1">Wheel Game</h3>
      </div>

      <div className="flex gap-2 mb-2">
        <Input
          label="Game Name"
          value={game.name}
          onChange={(e) => onChange({ ...game, name: e.target.value })}
          className="flex-1"
        />
        <div className="flex flex-col gap-0.5">
          <label className="text-xs">Segments</label>
          <select
            className="win95-input text-xs"
            value={game.segments.length}
            onChange={(e) => updateSegmentCount(Number(e.target.value))}
          >
            {[4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 flex-1 overflow-hidden">
        {/* Wheel Preview */}
        <div className="flex-1 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-48 h-48">
            {game.segments.map((seg, i) => {
              const angle = 360 / game.segments.length;
              const startAngle = i * angle - 90;
              const endAngle = startAngle + angle;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 100 + 90 * Math.cos(startRad);
              const y1 = 100 + 90 * Math.sin(startRad);
              const x2 = 100 + 90 * Math.cos(endRad);
              const y2 = 100 + 90 * Math.sin(endRad);
              const largeArc = angle > 180 ? 1 : 0;
              
              return (
                <g key={seg.id} onClick={() => setSelectedSegment(i)} className="cursor-pointer">
                  <path
                    d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={seg.color}
                    stroke={selectedSegment === i ? '#000' : '#333'}
                    strokeWidth={selectedSegment === i ? 3 : 1}
                  />
                </g>
              );
            })}
            <circle cx="100" cy="100" r="15" fill="#333" />
          </svg>
        </div>

        {/* Segment Editor */}
        <div className="w-48 flex flex-col gap-2">
          <div className="text-xs font-bold">Segment {selectedSegment + 1}</div>
          <input
            className="win95-input text-xs"
            placeholder="Display text..."
            value={game.segments[selectedSegment]?.displayText || ''}
            onChange={(e) => updateSegment(selectedSegment, { displayText: e.target.value })}
          />
          <input
            className="win95-input text-xs"
            placeholder="Question..."
            value={game.segments[selectedSegment]?.question || ''}
            onChange={(e) => updateSegment(selectedSegment, { question: e.target.value })}
          />
          <input
            className="win95-input text-xs"
            placeholder="Answer..."
            value={game.segments[selectedSegment]?.answer || ''}
            onChange={(e) => updateSegment(selectedSegment, { answer: e.target.value })}
          />
          <div className="flex flex-col gap-0.5">
            <label className="text-xs">Color</label>
            <input
              type="color"
              value={game.segments[selectedSegment]?.color || '#FF6B6B'}
              onChange={(e) => updateSegment(selectedSegment, { color: e.target.value })}
              className="w-full h-6"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-1 mt-2">
        <Button onClick={onBack}>Cancel</Button>
        <Button onClick={onAdd}>
          <Plus className="w-3 h-3 mr-1" />
          {isEditing ? 'Update' : 'Add'} Game
        </Button>
      </div>
    </div>
  );
};
