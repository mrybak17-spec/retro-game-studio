import React, { useState } from 'react';
import { Window, Button, GroupBox, Input } from '@/components/win95';
import { WheelGame, WheelSegment } from '@/types/game';
import { Plus, Trash2 } from 'lucide-react';

interface WheelGameCreatorProps {
  game?: WheelGame;
  onSave: (game: WheelGame) => void;
  onClose: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const SEGMENT_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];

const createEmptySegment = (index: number): WheelSegment => ({
  id: generateId(),
  displayText: `Prize ${index + 1}`,
  question: '',
  answer: '',
  color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
});

export const WheelGameCreator: React.FC<WheelGameCreatorProps> = ({
  game,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(game?.name || 'My Wheel Game');
  const [segments, setSegments] = useState<WheelSegment[]>(
    game?.segments || Array.from({ length: 6 }, (_, i) => createEmptySegment(i))
  );
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);

  const selectedSegment = selectedSegmentIndex !== null ? segments[selectedSegmentIndex] : null;

  const handleAddSegment = () => {
    if (segments.length >= 12) return;
    setSegments([...segments, createEmptySegment(segments.length)]);
  };

  const handleDeleteSegment = () => {
    if (segments.length <= 2 || selectedSegmentIndex === null) return;
    const newSegments = segments.filter((_, i) => i !== selectedSegmentIndex);
    setSegments(newSegments);
    setSelectedSegmentIndex(null);
  };

  const handleSegmentUpdate = (updates: Partial<WheelSegment>) => {
    if (selectedSegmentIndex === null) return;
    const newSegments = [...segments];
    newSegments[selectedSegmentIndex] = { ...segments[selectedSegmentIndex], ...updates };
    setSegments(newSegments);
  };

  const handleSave = () => {
    const wheelGame: WheelGame = {
      id: game?.id || generateId(),
      type: 'wheel',
      name,
      segments,
    };
    onSave(wheelGame);
  };

  // Calculate wheel SVG
  const renderWheel = () => {
    const size = 220;
    const center = size / 2;
    const radius = 100;
    const segmentAngle = 360 / segments.length;

    return (
      <svg width={size} height={size} className="mx-auto">
        {segments.map((segment, index) => {
          const startAngle = index * segmentAngle - 90;
          const endAngle = startAngle + segmentAngle;
          
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          const x1 = center + radius * Math.cos(startRad);
          const y1 = center + radius * Math.sin(startRad);
          const x2 = center + radius * Math.cos(endRad);
          const y2 = center + radius * Math.sin(endRad);
          
          const largeArc = segmentAngle > 180 ? 1 : 0;
          
          const pathD = `
            M ${center} ${center}
            L ${x1} ${y1}
            A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
            Z
          `;

          const textAngle = startAngle + segmentAngle / 2;
          const textRad = (textAngle * Math.PI) / 180;
          const textRadius = radius * 0.65;
          const textX = center + textRadius * Math.cos(textRad);
          const textY = center + textRadius * Math.sin(textRad);

          return (
            <g key={segment.id}>
              <path
                d={pathD}
                fill={segment.color}
                stroke={selectedSegmentIndex === index ? '#000' : '#fff'}
                strokeWidth={selectedSegmentIndex === index ? 3 : 1}
                className="cursor-pointer"
                onClick={() => setSelectedSegmentIndex(index)}
              />
              <text
                x={textX}
                y={textY}
                fill="#fff"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                className="pointer-events-none"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
              >
                {segment.displayText.slice(0, 8)}
              </text>
            </g>
          );
        })}
        {/* Center circle */}
        <circle cx={center} cy={center} r={20} fill="#333" stroke="#fff" strokeWidth={2} />
        {/* Pointer */}
        <polygon
          points={`${center},${center - radius - 15} ${center - 8},${center - radius + 5} ${center + 8},${center - radius + 5}`}
          fill="#333"
          stroke="#fff"
          strokeWidth={2}
        />
      </svg>
    );
  };

  return (
    <Window
      title="Wheel Game Creator"
      onClose={onClose}
      width={700}
      height={500}
      initialPosition={{ x: 100, y: 60 }}
      statusBar={
        <span className="win95-statusbar-section flex-1">
          {segments.length} segments • Click a segment to edit
        </span>
      }
    >
      <div className="flex h-full gap-2 p-2">
        {/* Left Panel */}
        <div className="w-40 flex flex-col gap-2">
          <GroupBox label="Game Settings">
            <Input
              label="Game Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </GroupBox>

          <GroupBox label="Segments">
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                <Button
                  variant="icon"
                  onClick={handleAddSegment}
                  disabled={segments.length >= 12}
                  title="Add Segment"
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  variant="icon"
                  onClick={handleDeleteSegment}
                  disabled={segments.length <= 2 || selectedSegmentIndex === null}
                  title="Delete Segment"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="win95-inset h-32 overflow-y-auto">
                {segments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className={`px-2 py-1 cursor-pointer text-xs flex items-center gap-1 ${
                      index === selectedSegmentIndex
                        ? 'bg-titlebar text-titlebar-foreground'
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => setSelectedSegmentIndex(index)}
                  >
                    <span
                      className="w-3 h-3 border border-black"
                      style={{ backgroundColor: segment.color }}
                    />
                    {segment.displayText.slice(0, 12)}
                  </div>
                ))}
              </div>
            </div>
          </GroupBox>

          <div className="flex-1" />
          
          <div className="flex gap-1">
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={onClose}>Cancel</Button>
          </div>
        </div>

        {/* Center - Wheel Preview */}
        <div className="flex-1 flex flex-col">
          <GroupBox label="Wheel Preview" className="flex-1">
            <div className="h-full flex items-center justify-center">
              {renderWheel()}
            </div>
          </GroupBox>
        </div>

        {/* Right Panel - Segment Editor */}
        <div className="w-48">
          <GroupBox label="Segment Editor">
            {selectedSegment ? (
              <div className="flex flex-col gap-2">
                <Input
                  label="Display Text"
                  value={selectedSegment.displayText}
                  onChange={(e) => handleSegmentUpdate({ displayText: e.target.value })}
                />
                
                <div className="flex items-center gap-2">
                  <span className="text-xs">Color:</span>
                  <input
                    type="color"
                    value={selectedSegment.color}
                    onChange={(e) => handleSegmentUpdate({ color: e.target.value })}
                    className="w-8 h-6"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-xs">Question</label>
                  <textarea
                    className="win95-input h-14 resize-none"
                    value={selectedSegment.question}
                    onChange={(e) => handleSegmentUpdate({ question: e.target.value })}
                    placeholder="Hidden question..."
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-xs">Answer</label>
                  <textarea
                    className="win95-input h-14 resize-none"
                    value={selectedSegment.answer}
                    onChange={(e) => handleSegmentUpdate({ answer: e.target.value })}
                    placeholder="Answer..."
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Click a segment on the wheel to edit
              </p>
            )}
          </GroupBox>
        </div>
      </div>
    </Window>
  );
};
