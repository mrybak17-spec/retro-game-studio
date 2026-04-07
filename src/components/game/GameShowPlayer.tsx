import React, { useState } from 'react';
import { Window, Button, GroupBox } from '@/components/win95';
import { useGameStore } from '@/store/gameStore';
import { Game, GridGame, SlidesGame, WheelGame, BoardGame, BoardCell, Player } from '@/types/game';
import { Plus, Minus, ChevronLeft, ChevronRight, RotateCcw, X, MessageCircle, Volume2 } from 'lucide-react';

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
  const [pointsPrompt, setPointsPrompt] = useState<{ playerId: string; direction: 'add' | 'subtract' } | null>(null);
  const [pointsValue, setPointsValue] = useState('');
  
  // Board game state
  const [boardPhase, setBoardPhase] = useState<'phase1' | 'phase2'>('phase1');
  const [boardCells, setBoardCells] = useState<BoardCell[][] | null>(null);
  const [dragItem, setDragItem] = useState<{ type: 'color' | 'points'; value: string | number } | null>(null);
  const [dragSourceCell, setDragSourceCell] = useState<{ row: number; col: number } | null>(null);
  const [showBoardAnswer, setShowBoardAnswer] = useState(false);
  const [revealedBoardCell, setRevealedBoardCell] = useState<string | null>(null);

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
    setBoardPhase('phase1');
    setBoardCells(null);
    setRevealedBoardCell(null);
    setShowBoardAnswer(false);
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
    const availableSegments = wheelGame.segments.filter((s) => !usedSegments.has(s.id));

    if (availableSegments.length === 0) return;

    setIsSpinning(true);
    setShowWheelAnswer(false);

    // Use whole turns to guarantee the wheel stops exactly on the chosen segment.
    const extraTurns = 3 + Math.floor(Math.random() * 3); // 3..5
    const segmentCount = availableSegments.length;
    const segmentAngle = 360 / segmentCount;
    const randomIndex = Math.floor(Math.random() * segmentCount);

    // Segment 0 starts at -90deg (12 o'clock). The pointer is also at 12 o'clock.
    // We want the *middle* of the chosen segment to land under the pointer.
    const desiredRotationMod = (360 - (randomIndex + 0.5) * segmentAngle + 360) % 360;
    const currentRotationMod = ((wheelRotation % 360) + 360) % 360;
    const delta = (desiredRotationMod - currentRotationMod + 360) % 360;

    const targetRotation = wheelRotation + extraTurns * 360 + delta;
    const targetSegment = availableSegments[randomIndex];

    setWheelRotation(targetRotation);

    setTimeout(() => {
      setSelectedSegmentIndex(randomIndex);
      setUsedSegments((prev) => new Set([...prev, targetSegment.id]));
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
            {/* Image */}
            {lastCell.imageUrl && (
              <div className="mb-2">
                <img
                  src={lastCell.imageUrl}
                  alt="Question"
                  className="max-w-full max-h-32 object-contain mx-auto border border-window-border-dark"
                />
              </div>
            )}
            {/* Audio */}
            {lastCell.audioUrl && (
              <div className="mb-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <audio src={lastCell.audioUrl} controls className="h-8 flex-1" />
              </div>
            )}
            {/* Text Question */}
            {lastCell.question && (
              <div className="text-sm mb-2">
                <strong>Question:</strong> {lastCell.question}
              </div>
            )}
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

  // Render Board Game
  const renderBoardGame = (game: BoardGame) => {
    // Initialize board cells from game data on first render
    const cells = boardCells || game.cells;
    if (!boardCells) {
      setBoardCells(game.cells.map(row => row.map(c => ({ ...c }))));
    }

    const activeCells = boardCells || cells;

    if (boardPhase === 'phase1') {
      // Phase 1: Admin arranges cards, assigns colors & points
      const allColored = activeCells.flat().every(c => c.teamColor);
      const allPointed = activeCells.flat().every(c => c.points && c.points > 0);
      const canEndPhase1 = allColored && allPointed;

      return (
        <div className="flex-1 flex gap-2">
          {/* Admin tools sidebar */}
          <div className="w-36 flex flex-col gap-2 shrink-0">
            <GroupBox label="Team Colors">
              <div className="flex flex-col gap-2">
                <div
                  className="win95-raised p-2 text-xs text-center cursor-grab font-bold"
                  style={{ backgroundColor: game.teamColor1, color: '#fff' }}
                  draggable
                  onDragStart={(e) => {
                    setDragItem({ type: 'color', value: game.teamColor1 });
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  Team 1
                </div>
                <div
                  className="win95-raised p-2 text-xs text-center cursor-grab font-bold"
                  style={{ backgroundColor: game.teamColor2, color: '#fff' }}
                  draggable
                  onDragStart={(e) => {
                    setDragItem({ type: 'color', value: game.teamColor2 });
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  Team 2
                </div>
              </div>
            </GroupBox>

            <GroupBox label="Points">
              <div className="flex flex-col gap-1">
                {game.pointValues.map(val => (
                  <div
                    key={val}
                    className="win95-raised p-1.5 text-xs text-center cursor-grab font-bold"
                    draggable
                    onDragStart={(e) => {
                      setDragItem({ type: 'points', value: val });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                  >
                    {val} pts
                  </div>
                ))}
              </div>
            </GroupBox>

            <div className="flex-1" />
            <Button
              onClick={() => setBoardPhase('phase2')}
              disabled={!canEndPhase1}
            >
              End Phase 1
            </Button>
            {!canEndPhase1 && (
              <p className="text-xs text-muted-foreground">
                Assign colors and points to all cards first.
              </p>
            )}
          </div>

          {/* Board grid */}
          <div className="flex-1 flex flex-col">
            <div className="text-xs font-bold mb-1">Phase 1: Arrange cards, assign colors & points</div>
            <div
              className="grid gap-1 flex-1"
              style={{ gridTemplateColumns: `80px repeat(${game.columns}, 1fr)` }}
            >
              {Array.from({ length: game.rows }).map((_, rowIdx) => (
                <React.Fragment key={rowIdx}>
                  <div className="win95-raised text-xs font-bold flex items-center justify-center p-1">
                    {game.rowNames[rowIdx] || `Row ${rowIdx + 1}`}
                  </div>
                  {Array.from({ length: game.columns }).map((_, colIdx) => {
                    const cell = activeCells[rowIdx]?.[colIdx];
                    if (!cell) return null;
                    return (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        className="win95-raised text-xs font-bold flex flex-col items-center justify-center p-1 cursor-pointer relative"
                        style={{
                          backgroundColor: cell.teamColor || '#c6c6c6',
                          color: cell.teamColor ? '#fff' : '#333',
                          minHeight: '50px',
                        }}
                        draggable
                        onDragStart={(e) => {
                          setDragSourceCell({ row: rowIdx, col: colIdx });
                          setDragItem(null);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!boardCells) return;
                          const newCells = boardCells.map(r => r.map(c => ({ ...c })));

                          if (dragItem) {
                            // Dropping color or points from sidebar
                            if (dragItem.type === 'color') {
                              newCells[rowIdx][colIdx].teamColor = dragItem.value as string;
                            } else {
                              newCells[rowIdx][colIdx].points = dragItem.value as number;
                            }
                          } else if (dragSourceCell) {
                            // Swapping two cards
                            const src = dragSourceCell;
                            const temp = { ...newCells[rowIdx][colIdx] };
                            newCells[rowIdx][colIdx] = { ...newCells[src.row][src.col] };
                            newCells[src.row][src.col] = temp;
                          }

                          setBoardCells(newCells);
                          setDragItem(null);
                          setDragSourceCell(null);
                        }}
                      >
                        <span>{cell.displayText}</span>
                        {cell.points && cell.points > 0 && (
                          <span className="text-xs opacity-80 mt-0.5">{cell.points} pts</span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Phase 2: Standard Q&A like grid
    const lastRevealedCell = revealedBoardCell
      ? activeCells.flat().find(c => c.id === revealedBoardCell)
      : null;

    return (
      <div className="flex-1 flex flex-col gap-2">
        <div className="text-xs font-bold mb-1">Phase 2: Click cards to reveal questions</div>
        <div
          className="grid gap-1 flex-1"
          style={{ gridTemplateColumns: `80px repeat(${game.columns}, 1fr)` }}
        >
          {Array.from({ length: game.rows }).map((_, rowIdx) => (
            <React.Fragment key={rowIdx}>
              <div className="win95-raised text-xs font-bold flex items-center justify-center p-1">
                {game.rowNames[rowIdx] || `Row ${rowIdx + 1}`}
              </div>
              {Array.from({ length: game.columns }).map((_, colIdx) => {
                const cell = activeCells[rowIdx]?.[colIdx];
                if (!cell) return null;
                const isRevealed = revealedCells.has(cell.id);
                return (
                  <button
                    key={`${rowIdx}-${colIdx}`}
                    className="win95-raised text-sm font-bold flex flex-col items-center justify-center transition-all"
                    style={{
                      backgroundColor: isRevealed ? '#666' : (cell.teamColor || '#c6c6c6'),
                      color: isRevealed ? '#999' : '#fff',
                      minHeight: '50px',
                    }}
                    onClick={() => {
                      if (!isRevealed) {
                        setRevealedCells(new Set([...revealedCells, cell.id]));
                        setRevealedBoardCell(cell.id);
                        setShowBoardAnswer(false);
                      }
                    }}
                    disabled={isRevealed}
                  >
                    {isRevealed ? '✓' : cell.displayText}
                    {!isRevealed && cell.points && cell.points > 0 && (
                      <span className="text-xs opacity-80">{cell.points} pts</span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Question Display */}
        {lastRevealedCell && (
          <div className="win95-inset p-3 mt-2">
            {lastRevealedCell.imageUrl && (
              <div className="mb-2">
                <img src={lastRevealedCell.imageUrl} alt="Question" className="max-w-full max-h-32 object-contain mx-auto border border-window-border-dark" />
              </div>
            )}
            {lastRevealedCell.audioUrl && (
              <div className="mb-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <audio src={lastRevealedCell.audioUrl} controls className="h-8 flex-1" />
              </div>
            )}
            {lastRevealedCell.question && (
              <div className="text-sm mb-2"><strong>Question:</strong> {lastRevealedCell.question}</div>
            )}
            {showBoardAnswer ? (
              <div className="text-sm text-green-700"><strong>Answer:</strong> {lastRevealedCell.answer}</div>
            ) : (
              <Button onClick={() => setShowBoardAnswer(true)}>Reveal Answer</Button>
            )}
          </div>
        )}
      </div>
    );
  };

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
      case 'board':
        return renderBoardGame(currentGame as BoardGame);
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
