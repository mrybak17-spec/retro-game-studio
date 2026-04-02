import React, { useState } from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { Grid3X3, Presentation, CircleDot, LayoutGrid, Trash2, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import { Game } from '@/types/game';

interface NewGameWizardProps {
  showName: string;
  games: Game[];
  onShowNameChange: (name: string) => void;
  onGamesChange: (games: Game[]) => void;
  onEditGame: (type: 'grid' | 'slides' | 'wheel', gameIndex: number | null) => void;
  onSaveShow: () => void;
  onPlayShow: () => void;
  onClose: () => void;
}

const getGameIcon = (type: Game['type']) => {
  switch (type) {
    case 'grid':
      return <Grid3X3 className="w-4 h-4" />;
    case 'slides':
      return <Presentation className="w-4 h-4" />;
    case 'wheel':
      return <CircleDot className="w-4 h-4" />;
  }
};

const getGameTypeName = (type: Game['type']) => {
  switch (type) {
    case 'grid':
      return 'Grid';
    case 'slides':
      return 'Slides';
    case 'wheel':
      return 'Wheel';
  }
};

export const NewGameWizard: React.FC<NewGameWizardProps> = ({
  showName,
  games,
  onShowNameChange,
  onGamesChange,
  onEditGame,
  onSaveShow,
  onPlayShow,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<'grid' | 'slides' | 'wheel' | null>(null);
  const [selectedGameIndex, setSelectedGameIndex] = useState<number | null>(null);

  const gameTypes = [
    {
      id: 'grid' as const,
      icon: <Grid3X3 className="w-8 h-8" />,
      title: 'Grid Game',
      description: 'Jeopardy-style trivia grid',
    },
    {
      id: 'slides' as const,
      icon: <Presentation className="w-8 h-8" />,
      title: 'Slides Game',
      description: 'Presentation-based challenges',
    },
    {
      id: 'wheel' as const,
      icon: <CircleDot className="w-8 h-8" />,
      title: 'Wheel Game',
      description: 'Spin to reveal questions',
    },
  ];

  const handleDeleteGame = (index: number) => {
    const newGames = games.filter((_, i) => i !== index);
    onGamesChange(newGames);
    setSelectedGameIndex(null);
  };

  const handleMoveGame = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= games.length) return;
    
    const newGames = [...games];
    [newGames[index], newGames[newIndex]] = [newGames[newIndex], newGames[index]];
    onGamesChange(newGames);
    setSelectedGameIndex(newIndex);
  };

  const handleNext = () => {
    if (!selectedType) return;
    onEditGame(selectedType, null); // null = adding new game
  };

  const handleEditSelectedGame = () => {
    if (selectedGameIndex === null) return;
    const game = games[selectedGameIndex];
    onEditGame(game.type, selectedGameIndex);
  };

  return (
    <Window
      title="New Game Show"
      onClose={onClose}
      width={800}
      height={550}
      resizable
      initialPosition={{ x: 268, y: 168 }}
    >
      <div className="flex h-full gap-2 p-2">
        {/* Left Panel - Game Type Selection */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="mb-1">
            <h2 className="text-sm font-bold">Select Challenge Type</h2>
            <p className="text-xs text-muted-foreground">
              Choose a game type and click "Next" to add it.
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-1">
            {gameTypes.map((type) => (
              <button
                key={type.id}
                className={`win95-raised p-2 flex items-center gap-3 text-left ${
                  selectedType === type.id ? 'ring-2 ring-titlebar' : ''
                }`}
                onClick={() => setSelectedType(type.id)}
                onDoubleClick={() => {
                  setSelectedType(type.id);
                  onEditGame(type.id, null);
                }}
              >
                <div className="text-titlebar">{type.icon}</div>
                <div>
                  <div className="font-bold text-sm">{type.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {type.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-1 pt-2 border-t border-window-border-dark">
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={handleNext} disabled={!selectedType}>
              Next &gt;
            </Button>
            {games.length > 0 && (
              <>
                <div className="flex-1" />
                <Button onClick={onPlayShow}>▶ Play</Button>
                <Button onClick={onSaveShow}>Save</Button>
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Game Show List */}
        <div className="w-56 flex flex-col gap-2">
          <GroupBox label="Game Show Name" className="shrink-0">
            <input
              type="text"
              className="win95-input w-full text-sm"
              value={showName}
              onChange={(e) => onShowNameChange(e.target.value)}
              placeholder="Enter show name..."
            />
          </GroupBox>

          <GroupBox label="Challenges" className="flex-1 flex flex-col min-h-0">
            <div className="flex gap-1 mb-1 shrink-0">
              <Button
                variant="icon"
                onClick={() => selectedGameIndex !== null && handleMoveGame(selectedGameIndex, 'up')}
                disabled={selectedGameIndex === null || selectedGameIndex === 0}
                title="Move Up"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="icon"
                onClick={() => selectedGameIndex !== null && handleMoveGame(selectedGameIndex, 'down')}
                disabled={selectedGameIndex === null || selectedGameIndex === games.length - 1}
                title="Move Down"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
              <div className="flex-1" />
              <Button
                variant="icon"
                onClick={handleEditSelectedGame}
                disabled={selectedGameIndex === null}
                title="Edit"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="icon"
                onClick={() => selectedGameIndex !== null && handleDeleteGame(selectedGameIndex)}
                disabled={selectedGameIndex === null}
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            <div className="win95-inset flex-1 overflow-y-auto min-h-0">
              {games.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs p-2 text-center">
                  No challenges yet.<br />Select a type and click Next!
                </div>
              ) : (
                games.map((game, index) => (
                  <div
                    key={game.id + '-' + index}
                    className={`px-2 py-1.5 cursor-pointer text-xs flex items-center gap-2 border-b border-window-border-light ${
                      index === selectedGameIndex
                        ? 'bg-titlebar text-titlebar-foreground'
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => setSelectedGameIndex(index)}
                    onDoubleClick={() => {
                      setSelectedGameIndex(index);
                      onEditGame(game.type, index);
                    }}
                  >
                    <span className="shrink-0">{getGameIcon(game.type)}</span>
                    <span className="flex-1 truncate">{game.name}</span>
                    <span className="text-xs opacity-70">{getGameTypeName(game.type)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="text-xs text-muted-foreground mt-1 shrink-0">
              {games.length} challenge{games.length !== 1 ? 's' : ''} in show
            </div>
          </GroupBox>
        </div>
      </div>
    </Window>
  );
};
