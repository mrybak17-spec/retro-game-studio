import React, { useState } from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { useGameStore } from '@/store/gameStore';
import { Game, GridGame, SlidesGame, WheelGame, Player } from '@/types/game';
import { Plus, Minus, ChevronLeft, ChevronRight, RotateCcw, X, MessageCircle } from 'lucide-react';

interface GameShowPlayerProps {
  onClose: () => void;
}

export const GameShowPlayer: React.FC<GameShowPlayerProps> = ({ onClose }) => {
  const { currentSession, updatePlayerPoints, advanceToNextGame, endSession } = useGameStore();
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [showAnswerForSlide, setShowAnswerForSlide] = useState<Set<number>>(new Set());
  const [showGridAnswer, setShowGridAnswer] = useState(false);
  const [showWheelAnswer, setShowWheelAnswer] = useState(false);
  const [usedSegments, setUsedSegments] = useState<Set<string>>(new Set());
  const [chatMessages, setChatMessages] = useState<{player: string, message: string}[]>([]);
  const [chatInput, setChatInput] = useState('');

  if (!currentSession) {
    return null;
  }

  const { gameShow, currentGameIndex, players } = currentSession;
  const currentGame = gameShow.games[currentGameIndex];
  const nonHostPlayers = players.filter(p => !p.isHost);
  const host = players.find(p => p.isHost);

  const handleClose = () => {
    endSession();
    onClose();
  };

  const handleNextGame = () => {
    setRevealedCells(new Set());
    setCurrentSlideIndex(0);
    setSelectedSegmentIndex(null);
    setShowAnswerForSlide(new Set());
    setShowGridAnswer(false);
    setShowWheelAnswer(false);
    setUsedSegments(new Set());
    advanceToNextGame();
  };

  const handleCellClick = (cellId: string) => {
    if (!revealedCells.has(cellId)) {
      setRevealedCells(new Set([...revealedCells, cellId]));
      setShowGridAnswer(false);
    }
  };

  const handleSpinWheel = () => {
    if (isSpinning) return;
    
    const wheelGame = currentGame as WheelGame;
    const availableSegments = wheelGame.segments.filter(s => !usedSegments.has(s.id));
    
    if (availableSegments.length === 0) return;
    
    setIsSpinning(true);
    setShowWheelAnswer(false);
    
    const spins = 3 + Math.random() * 3;
    const segmentCount = availableSegments.length;
    const segmentAngle = 360 / segmentCount;
    const randomIndex = Math.floor(Math.random() * segmentCount);
    
    // The pointer is at the top (12 o'clock position)
    // Segments start at -90deg (also 12 o'clock), so segment 0 is at top
    // To land on segment N, we need to rotate so that segment N is at the top
    // Each segment spans from (index * segmentAngle) to ((index + 1) * segmentAngle)
    // We want the middle of the segment to be at the pointer
    const segmentMiddle = randomIndex * segmentAngle + segmentAngle / 2;
    // We need to rotate the wheel so this segment's middle is at top (0 degrees from pointer's perspective)
    // Since wheel rotates clockwise, we subtract from 360 to get the correct position
    const targetRotation = wheelRotation + spins * 360 + (360 - segmentMiddle);
    
    // Store which segment we're targeting BEFORE the spin
    const targetSegment = availableSegments[randomIndex];
    
    setWheelRotation(targetRotation);
    
    setTimeout(() => {
      setSelectedSegmentIndex(randomIndex);
      // Mark segment as used
      setUsedSegments(new Set([...usedSegments, targetSegment.id]));
      setIsSpinning(false);
    }, 3000);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !host) return;
    setChatMessages([...chatMessages, { player: host.name, message: chatInput }]);
    setChatInput('');
  };

  // Render Players Panel (Left Side)
  const renderPlayersPanel = () => (
    <div className="w-48 flex flex-col gap-1 shrink-0">
      <GroupBox label="Players" className="flex-1">
        <div className="flex flex-col gap-2">
          {nonHostPlayers.map((player) => (
            <div key={player.id} className="win95-raised p-2">
              <div className="flex items-center gap-2 mb-1">
                {/* Player avatar placeholder */}
                <div className="w-10 h-10 bg-secondary border-2 border-window-border-dark flex items-center justify-center text-xs">
                  {player.drawing ? (
                    <img src={player.drawing} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    player.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">{player.name}</div>
                  {player.isFake && <span className="text-xs text-muted-foreground">(Test)</span>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-pixel">{player.points} pts</span>
                <div className="flex gap-0.5">
                  <Button variant="icon" onClick={() => updatePlayerPoints(player.id, -100)} title="-100">
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button variant="icon" onClick={() => updatePlayerPoints(player.id, 100)} title="+100">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GroupBox>

      <GroupBox label="Host">
        <div className="text-xs">
          <strong>{host?.name}</strong>
        </div>
      </GroupBox>
    </div>
  );

  // Render Grid Game
  const renderGridGame = (game: GridGame) => {
    const lastRevealedCellId = Array.from(revealedCells).pop();
    const lastCell = lastRevealedCellId 
      ? game.cells.flat().find(c => c.id === lastRevealedCellId) 
      : null;

    return (
      <div className="flex-1 flex flex-col gap-2">
        {/* Column Headers */}
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${game.columns}, 1fr)` }}
        >
          {game.columnNames.slice(0, game.columns).map((name, i) => (
            <div
              key={i}
              className="text-center text-xs font-bold p-1 truncate"
              style={{ backgroundColor: game.primaryColor, color: '#fff' }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          className="grid gap-1 flex-1"
          style={{ gridTemplateColumns: `repeat(${game.columns}, 1fr)` }}
        >
          {game.cells.flat().map((cell) => {
            const isRevealed = revealedCells.has(cell.id);
            return (
              <button
                key={cell.id}
                className="win95-raised text-sm font-bold flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isRevealed ? '#666' : game.secondaryColor,
                  color: isRevealed ? '#999' : '#000',
                }}
                onClick={() => handleCellClick(cell.id)}
                disabled={isRevealed}
              >
                {isRevealed ? '✓' : cell.displayText}
              </button>
            );
          })}
        </div>

        {/* Question Display */}
        {lastCell && (
          <div className="win95-inset p-3 mt-2">
            <div className="text-sm mb-2">
              <strong>Question:</strong> {lastCell.question}
            </div>
            {showGridAnswer ? (
              <div className="text-sm text-green-700">
                <strong>Answer:</strong> {lastCell.answer}
              </div>
            ) : (
              <Button onClick={() => setShowGridAnswer(true)}>Reveal Answer</Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Slides Game
  const renderSlidesGame = (game: SlidesGame) => {
    const slide = game.slides[currentSlideIndex];
    if (!slide) return null;

    return (
      <div className="flex-1 flex flex-col">
        <div
          className="flex-1 flex flex-col items-center justify-center p-4 relative"
          style={{ backgroundColor: game.backgroundColor, color: game.textColor }}
        >
          {slide.imageUrl && (
            <img
              src={slide.imageUrl}
              alt="Slide"
              className="max-w-full max-h-48 object-contain mb-4"
            />
          )}
          <p className="text-center font-pixel text-xl">
            {slide.text || 'No content'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <Button
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-4 text-sm">
            {currentSlideIndex + 1} / {game.slides.length}
          </span>
          <Button
            onClick={() => setCurrentSlideIndex(Math.min(game.slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === game.slides.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Question/Answer - per slide */}
        {slide.question && (
          <div className="win95-inset p-3 mt-2">
            <div className="text-sm mb-2">
              <strong>Question:</strong> {slide.question}
            </div>
            {showAnswerForSlide.has(currentSlideIndex) ? (
              <div className="text-sm text-green-700">
                <strong>Answer:</strong> {slide.answer}
              </div>
            ) : (
              <Button onClick={() => setShowAnswerForSlide(new Set([...showAnswerForSlide, currentSlideIndex]))}>
                Reveal Answer
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Wheel Game
  const renderWheelGame = (game: WheelGame) => {
    // Filter out used segments
    const availableSegments = game.segments.filter(s => !usedSegments.has(s.id));
    const size = 280;
    const center = size / 2;
    const radius = 120;
    const segmentAngle = availableSegments.length > 0 ? 360 / availableSegments.length : 360;

    // Get the last selected segment (before it was removed)
    const lastUsedSegmentId = Array.from(usedSegments).pop();
    const selectedSegment = lastUsedSegmentId 
      ? game.segments.find(s => s.id === lastUsedSegmentId) 
      : null;

    return (
      <div className="flex-1 flex flex-col items-center gap-4">
        <div className="relative">
          <svg
            width={size}
            height={size}
            style={{
              transform: `rotate(${wheelRotation}deg)`,
              transition: isSpinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            }}
          >
            {availableSegments.length > 0 ? (
              availableSegments.map((segment, index) => {
                const startAngle = index * segmentAngle - 90;
                const endAngle = startAngle + segmentAngle;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const x1 = center + radius * Math.cos(startRad);
                const y1 = center + radius * Math.sin(startRad);
                const x2 = center + radius * Math.cos(endRad);
                const y2 = center + radius * Math.sin(endRad);
                const largeArc = segmentAngle > 180 ? 1 : 0;
                const pathD = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                const textAngle = startAngle + segmentAngle / 2;
                const textRad = (textAngle * Math.PI) / 180;
                const textRadius = radius * 0.65;
                const textX = center + textRadius * Math.cos(textRad);
                const textY = center + textRadius * Math.sin(textRad);

                return (
                  <g key={segment.id}>
                    <path d={pathD} fill={segment.color} stroke="#fff" strokeWidth={2} />
                    <text
                      x={textX}
                      y={textY}
                      fill="#fff"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {segment.displayText.slice(0, 10)}
                    </text>
                  </g>
                );
              })
            ) : (
              <text x={center} y={center} textAnchor="middle" fill="#333" fontSize="14">
                All done!
              </text>
            )}
            <circle cx={center} cy={center} r={25} fill="#333" stroke="#fff" strokeWidth={2} />
          </svg>
          {/* Pointer */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0"
            style={{
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '20px solid #333',
            }}
          />
        </div>

        <Button onClick={handleSpinWheel} disabled={isSpinning || availableSegments.length === 0}>
          <RotateCcw className="w-4 h-4 mr-1" />
          {isSpinning ? 'Spinning...' : availableSegments.length === 0 ? 'All segments used!' : 'Spin the Wheel!'}
        </Button>

        <div className="text-xs text-muted-foreground">
          {availableSegments.length} / {game.segments.length} segments remaining
        </div>

        {selectedSegment && !isSpinning && (
          <div className="win95-inset p-3 w-full max-w-md">
            <div className="text-sm font-bold mb-2" style={{ color: selectedSegment.color }}>
              {selectedSegment.displayText}
            </div>
            <div className="text-sm mb-2">
              <strong>Question:</strong> {selectedSegment.question}
            </div>
            {showWheelAnswer ? (
              <div className="text-sm text-green-700">
                <strong>Answer:</strong> {selectedSegment.answer}
              </div>
            ) : (
              <Button onClick={() => setShowWheelAnswer(true)}>Reveal Answer</Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render current game based on type
  const renderCurrentGame = () => {
    if (currentSession.status === 'ended') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h2 className="text-xl font-bold font-pixel">Game Over!</h2>
          <div className="win95-raised p-4">
            <h3 className="text-sm font-bold mb-2">Final Scores:</h3>
            {nonHostPlayers
              .sort((a, b) => b.points - a.points)
              .map((player, index) => (
                <div key={player.id} className="flex justify-between gap-4 text-sm">
                  <span>{index + 1}. {player.name}</span>
                  <span className="font-bold">{player.points} pts</span>
                </div>
              ))}
          </div>
          <Button onClick={handleClose}>Close</Button>
        </div>
      );
    }

    switch (currentGame.type) {
      case 'grid':
        return renderGridGame(currentGame as GridGame);
      case 'slides':
        return renderSlidesGame(currentGame as SlidesGame);
      case 'wheel':
        return renderWheelGame(currentGame as WheelGame);
      default:
        return null;
    }
  };

  return (
    <Window
      title={`${gameShow.name} - ${currentGame?.name || 'Game Over'}`}
      onClose={handleClose}
      width={900}
      height={600}
      resizable
      initialPosition={{ x: 50, y: 30 }}
      statusBar={
        <span className="win95-statusbar-section flex-1">
          Game {currentGameIndex + 1} of {gameShow.games.length}
        </span>
      }
    >
      <div className="flex h-full gap-2 p-2">
        {/* Left - Players */}
        {renderPlayersPanel()}

        {/* Right - Game Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Game Display */}
          <div className="flex-1 flex flex-col min-h-0">
            {renderCurrentGame()}
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-window-border-dark mt-2">
            <div className="flex items-center gap-2 flex-1">
              <MessageCircle className="w-4 h-4" />
              <input
                type="text"
                className="win95-input flex-1 text-xs"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              />
              <Button onClick={handleSendChat}>Send</Button>
            </div>
            
            <div className="flex gap-1">
              {currentGameIndex < gameShow.games.length - 1 && (
                <Button onClick={handleNextGame}>
                  Next Game &gt;
                </Button>
              )}
              {currentGameIndex === gameShow.games.length - 1 && currentSession.status !== 'ended' && (
                <Button onClick={() => advanceToNextGame()}>
                  Finish Show
                </Button>
              )}
              <Button onClick={handleClose}>
                <X className="w-3 h-3 mr-1" />
                End
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
};
