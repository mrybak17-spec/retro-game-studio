import React, { useState } from 'react';
import { Window, Button, GroupBox, Input } from '@/components/win95';
import { GameShow, Game } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { Grid3X3, Presentation, CircleDot, Plus, Trash2, ArrowUp, ArrowDown, Users } from 'lucide-react';

interface GameShowCreatorProps {
  show?: GameShow;
  onSave: (show: GameShow) => void;
  onClose: () => void;
  onPlay: (show: GameShow) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getGameIcon = (type: Game['type']) => {
  switch (type) {
    case 'grid': return <Grid3X3 className="w-4 h-4" />;
    case 'slides': return <Presentation className="w-4 h-4" />;
    case 'wheel': return <CircleDot className="w-4 h-4" />;
  }
};

export const GameShowCreator: React.FC<GameShowCreatorProps> = ({
  show,
  onSave,
  onClose,
  onPlay,
}) => {
  const { games } = useGameStore();
  const [name, setName] = useState(show?.name || 'My Game Show');
  const [description, setDescription] = useState(show?.description || '');
  const [showGames, setShowGames] = useState<Game[]>(show?.games || []);

  const handleAddGame = (game: Game) => {
    setShowGames([...showGames, { ...game }]);
  };

  const handleRemoveGame = (index: number) => {
    setShowGames(showGames.filter((_, i) => i !== index));
  };

  const handleMoveGame = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= showGames.length) return;
    const newGames = [...showGames];
    [newGames[index], newGames[newIndex]] = [newGames[newIndex], newGames[index]];
    setShowGames(newGames);
  };

  const handleSave = () => {
    const gameShow: GameShow = {
      id: show?.id || generateId(),
      name,
      description,
      games: showGames,
      createdAt: show?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onSave(gameShow);
  };

  const handlePlay = () => {
    const gameShow: GameShow = {
      id: show?.id || generateId(),
      name,
      description,
      games: showGames,
      createdAt: show?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onPlay(gameShow);
  };

  return (
    <Window
      title="Game Show Creator"
      onClose={onClose}
      onMaximize={() => {}}
      width={700}
      height={500}
      resizable
      initialPosition={{ x: 80, y: 50 }}
      statusBar={<span className="win95-statusbar-section flex-1">{showGames.length} game(s) in show</span>}
    >
      <div className="flex h-full gap-2 p-2">
        {/* Left: Available Games */}
        <div className="w-48 flex flex-col gap-2">
          <GroupBox label="Show Details">
            <div className="flex flex-col gap-2">
              <Input
                label="Show Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="flex flex-col gap-0.5">
                <label className="text-xs">Description</label>
                <textarea
                  className="win95-input h-12 resize-none text-xs"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                />
              </div>
            </div>
          </GroupBox>
          
          <GroupBox label="Available Games" className="flex-1">
            <div className="h-32 overflow-y-auto win95-inset">
              {games.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">No games created yet</p>
              ) : (
                games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center gap-1 p-1 hover:bg-secondary cursor-pointer text-xs"
                    onClick={() => handleAddGame(game)}
                  >
                    {getGameIcon(game.type)}
                    <span className="truncate flex-1">{game.name}</span>
                    <Plus className="w-3 h-3" />
                  </div>
                ))
              )}
            </div>
          </GroupBox>
        </div>

        {/* Right: Show Games Order */}
        <div className="flex-1 flex flex-col">
          <GroupBox label="Games in Show (in order)" className="flex-1">
            <div className="h-full overflow-y-auto win95-inset">
              {showGames.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">
                  Click games on the left to add them to your show
                </p>
              ) : (
                showGames.map((game, index) => (
                  <div
                    key={`${game.id}-${index}`}
                    className="flex items-center gap-2 p-1 border-b border-window-border-dark text-xs"
                  >
                    <span className="w-4 text-muted-foreground">{index + 1}.</span>
                    {getGameIcon(game.type)}
                    <span className="flex-1 truncate">{game.name}</span>
                    <button
                      className="win95-button p-0.5"
                      onClick={() => handleMoveGame(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      className="win95-button p-0.5"
                      onClick={() => handleMoveGame(index, 'down')}
                      disabled={index === showGames.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      className="win95-button p-0.5"
                      onClick={() => handleRemoveGame(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </GroupBox>
          
          <div className="flex gap-1 mt-2 justify-end">
            <Button onClick={handlePlay} disabled={showGames.length === 0}>
              <Users className="w-3 h-3 mr-1" />
              Play
            </Button>
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </Window>
  );
};