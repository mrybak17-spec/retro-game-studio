import React, { useState } from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { useGameStore } from '@/store/gameStore';
import { Game, GridGame, SlidesGame, WheelGame, Player } from '@/types/game';
import { Plus, Minus, MessageSquare, ChevronLeft, ChevronRight, SkipForward, Trophy } from 'lucide-react';

interface GamePlayScreenProps {
  onClose: () => void;
}

export const GamePlayScreen: React.FC<GamePlayScreenProps> = ({ onClose }) => {
  const { currentSession, updatePlayerPoints, advanceToNextGame, endSession } = useGameStore();
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{ name: string; message: string }[]>([]);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<number | null>(null);
  const [showQuestion, setShowQuestion] = useState<{ question: string; answer: string } | null>(null);

  if (!currentSession || currentSession.status === 'ended') {
    return null;
  }

  const currentGame = currentSession.gameShow.games[currentSession.currentGameIndex];
  const isLastGame = currentSession.currentGameIndex >= currentSession.gameShow.games.length - 1;

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    const host = currentSession.players.find(p => p.isHost);
    setChatMessages([...chatMessages, { name: host?.name || 'Host', message: chatMessage }]);
    setChatMessage('');
  };

  const handleCellClick = (row: number, col: number) => {
    const cellId = `${row}-${col}`;
    if (revealedCells.has(cellId)) return;
    
    const game = currentGame as GridGame;
    const cell = game.cells[row]?.[col];
    if (cell) {
      setShowQuestion({ question: cell.question, answer: cell.answer });
      setRevealedCells(new Set([...revealedCells, cellId]));
    }
  };

  const handleSpinWheel = () => {
    if (wheelSpinning) return;
    const game = currentGame as WheelGame;
    setWheelSpinning(true);
    setWheelResult(null);
    
    setTimeout(() => {
      const result = Math.floor(Math.random() * game.segments.length);
      setWheelResult(result);
      setWheelSpinning(false);
      const segment = game.segments[result];
      if (segment) {
        setShowQuestion({ question: segment.question, answer: segment.answer });
      }
    }, 2000);
  };

  const handleNextGame = () => {
    advanceToNextGame();
    setRevealedCells(new Set());
    setCurrentSlide(0);
    setWheelResult(null);
    setShowQuestion(null);
  };

  const handleEndGame = () => {
    endSession();
    onClose();
  };

  const renderPlayerPanel = (player: Player) => (
    <div key={player.id} className="win95-raised p-2 flex flex-col items-center gap-1">
      {/* Character Drawing */}
      <div className="w-16 h-16 win95-inset bg-secondary flex items-center justify-center overflow-hidden">
        {player.drawing ? (
          <img src={player.drawing} alt={player.name} className="w-full h-full object-contain pixelated" />
        ) : (
          <div className="text-2xl">👤</div>
        )}
      </div>
      {/* Podium */}
      <div className="w-full h-4 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-t" />
      <div className="text-xs font-bold truncate w-full text-center">{player.name}</div>
      <div className="text-sm font-bold text-titlebar">{player.points} pts</div>
      {!player.isHost && (
        <div className="flex gap-0.5">
          <button
            className="win95-button p-0.5"
            onClick={() => updatePlayerPoints(player.id, 100)}
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            className="win95-button p-0.5"
            onClick={() => updatePlayerPoints(player.id, -100)}
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );

  const renderGameContent = () => {
    if (!currentGame) return <div className="flex items-center justify-center h-full text-muted-foreground">No games in show</div>;

    switch (currentGame.type) {
      case 'grid':
        return renderGridGame(currentGame as GridGame);
      case 'slides':
        return renderSlidesGame(currentGame as SlidesGame);
      case 'wheel':
        return renderWheelGame(currentGame as WheelGame);
    }
  };

  const renderGridGame = (game: GridGame) => (
    <div className="h-full flex flex-col p-2">
      <table className="w-full h-full border-collapse">
        <thead>
          <tr>
            {game.columnNames.map((name, i) => (
              <th key={i} className="border-2 border-yellow-600 p-2 bg-titlebar text-titlebar-foreground text-sm font-bold">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {game.cells.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => {
                const cellId = `${ri}-${ci}`;
                const revealed = revealedCells.has(cellId);
                return (
                  <td
                    key={ci}
                    className={`border-2 border-yellow-600 text-center cursor-pointer transition-all ${
                      revealed
                        ? 'bg-secondary text-muted-foreground'
                        : 'bg-titlebar text-yellow-400 hover:bg-titlebar/80'
                    }`}
                    onClick={() => handleCellClick(ri, ci)}
                  >
                    <span className="text-xl font-bold">{revealed ? '✓' : `$${cell.points}`}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSlidesGame = (game: SlidesGame) => (
    <div className="h-full flex flex-col">
      <div 
        className="flex-1 flex items-center justify-center p-8"
        style={{ backgroundColor: game.backgroundColor, color: game.textColor }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold whitespace-pre-wrap">{game.slides[currentSlide]?.text}</p>
          {game.slides[currentSlide]?.imageUrl && (
            <img src={game.slides[currentSlide].imageUrl} alt="" className="max-w-full max-h-48 mx-auto mt-4" />
          )}
        </div>
      </div>
      <div className="flex items-center justify-between p-2 bg-window">
        <Button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm">Slide {currentSlide + 1} of {game.slides.length}</span>
        <div className="flex gap-1">
          {game.slides[currentSlide]?.question && (
            <Button onClick={() => setShowQuestion({ 
              question: game.slides[currentSlide].question!, 
              answer: game.slides[currentSlide].answer || '' 
            })}>
              Show Question
            </Button>
          )}
          <Button onClick={() => setCurrentSlide(Math.min(game.slides.length - 1, currentSlide + 1))} disabled={currentSlide === game.slides.length - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderWheelGame = (game: WheelGame) => {
    const rotation = wheelSpinning ? 1800 + Math.random() * 360 : (wheelResult !== null ? (wheelResult * (360 / game.segments.length) + 180) : 0);
    
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="relative">
          {/* Pointer */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-red-600 z-10" />
          
          <svg 
            viewBox="0 0 200 200" 
            className="w-64 h-64 transition-transform duration-2000"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transitionTimingFunction: wheelSpinning ? 'cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
            }}
          >
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
              const midAngle = startAngle + angle / 2;
              const midRad = (midAngle * Math.PI) / 180;
              const textX = 100 + 55 * Math.cos(midRad);
              const textY = 100 + 55 * Math.sin(midRad);
              
              return (
                <g key={seg.id}>
                  <path
                    d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={seg.color}
                    stroke="#333"
                    strokeWidth={2}
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-bold fill-black"
                    transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                  >
                    {seg.displayText.substring(0, 8)}
                  </text>
                </g>
              );
            })}
            <circle cx="100" cy="100" r="20" fill="#333" stroke="#000" strokeWidth={2} />
          </svg>
        </div>
        
        <Button onClick={handleSpinWheel} disabled={wheelSpinning}>
          {wheelSpinning ? 'Spinning...' : 'Spin the Wheel!'}
        </Button>
        
        {wheelResult !== null && !wheelSpinning && (
          <div className="text-lg font-bold text-titlebar">
            Result: {game.segments[wheelResult]?.displayText}
          </div>
        )}
      </div>
    );
  };

  return (
    <Window
      title={`${currentSession.gameShow.name} - Game ${currentSession.currentGameIndex + 1}/${currentSession.gameShow.games.length}`}
      onClose={handleEndGame}
      width={1000}
      height={600}
      resizable
      initialPosition={{ x: 20, y: 20 }}
    >
      <div className="flex h-full">
        {/* Left Panel - Players */}
        <div className="w-48 border-r border-window-border-dark p-2 flex flex-col gap-2 overflow-y-auto">
          <div className="text-xs font-bold text-center border-b border-window-border-dark pb-1">Players</div>
          {currentSession.players.filter(p => !p.isHost).map(renderPlayerPanel)}
          <div className="flex-1" />
          <div className="text-xs text-center text-muted-foreground">
            Host: {currentSession.players.find(p => p.isHost)?.name}
          </div>
        </div>

        {/* Right Panel - Game + Chat */}
        <div className="flex-1 flex flex-col">
          {/* Game Area */}
          <div className="flex-1 relative">
            {renderGameContent()}
            
            {/* Question Modal */}
            {showQuestion && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                <div className="win95-raised p-4 max-w-md w-full">
                  <h3 className="font-bold text-lg mb-2">Question:</h3>
                  <p className="text-sm mb-4 whitespace-pre-wrap">{showQuestion.question}</p>
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm text-titlebar">Reveal Answer</summary>
                    <p className="mt-2 p-2 bg-secondary text-sm">{showQuestion.answer}</p>
                  </details>
                  <Button onClick={() => setShowQuestion(null)}>Close</Button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar - Chat + Controls */}
          <div className="h-28 border-t border-window-border-dark flex">
            {/* Chat */}
            <div className="flex-1 p-1 flex flex-col">
              <div className="flex-1 win95-inset overflow-y-auto text-xs p-1">
                {chatMessages.map((msg, i) => (
                  <div key={i}><strong>{msg.name}:</strong> {msg.message}</div>
                ))}
              </div>
              <div className="flex gap-1 mt-1">
                <input
                  className="win95-input flex-1 text-xs"
                  placeholder="Type message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                />
                <Button onClick={handleSendChat}>
                  <MessageSquare className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Game Controls */}
            <div className="w-40 p-2 flex flex-col gap-1 border-l border-window-border-dark">
              <div className="text-xs font-bold">{currentGame?.name}</div>
              <div className="flex-1" />
              <Button onClick={handleNextGame} disabled={isLastGame}>
                <SkipForward className="w-3 h-3 mr-1" />
                Next Game
              </Button>
              <Button onClick={handleEndGame}>
                <Trophy className="w-3 h-3 mr-1" />
                End Show
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
};
