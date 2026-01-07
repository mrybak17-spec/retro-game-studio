import React from 'react';
import { Window, Button } from '@/components/win95';
import { Game } from '@/types/game';
import { Grid3X3, Presentation, CircleDot, Play, Edit, Trash2 } from 'lucide-react';

interface GamesLibraryProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onPlay: (game: Game) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const getGameIcon = (type: Game['type']) => {
  switch (type) {
    case 'grid':
      return <Grid3X3 className="w-5 h-5" />;
    case 'slides':
      return <Presentation className="w-5 h-5" />;
    case 'wheel':
      return <CircleDot className="w-5 h-5" />;
  }
};

const getGameTypeName = (type: Game['type']) => {
  switch (type) {
    case 'grid':
      return 'Grid Game';
    case 'slides':
      return 'Slides Game';
    case 'wheel':
      return 'Wheel Game';
  }
};

export const GamesLibrary: React.FC<GamesLibraryProps> = ({
  games,
  onEdit,
  onPlay,
  onDelete,
  onClose,
}) => {
  const [selectedGame, setSelectedGame] = React.useState<Game | null>(null);

  return (
    <Window
      title="My Games"
      onClose={onClose}
      width={500}
      height={400}
      initialPosition={{ x: 150, y: 80 }}
      showMenuBar
      menuItems={[
        { label: 'File' },
        { label: 'Edit' },
        { label: 'View' },
        { label: 'Help' },
      ]}
      statusBar={
        <span className="win95-statusbar-section flex-1">
          {games.length} game{games.length !== 1 ? 's' : ''} saved
        </span>
      }
    >
      <div className="flex h-full gap-2 p-1">
        {/* Games List */}
        <div className="flex-1 win95-inset overflow-y-auto">
          {games.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No games yet. Create one to get started!
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-window sticky top-0">
                <tr className="border-b border-window-border-dark">
                  <th className="text-left py-1 px-2">Name</th>
                  <th className="text-left py-1 px-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr
                    key={game.id}
                    className={`cursor-pointer ${
                      selectedGame?.id === game.id
                        ? 'bg-titlebar text-titlebar-foreground'
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => setSelectedGame(game)}
                    onDoubleClick={() => onEdit(game)}
                  >
                    <td className="py-1 px-2 flex items-center gap-2">
                      {getGameIcon(game.type)}
                      {game.name}
                    </td>
                    <td className="py-1 px-2">{getGameTypeName(game.type)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Actions Panel */}
        <div className="w-24 flex flex-col gap-1">
          <Button
            onClick={() => selectedGame && onPlay(selectedGame)}
            disabled={!selectedGame}
          >
            <Play className="w-3 h-3 mr-1" />
            Play
          </Button>
          <Button
            onClick={() => selectedGame && onEdit(selectedGame)}
            disabled={!selectedGame}
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            onClick={() => {
              if (selectedGame) {
                onDelete(selectedGame.id);
                setSelectedGame(null);
              }
            }}
            disabled={!selectedGame}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
          <div className="flex-1" />
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Window>
  );
};
