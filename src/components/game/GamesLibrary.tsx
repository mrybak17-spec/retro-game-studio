import React from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { Game, GameShow } from '@/types/game';
import { Grid3X3, Presentation, CircleDot, Play, Edit, Trash2, Film } from 'lucide-react';

interface GamesLibraryProps {
  games: Game[];
  gameShows: GameShow[];
  onEdit: (game: Game) => void;
  onEditShow?: (show: GameShow) => void;
  onPlay: (game: Game) => void;
  onPlayShow: (show: GameShow) => void;
  onDelete: (id: string) => void;
  onDeleteShow: (id: string) => void;
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
  gameShows,
  onEdit,
  onEditShow,
  onPlay,
  onPlayShow,
  onDelete,
  onDeleteShow,
  onClose,
}) => {
  const [selectedGame, setSelectedGame] = React.useState<Game | null>(null);
  const [selectedShow, setSelectedShow] = React.useState<GameShow | null>(null);
  const [activeTab, setActiveTab] = React.useState<'shows' | 'games'>('shows');

  const handleTabChange = (tab: 'shows' | 'games') => {
    setActiveTab(tab);
    setSelectedGame(null);
    setSelectedShow(null);
  };

  return (
    <Window
      title="My Games"
      onClose={onClose}
      width={550}
      height={450}
      resizable
      initialPosition={{ x: 150, y: 80 }}
      statusBar={
        <span className="win95-statusbar-section flex-1">
          {gameShows.length} show{gameShows.length !== 1 ? 's' : ''}, {games.length} individual game{games.length !== 1 ? 's' : ''}
        </span>
      }
    >
      <div className="flex flex-col h-full p-1 gap-1">
        {/* Tab buttons */}
        <div className="flex gap-1 border-b border-window-border-dark pb-1">
          <Button
            onClick={() => handleTabChange('shows')}
            variant={activeTab === 'shows' ? 'default' : 'default'}
            className={activeTab === 'shows' ? 'bg-window' : ''}
          >
            <Film className="w-3 h-3 mr-1" />
            Game Shows
          </Button>
          <Button
            onClick={() => handleTabChange('games')}
            variant={activeTab === 'games' ? 'default' : 'default'}
            className={activeTab === 'games' ? 'bg-window' : ''}
          >
            <Grid3X3 className="w-3 h-3 mr-1" />
            Individual Games
          </Button>
        </div>

        <div className="flex flex-1 gap-2 min-h-0">
          {/* Content */}
          <div className="flex-1 win95-inset overflow-y-auto">
            {activeTab === 'shows' ? (
              gameShows.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
                  No game shows yet. Create one using "New Game Show"!
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-window sticky top-0">
                    <tr className="border-b border-window-border-dark">
                      <th className="text-left py-1 px-2">Name</th>
                      <th className="text-left py-1 px-2">Games</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameShows.map((show) => (
                      <tr
                        key={show.id}
                        className={`cursor-pointer ${
                          selectedShow?.id === show.id
                            ? 'bg-titlebar text-titlebar-foreground'
                            : 'hover:bg-secondary'
                        }`}
                        onClick={() => {
                          setSelectedShow(show);
                          setSelectedGame(null);
                        }}
                        onDoubleClick={() => onPlayShow(show)}
                      >
                        <td className="py-1 px-2 flex items-center gap-2">
                          <Film className="w-4 h-4" />
                          {show.name}
                        </td>
                        <td className="py-1 px-2">
                          {show.games.length} game{show.games.length !== 1 ? 's' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              games.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
                  No individual games yet.
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
                        onClick={() => {
                          setSelectedGame(game);
                          setSelectedShow(null);
                        }}
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
              )
            )}
          </div>

          {/* Actions Panel */}
          <div className="w-24 flex flex-col gap-1">
            {activeTab === 'shows' ? (
              <>
                <Button
                  onClick={() => selectedShow && onPlayShow(selectedShow)}
                  disabled={!selectedShow}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Play
                </Button>
                <Button
                  onClick={() => selectedShow && onDeleteShow(selectedShow.id)}
                  disabled={!selectedShow}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
            <div className="flex-1" />
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>

        {/* Show preview */}
        {selectedShow && (
          <GroupBox label={`Games in "${selectedShow.name}"`} className="mt-1">
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
              {selectedShow.games.map((game, index) => (
                <div key={game.id} className="win95-raised px-2 py-1 text-xs flex items-center gap-1">
                  {getGameIcon(game.type)}
                  {index + 1}. {game.name}
                </div>
              ))}
            </div>
          </GroupBox>
        )}
      </div>
    </Window>
  );
};
